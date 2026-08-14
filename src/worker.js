import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";

let app;
async function getApp() {
  // Deferred: express-rate-limit schedules a setInterval on construction,
  // which Workers disallows outside a request handler's execution context.
  if (!app) {
    app = (await import("./app.js")).default;
  }
  return app;
}

async function toNodeRequest(request) {
  const url = new URL(request.url);
  const body =
    request.method === "GET" || request.method === "HEAD"
      ? null
      : Buffer.from(await request.arrayBuffer());

  const socket = new Socket();
  // Express (via proxy-addr/forwarded) reads req.socket.remoteAddress; the
  // real client IP arrives in the CF-Connecting-IP header instead. workerd's
  // Socket only exposes remoteAddress as a getter, so redefine it.
  Object.defineProperty(socket, "remoteAddress", {
    value: request.headers.get("cf-connecting-ip") || "127.0.0.1",
    configurable: true,
  });
  Object.defineProperty(socket, "remotePort", {
    value: 0,
    configurable: true,
  });
  Object.defineProperty(socket, "encrypted", {
    value: url.protocol === "https:",
    configurable: true,
  });

  const req = new IncomingMessage(socket);
  Object.defineProperty(req, "socket", { value: socket, configurable: true });
  Object.defineProperty(req, "connection", {
    value: socket,
    configurable: true,
  });
  req.method = request.method;
  req.url = url.pathname + url.search;
  req.headers = {};
  request.headers.forEach((value, key) => {
    req.headers[key.toLowerCase()] = value;
  });

  if (body && body.length) {
    req.push(body);
  }
  req.push(null);

  return req;
}

function createNodeResponse(req) {
  const socket = new Socket();
  const res = new ServerResponse(req);
  // workerd's http polyfill doesn't implement assignSocket(); wire up just
  // enough of the socket relationship for Express/res internals to work.
  res.socket = socket;
  res.connection = socket;
  socket._httpMessage = res;

  const chunks = [];
  const originalWrite = res.write.bind(res);
  const originalEnd = res.end.bind(res);

  res.write = (chunk, ...rest) => {
    // Copy: workerd detaches/reuses the underlying memory of chunk buffers
    // shortly after this call returns, so a stored reference isn't safe.
    if (chunk) chunks.push(Buffer.from(chunk));
    return originalWrite(chunk, ...rest);
  };

  res.end = (chunk, ...rest) => {
    if (chunk) chunks.push(Buffer.from(chunk));
    return originalEnd(chunk, ...rest);
  };

  const done = new Promise((resolve) => {
    res.on("finish", () => resolve(Buffer.concat(chunks)));
  });

  return { res, done };
}

export default {
  async fetch(request, env, ctx) {
    // Bridge Worker `env` bindings/secrets into process.env for existing
    // code (e.g. src/core/ai.js) that reads process.env directly.
    for (const key of Object.keys(env || {})) {
      if (typeof env[key] === "string") {
        process.env[key] = env[key];
      }
    }

    const app = await getApp();
    const req = await toNodeRequest(request);
    const { res, done } = createNodeResponse(req);

    app(req, res);

    const body = await done;
    const headers = new Headers();
    for (const [key, value] of Object.entries(res.getHeaders())) {
      if (Array.isArray(value)) {
        for (const v of value) headers.append(key, String(v));
      } else if (value !== undefined) {
        headers.set(key, String(value));
      }
    }

    return new Response(body, {
      status: res.statusCode,
      statusText: res.statusMessage,
      headers,
    });
  },
};
