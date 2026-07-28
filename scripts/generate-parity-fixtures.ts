import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const SPEC_URL = "https://docs.mailchannels.com/email-api.yaml";
const FIXTURE_PATH = join(rootDir, "test", "fixtures", "email-api-endpoints.json");
const README_PATH = join(rootDir, "README.md");

const methodMap = {
  "POST /check-domain": { module: "domains", method: "check" },
  "POST /domains/{domain}/dkim-keys": { module: "domains", method: "dkim.create" },
  "GET /domains/{domain}/dkim-keys": { module: "domains", method: "dkim.list" },
  "POST /domains/{domain}/dkim-keys/{selector}/rotate": { module: "domains", method: "dkim.rotate" },
  "PATCH /domains/{domain}/dkim-keys/{selector}": { module: "domains", method: "dkim.updateStatus" },
  "GET /custom-tracking-domains": { module: "domains", method: "customTracking.list" },
  "POST /custom-tracking-domains": { module: "domains", method: "customTracking.create" },
  "PATCH /custom-tracking-domains/{hostname}/{scope}": { module: "domains", method: "customTracking.update" },
  "DELETE /custom-tracking-domains/{hostname}/{scope}": { module: "domains", method: "customTracking.delete" },
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
  "GET /sub-account/{handle}/api-key": { module: "subAccounts", method: "apiKeys.list" },
  "POST /sub-account/{handle}/api-key": { module: "subAccounts", method: "apiKeys.create" },
  "DELETE /sub-account/{handle}/api-key/{id}": { module: "subAccounts", method: "apiKeys.delete" },
  "DELETE /sub-account/{handle}/limit": { module: "subAccounts", method: "limits.delete" },
  "GET /sub-account/{handle}/limit": { module: "subAccounts", method: "limits.get" },
  "PUT /sub-account/{handle}/limit": { module: "subAccounts", method: "limits.set" },
  "GET /sub-account/{handle}/smtp-password": { module: "subAccounts", method: "smtpPasswords.list" },
  "POST /sub-account/{handle}/smtp-password": { module: "subAccounts", method: "smtpPasswords.create" },
  "DELETE /sub-account/{handle}/smtp-password/{id}": { module: "subAccounts", method: "smtpPasswords.delete" },
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

const normalizeYamlScalar = (value: string) => value.trim().replace(/^['"]|['"]$/g, "");

const parseYamlOperations = (yaml: string) => {
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
        version = normalizeYamlScalar(match[1]!);
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
        httpMethod: methodMatch[1]!.toUpperCase(),
        path: currentPath
      });
    }
  }

  if (!version) {
    throw new Error("Failed to parse the Email API version from docs/.openapi/email-api.yaml.");
  }

  return { operations, version };
};

const mapOperationsToFixture = (
  operations: {
    httpMethod: string;
    path: string;
  }[],
  methodMap: Record<string, { module: string, method: string }>,
  apiName: string
) => {
  const missingOperations: string[] = [];
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

const response = await fetch(SPEC_URL);
if (!response.ok) {
  throw new Error(`Failed to fetch ${SPEC_URL}: ${response.status} ${response.statusText}`);
}

const specText = await response.text();
const specOps = parseYamlOperations(specText);
const fixture = mapOperationsToFixture(specOps.operations, methodMap, "Email API");

const writeJson = async (filePath: string, value: Record<string, unknown>) => {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
};

await writeJson(FIXTURE_PATH, {
  version: specOps.version,
  endpoints: fixture.endpoints,
  unmapped: fixture.unmapped
});

console.info(`Wrote ${relative(rootDir, FIXTURE_PATH)} with ${fixture.endpoints.length} endpoints (${fixture.unmapped.length} unmapped)`);

const readmeText = await readFile(README_PATH, "utf8");
const emailApiNote = `> Built and tested against Email API \`${specOps.version}\``;
const updatedReadme = readmeText.replace(/>\s*Built and tested against Email API\s*`[^`]+`/g, emailApiNote);

if (updatedReadme !== readmeText) {
  await writeFile(README_PATH, updatedReadme);
  console.info(`Updated Email API version note in ${relative(rootDir, README_PATH)} to ${specOps.version}`);
}
