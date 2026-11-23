// Worked example (Forge): a worker that loads its heavy library ONCE and ALWAYS replies.
// Here the "library" is simulated so the example runs anywhere; in the app it is opencv.js.
let ready = false;
const loading = new Promise((resolve) => setTimeout(() => { ready = true; postMessage({ type: 'status', state: 'ready' }); resolve(); }, 50));

function heavyWork(n) {               // stands in for an OpenCV pipeline
  let s = 0; for (let i = 0; i < n; i++) s += Math.sqrt(i); return s;
}

self.onmessage = async (e) => {
  const { id, task, n } = e.data;
  await loading;
  try {
    if (task === 'hang') { for (;;) { /* a stuck job: only terminate() can stop it */ } }
    if (task === 'fail') throw new Error('bad input');
    const t0 = performance.now();
    const value = heavyWork(n);
    postMessage({ type: 'result', id, value, ms: performance.now() - t0 });
  } catch (err) {
    postMessage({ type: 'error', id, message: err.message });   // never silence
  }
};
