import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const EMAIL_SPEC_URL = "https://docs.mailchannels.net/email-api.yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const emailSpecPath = path.join(rootDir, "docs/.openapi/email-api.yaml");
const emailFixturePath = path.join(rootDir, "test/fixtures/email-api-endpoints.json");

const emailMethodMap = {
  "POST /check-domain": { module: "domains", method: "check" },
  "POST /domains/{domain}/dkim-keys": { module: "domains", method: "dkim.create" },
  "GET /domains/{domain}/dkim-keys": { module: "domains", method: "dkim.list" },
  "POST /domains/{domain}/dkim-keys/{selector}/rotate": { module: "domains", method: "dkim.rotate" },
  "PATCH /domains/{domain}/dkim-keys/{selector}": { module: "domains", method: "dkim.updateStatus" },
  "GET /metrics/engagement": { module: "metrics", method: "engagement" },
  "GET /metrics/performance": { module: "metrics", method: "performance" },
  "GET /metrics/recipient-behaviour": { module: "metrics", method: "recipientBehaviour" },
  "GET /metrics/senders/{sender_type}": { module: "metrics", method: "senders" },
  "GET /metrics/volume": { module: "metrics", method: "volume" },
  "POST /send": { module: "emails", method: "send" },
  "POST /send-async": { module: "emails", method: "queue" },
  "POST /sub-account": { module: "subAccounts", method: "create" },
  "GET /sub-account": { module: "subAccounts", method: "list" },
  "DELETE /sub-account/{handle}": { module: "subAccounts", method: "delete" },
  "POST /sub-account/{handle}/activate": { module: "subAccounts", method: "activate" },
  "GET /sub-account/{handle}/api-key": { module: "subAccounts", method: "listApiKeys" },
  "POST /sub-account/{handle}/api-key": { module: "subAccounts", method: "createApiKey" },
  "DELETE /sub-account/{handle}/api-key/{id}": { module: "subAccounts", method: "deleteApiKey" },
  "DELETE /sub-account/{handle}/limit": { module: "subAccounts", method: "deleteLimit" },
  "GET /sub-account/{handle}/limit": { module: "subAccounts", method: "getLimit" },
  "PUT /sub-account/{handle}/limit": { module: "subAccounts", method: "setLimit" },
  "GET /sub-account/{handle}/smtp-password": { module: "subAccounts", method: "listSmtpPasswords" },
  "POST /sub-account/{handle}/smtp-password": { module: "subAccounts", method: "createSmtpPassword" },
  "DELETE /sub-account/{handle}/smtp-password/{id}": { module: "subAccounts", method: "deleteSmtpPassword" },
  "POST /sub-account/{handle}/suspend": { module: "subAccounts", method: "suspend" },
  "GET /sub-account/{handle}/usage": { module: "subAccounts", method: "getUsage" },
  "POST /suppression-list": { module: "suppressions", method: "create" },
  "GET /suppression-list": { module: "suppressions", method: "list" },
  "DELETE /suppression-list/recipients/{recipient}": { module: "suppressions", method: "delete" },
  "GET /usage": { module: "metrics", method: "usage" },
  "DELETE /webhook": { module: "webhooks", method: "deleteAll" },
  "GET /webhook": { module: "webhooks", method: "list" },
  "POST /webhook": { module: "webhooks", method: "create" },
  "GET /webhook-batch": { module: "webhooks", method: "batches" },
  "GET /webhook/public-key": { module: "webhooks", method: "getSigningKey" },
  "POST /webhook/validate": { module: "webhooks", method: "validate" },
  "POST /webhook-batch/{batch_id}/resend": { module: "webhooks", method: "resendBatch" }
};

const refreshSpecs = process.argv.includes("--refresh-specs");

const normalizeYamlScalar = value => value
  .trim()
  .replace(/^['"]|['"]$/g, "");

const fetchText = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.text();
};

const parseYamlOperations = (yaml) => {
  const operations = [];
  const lines = yaml.split(/\r?\n/);
  let activeTopLevel = "";
  let currentPath = null;
  let version = null;

  for (const line of lines) {
    if (/^[^\s][^:]*:\s*$/.test(line)) {
      activeTopLevel = line.slice(0, -1).trim();
      currentPath = null;
      continue;
    }

    if (activeTopLevel === "info") {
      const match = line.match(/^  version:\s*(.+)$/);
      if (match) {
        version = normalizeYamlScalar(match[1]);
      }
    }

    if (activeTopLevel !== "paths") {
      continue;
    }

    const pathMatch = line.match(/^  (\/[^:]+):\s*$/);
    if (pathMatch) {
      currentPath = pathMatch[1];
      continue;
    }

    const methodMatch = line.match(/^    (get|post|put|patch|delete):\s*$/);
    if (methodMatch && currentPath) {
      operations.push({
        httpMethod: methodMatch[1].toUpperCase(),
        path: currentPath
      });
    }
  }

  if (!version) {
    throw new Error("Failed to parse the Email API version from docs/.openapi/email-api.yaml.");
  }

  return { operations, version };
};

const mapOperationsToFixture = (operations, methodMap, apiName) => {
  const missingOperations = [];
  const seenKeys = new Set();

  const endpoints = operations.map(({ httpMethod, path: endpointPath }) => {
    const key = `${httpMethod} ${endpointPath}`;
    const mapping = methodMap[key];
    if (!mapping) {
      missingOperations.push(key);
      return null;
    }

    seenKeys.add(key);
    return {
      ...mapping,
      httpMethod,
      path: endpointPath
    };
  }).filter(endpoint => endpoint !== null);

  const staleMappings = Object.keys(methodMap).filter(key => !seenKeys.has(key));
  if (staleMappings.length) {
    throw new Error(`Stale ${apiName} SDK method mapping entries:\n${staleMappings.join("\n")}`);
  }

  if (missingOperations.length) {
    console.warn(`Unmapped ${apiName} endpoints:\n${missingOperations.join("\n")}`);
  }

  return {
    endpoints,
    unmapped: missingOperations.map((operation) => {
      const [httpMethod, ...pathParts] = operation.split(" ");
      return {
        httpMethod,
        path: pathParts.join(" ")
      };
    })
  };
};

const writeJson = async (filePath, value) => {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
};

if (refreshSpecs) {
  const emailSpec = await fetchText(EMAIL_SPEC_URL);
  await writeFile(emailSpecPath, emailSpec);
}

const emailSpecText = await readFile(emailSpecPath, "utf8");
const emailSpec = parseYamlOperations(emailSpecText);
const emailFixture = mapOperationsToFixture(emailSpec.operations, emailMethodMap, "Email API");

await writeJson(emailFixturePath, {
  version: emailSpec.version,
  endpoints: emailFixture.endpoints,
  unmapped: emailFixture.unmapped
});

console.info(`Wrote ${path.relative(rootDir, emailFixturePath)}`);
