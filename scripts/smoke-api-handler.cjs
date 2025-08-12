// Quick smoke test for serverless handler preflight and ping
process.env.API_MINIMAL_MODE = process.env.API_MINIMAL_MODE || "1";
const path = require("path");

(async () => {
  const mod = require(path.resolve(__dirname, "../api/index.js"));
  const handler = mod && mod.default ? mod.default : mod;
  if (typeof handler !== "function") {
    console.error("Handler not found");
    process.exit(1);
  }
  function makeReq(url) {
    return { url, headers: {} };
  }
  function makeRes(label) {
    return {
      statusCode: 200,
      headers: {},
      setHeader(k, v) {
        this.headers[k] = v;
      },
      end(body) {
        console.log(label, "->", this.statusCode, body?.toString?.() || body);
      },
    };
  }
  await handler(makeReq("/api/preflight"), makeRes("preflight"));
  await handler(makeReq("/api/ping"), makeRes("ping"));
})();
