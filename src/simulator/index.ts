import { createServer } from "node:http";
import type { Socket } from "node:net";
import { createEmailApiHandler } from "./email-api.mjs";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 8787;

export const createSimulator = (options: {
  host?: string;
  port?: number;
  silent?: boolean;
} = {}) => {
  const { host = DEFAULT_HOST, port = DEFAULT_PORT } = options;
  const logRequests = !options.silent;

  const emailApi = createEmailApiHandler({ logRequests });

  const server = createServer(async (request, response) => {
    const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

    if (url.pathname.startsWith("/tx/")) {
      return emailApi.handler(request, response);
    }

    response.writeHead(404, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: "Not Found" }));
  });

  const sockets = new Set<Socket>();
  server.on("connection", (socket) => {
    sockets.add(socket);
    socket.on("close", () => {
      sockets.delete(socket);
    });
  });

  let serverUrl: string | null = null;

  return {
    server,
    state: {
      emailApi: emailApi.state
    },
    get url () {
      return serverUrl;
    },
    async close () {
      await new Promise<void>((resolve, reject) => {
        for (const socket of sockets) {
          socket.destroy();
        }

        server.close(error => (error ? reject(error) : resolve()));
      });
    },
    async listen (listenOptions: { host?: string, port?: number } = {}) {
      const nextHost = listenOptions.host || host;
      const nextPort = listenOptions.port ?? port;

      await new Promise<void>((resolve, reject) => {
        const onError = (error: Error) => {
          reject(error);
        };

        server.once("error", onError);
        server.listen(nextPort, nextHost, () => {
          server.off("error", onError);
          resolve();
        });
      });

      const address = server.address();
      const actualPort = typeof address === "object" && address ? address.port : nextPort;
      serverUrl = `http://${nextHost}:${actualPort}`;

      if (logRequests) {
        console.info("[Simulator]", `listening on ${serverUrl}`);
      }

      return serverUrl;
    }
  };
};
