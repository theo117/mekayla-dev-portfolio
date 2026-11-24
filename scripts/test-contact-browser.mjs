// Requires Node 22+, local Chrome, and a running Vite dev/preview server.
// Every Web3Forms request is intercepted: these tests never send email.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const target = new URL(process.env.CONTACT_TEST_URL ?? 'http://127.0.0.1:5173/');
const artifacts = process.env.CONTACT_TEST_ARTIFACTS;
const profile = await mkdtemp(join(tmpdir(), 'mekayla-contact-test-'));
const chrome = spawn(process.env.CHROME_BIN ?? 'google-chrome', [
  '--headless=new', '--no-sandbox', '--disable-dev-shm-usage',
  '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', 'about:blank',
], { stdio: 'ignore' });
let launchError;
chrome.on('error', error => { launchError = error; });
let socket;

async function waitFor(check, label, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (launchError) throw launchError;
    const value = await check();
    if (value) return value;
    await delay(25);
  }
  throw new Error(`Timed out: ${label}`);
}

try {
  const port = await waitFor(async () => {
    try { return (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; }
    catch { return null; }
  }, 'Chrome startup');
  const targets = await fetch(`http://127.0.0.1:${port}/json`).then(response => response.json());
  socket = new WebSocket(targets.find(page => page.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let nextId = 0;
  const pending = new Map();
  const listeners = new Map();
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    pending.set(++nextId, { resolve, reject });
    socket.send(JSON.stringify({ id: nextId, method, params }));
  });
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const handler = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) handler?.reject(new Error(JSON.stringify(message.error)));
      else handler?.resolve(message.result);
    } else listeners.get(message.method)?.(message.params);
  };
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const requests = [];
  const exceptions = [];
  const interceptionErrors = [];
  const headers = [
    { name: 'Content-Type', value: 'application/json' },
    { name: 'Access-Control-Allow-Origin', value: '*' },
    { name: 'Access-Control-Allow-Methods', value: 'POST, OPTIONS' },
    { name: 'Access-Control-Allow-Headers', value: 'content-type' },
  ];
  const respond = (request, status, body) => send('Fetch.fulfillRequest', {
    requestId: request.requestId, responseCode: status, responseHeaders: headers,
    body: Buffer.from(typeof body === 'string' ? body : JSON.stringify(body)).toString('base64'),
  });
  listeners.set('Runtime.exceptionThrown', event => exceptions.push(event));
  listeners.set('Fetch.requestPaused', event => {
    if (event.request.method === 'OPTIONS') {
      respond(event, 204, '').catch(error => interceptionErrors.push(error));
    } else requests.push(event); // Never continue a Web3Forms request to the network.
  });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*web3forms.com/*' }] });
  // Only the timeout test accelerates the contact form's 15-second deadline.
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `
    const nativeSetTimeout = window.setTimeout.bind(window);
    window.setTimeout = (handler, timeout, ...args) => nativeSetTimeout(
      handler, window.__contactTestFastTimeout && timeout === 15000 ? 1000 : timeout, ...args);
  ` });
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: target.href });
  await waitFor(() => evaluate(`!!document.querySelector('#contact form')`), 'contact form');
  await evaluate(`document.querySelector('#contact').scrollIntoView({behavior: 'instant'})`);
  await delay(1100); // Allow existing reveal animations to finish before checking layout.

  const formState = () => evaluate(`(() => {
    const form = document.querySelector('#contact form');
    return { busy: form?.getAttribute('aria-busy'),
      values: form ? [...form.querySelectorAll('input,textarea')].map(field => field.value) : null,
      disabled: form ? [...form.querySelectorAll('input,textarea,button')].every(field => field.disabled) : false,
      error: document.querySelector('#contact [role="alert"]')?.textContent ?? '',
      success: !![...document.querySelectorAll('#contact h4')].find(item => item.textContent === 'Signal Received') };
  })()`);
  const fill = (name = 'Portfolio Browser Test', email = 'visitor@example.com', message = 'A mocked contact form test.') => evaluate(`(() => {
    const form = document.querySelector('#contact form');
    for (const [name, value] of Object.entries(${JSON.stringify({ name, email, message })})) {
      form.elements.namedItem(name).value = value;
    }
  })()`);
  const submit = () => evaluate(`document.querySelector('#contact form').requestSubmit()`);
  const requestAfter = async count => {
    await waitFor(() => requests.length > count, 'intercepted submission');
    assert.equal(requests.length, count + 1, 'One submit should produce one request');
    return requests[count];
  };
  const expectError = async pattern => {
    await waitFor(async () => pattern.test((await formState()).error), 'submission error');
    const state = await formState();
    assert.equal(state.busy, 'false');
    assert.equal(state.success, false);
    assert.equal(state.disabled, false);
    assert.deepEqual(state.values, ['Portfolio Browser Test', 'visitor@example.com', 'A mocked contact form test.']);
  };
  const expectSuccess = () => waitFor(async () => (await formState()).success, 'confirmed success view');
  const anotherMessage = async () => {
    await evaluate(`[...document.querySelectorAll('#contact button')].find(button => button.textContent === 'Send another message').click()`);
    await waitFor(async () => (await formState()).values, 'fresh contact form');
    assert.deepEqual((await formState()).values, ['', '', '']);
  };
  const screenshot = async name => {
    if (!artifacts) return;
    await mkdir(artifacts, { recursive: true });
    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    await writeFile(join(artifacts, `${name}.png`), Buffer.from(data, 'base64'));
  };

  await submit(); // Native required-field validation.
  await fill('Visitor', 'invalid-email', 'Hello');
  await submit();
  await fill('   ', 'visitor@example.com', '   ');
  await submit();
  await waitFor(async () => (await formState()).error.includes('Please enter'), 'whitespace validation');
  assert.equal(requests.length, 0);
  console.log('PASS required, email, and whitespace validation prevent requests');

  await fill();
  await submit();
  const first = await requestAfter(0);
  assert.equal(first.request.url, 'https://api.web3forms.com/submit');
  assert.equal(first.request.method, 'POST');
  const payload = JSON.parse(first.request.postData);
  assert.match(payload.access_key, /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i);
  assert.equal(payload.name, 'Portfolio Browser Test');
  assert.equal(payload.email, 'visitor@example.com');
  assert.equal(payload.message, 'A mocked contact form test.');
  assert.equal(payload.subject, 'New portfolio message for Mekayla DeWee');
  assert.equal(payload.from_name, "Mekayla's Portfolio");
  assert.equal((await formState()).disabled, true);
  assert.equal((await formState()).busy, 'true');
  assert.equal((await formState()).success, false);
  assert.equal((await formState()).error, '');
  await evaluate(`document.querySelector('#contact form').dispatchEvent(new Event('submit', {bubbles: true, cancelable: true}))`);
  await delay(100);
  assert.equal(requests.length, 1, 'Duplicate submission must be ignored while pending');
  await screenshot('sending-desktop');
  await respond(first, 200, { success: true });
  await expectSuccess();
  await screenshot('success-desktop');
  console.log('PASS correct API payload, pending feedback, duplicate protection, and confirmed success');
  await anotherMessage();
  console.log('PASS send-another-message returns to an empty form');

  for (const [status, body, label] of [
    [400, { success: false }, 'API validation failure'],
    [200, { success: false }, 'HTTP 200 with rejected submission'],
    [200, null, 'unexpected JSON shape'],
    [500, 'not json', 'malformed server response'],
    [429, { success: false }, 'rate limit'],
  ]) {
    await fill();
    const count = requests.length;
    await submit();
    await respond(await requestAfter(count), status, body);
    await expectError(status === 429 ? /Too many messages/ : /couldn't/);
    console.log(`PASS ${label} shows an error and preserves entered details`);
  }
  const failedCount = requests.length;
  await submit();
  const failed = await requestAfter(failedCount);
  await send('Fetch.failRequest', { requestId: failed.requestId, errorReason: 'InternetDisconnected' });
  await expectError(/connection/);
  console.log('PASS network failure keeps details and enables retry');

  await evaluate(`window.__contactTestFastTimeout = true`);
  const timeoutCount = requests.length;
  await submit();
  const timedOut = await requestAfter(timeoutCount);
  await expectError(/timed out/);
  // Chrome may have already discarded the aborted intercepted request.
  await send('Fetch.failRequest', { requestId: timedOut.requestId, errorReason: 'Aborted' }).catch(() => {});
  await evaluate(`window.__contactTestFastTimeout = false`);
  console.log('PASS timeout aborts the pending request and unlocks the form');

  for (const width of [320, 390, 768, 1024, 1440]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width < 768 });
    await evaluate(`document.querySelector('#contact form').scrollIntoView({behavior: 'instant', block: 'center'})`);
    const fits = await evaluate(`(() => {
      const form = document.querySelector('#contact form');
      return [...form.querySelectorAll('input,textarea,button,[role="alert"]')].every(item => {
        const bounds = item.getBoundingClientRect();
        return bounds.width > 0 && bounds.left >= 0 && bounds.right <= innerWidth;
      }) && [...form.querySelectorAll('input,textarea')].every(field => field.labels.length === 1);
    })()`);
    if (!fits) {
      await screenshot(`layout-failure-${width}`);
      console.log(await evaluate(`JSON.stringify([...document.querySelector('#contact form').querySelectorAll('input,textarea,button,[role="alert"]')].map(item => ({tag: item.tagName, left: item.getBoundingClientRect().left, right: item.getBoundingClientRect().right, labels: item.labels?.length})))`));
    }
    assert(fits, `Contact fields, button, labels, and errors must fit at ${width}px`);
    if (width === 390 || width === 1440) await screenshot(`error-${width}`);
  }
  console.log('PASS form, labels, button, and error layout at 320/390/768/1024/1440px');

  const retryCount = requests.length;
  await submit();
  await respond(await requestAfter(retryCount), 200, { success: true });
  await expectSuccess();
  await anotherMessage();
  assert.equal((await formState()).error, '');
  assert.deepEqual(exceptions, [], 'No unhandled browser exceptions');
  assert.deepEqual(interceptionErrors, []);
  console.log('PASS successful retry clears errors; all responses mocked; no emails sent or unhandled exceptions');
} finally {
  socket?.close();
  const stopped = new Promise(resolve => chrome.once('exit', resolve));
  chrome.kill('SIGTERM');
  await Promise.race([stopped, delay(2000)]);
  if (chrome.exitCode === null) chrome.kill('SIGKILL');
  await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
