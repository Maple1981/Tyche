const fs = require("fs");
const http = require("http");
const path = require("path");

const root = path.resolve(__dirname, "..");
const port = Number(process.env.TYCHE_TEST_PORT || 4173);

function requirePlaywright() {
  try {
    return require("playwright");
  } catch (error) {
    console.error("Playwright is not available to this Node process.");
    console.error("Provide it through NODE_PATH or run the browser smoke page manually:");
    console.error("  tests/regression.html");
    console.error(error.message);
    process.exit(2);
  }
}

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  return "application/octet-stream";
}

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const requested = decoded === "/" ? "/index.html" : decoded;
  const absolute = path.resolve(root, `.${requested}`);
  return absolute.startsWith(root) ? absolute : "";
}

function createServer() {
  return http.createServer((request, response) => {
    if ((request.url || "").split("?")[0] === "/favicon.ico") {
      response.writeHead(204);
      response.end();
      return;
    }
    const filePath = safePath(request.url || "/");
    if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }
    response.writeHead(200, { "Content-Type": contentType(filePath) });
    fs.createReadStream(filePath).pipe(response);
  });
}

function findBrowserExecutable() {
  const candidates = [
    process.env.TYCHE_BROWSER,
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  ].filter(Boolean);
  return candidates.find((candidate) => fs.existsSync(candidate));
}

async function main() {
  const { chromium } = requirePlaywright();
  const server = createServer();
  await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));
  const executablePath = findBrowserExecutable();
  const browser = await chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
  });
  try {
    const page = await browser.newPage();
    const logs = [];
    page.on("console", (message) => logs.push(`${message.type()}: ${message.text()}`));
    page.on("pageerror", (error) => logs.push(`pageerror: ${error.message}`));
    await page.goto(`http://127.0.0.1:${port}/tests/regression.html`, { waitUntil: "load" });
    await page.waitForFunction(() => window.__TYCHE_REGRESSION_DONE__, null, { timeout: 15000 });
    const done = await page.evaluate(() => window.__TYCHE_REGRESSION_DONE__);
    const rows = await page.locator("#results li").allTextContents();
    rows.forEach((row) => console.log(row));
    if (logs.length) {
      console.log("\nBrowser console:");
      logs.forEach((line) => console.log(line));
    }
    if (done.failureCount) {
      process.exitCode = 1;
    }
    console.log(`\nRegression browser smoke: ${done.resultCount - done.failureCount}/${done.resultCount} passed.`);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
