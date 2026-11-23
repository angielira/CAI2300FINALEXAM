// Tiny Chrome DevTools Protocol driver for the QA tests (Node 22+, no packages needed).
// Usage:
//   node tests/browser/cdp.mjs <url> [--wait "<js expression>"] [--screenshot out.png]
//        [--width 1400] [--height 1000] [--profile /tmp/prof] [--dark]
// Prints console messages, uncaught exceptions, and the value of --print (default document.title).
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const args = process.argv.slice(2);
const url = args[0];
const opt = (name, def) => { const i = args.indexOf(name); return i > -1 ? args[i + 1] : def; };
const flag = (name) => args.includes(name);
const waitExpr = opt('--wait', 'document.readyState === "complete"');
const printExpr = opt('--print', 'document.title');
const shot = opt('--screenshot', null);
const width = Number(opt('--width', 1400)), height = Number(opt('--height', 1000));
const profile = opt('--profile', mkdtempSync(join(tmpdir(), 'cdp-')));
const timeoutMs = Number(opt('--timeout', 30000));
const port = 9300 + Math.floor(Math.random() * 500);

const chrome = spawn('google-chrome', ['--headless=new', '--no-sandbox', '--disable-gpu', `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', `--window-size=${width},${height}`, 'about:blank'],
  { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws, id = 0; const waiters = new Map(); const logs = [];
function send(method, params = {}, sessionId) {
  const msg = { id: ++id, method, params }; if (sessionId) msg.sessionId = sessionId;
  ws.send(JSON.stringify(msg));
  return new Promise((res, rej) => waiters.set(msg.id, { res, rej }));
}

try {
  let ver;
  for (let i = 0; i < 50 && !ver; i++) { try { ver = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); } catch { await sleep(200); } }
  ws = new WebSocket(ver.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && waiters.has(m.id)) { const w = waiters.get(m.id); waiters.delete(m.id); m.error ? w.rej(new Error(m.error.message)) : w.res(m.result); return; }
    if (m.method === 'Runtime.consoleAPICalled') logs.push(`console.${m.params.type}: ${m.params.args.map((a) => a.value ?? a.description).join(' ')}`);
    if (m.method === 'Runtime.exceptionThrown') logs.push(`EXCEPTION: ${m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text}`);
    if (m.method === 'Log.entryAdded') logs.push(`log.${m.params.entry.level}: ${m.params.entry.text} ${m.params.entry.url || ''}`);
  });
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  await send('Runtime.enable', {}, sessionId);
  await send('Log.enable', {}, sessionId);
  await send('Page.enable', {}, sessionId);
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false }, sessionId);
  if (flag('--dark')) await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] }, sessionId);
  await send('Page.navigate', { url }, sessionId);
  const start = Date.now(); let ok = false;
  while (Date.now() - start < timeoutMs) {
    const r = await send('Runtime.evaluate', { expression: `(()=>{try{return !!(${waitExpr})}catch(e){return false}})()`, returnByValue: true }, sessionId);
    if (r.result.value) { ok = true; break; }
    await sleep(250);
  }
  await sleep(Number(opt('--settle', 300)));
  const out = await send('Runtime.evaluate', { expression: printExpr, returnByValue: true, awaitPromise: true }, sessionId);
  if (shot) {
    const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: flag('--full') }, sessionId);
    writeFileSync(shot, Buffer.from(data, 'base64'));
  }
  console.log(logs.join('\n'));
  console.log(`WAIT ${ok ? 'met' : 'TIMED OUT'}`);
  console.log(typeof out.result.value === 'string' ? out.result.value : JSON.stringify(out.result.value, null, 1));
} catch (e) {
  console.error('driver error', e);
  process.exitCode = 2;
} finally {
  try { ws.close(); } catch {}
  chrome.kill('SIGKILL');
}
