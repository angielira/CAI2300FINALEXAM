// Worked example (Juno + Forge): a promise-based worker client with per-request timeout and restart.
class VisionWorker {
  constructor(url, timeoutMs = 30000) { this.url = url; this.timeoutMs = timeoutMs; this.seq = 0; this.pending = new Map(); this.start(); }
  start() { this.w = new Worker(this.url); this.w.onmessage = (e) => this.onMessage(e.data); }
  onMessage(m) { const p = this.pending.get(m.id); if (!p) return; clearTimeout(p.t); this.pending.delete(m.id);
    m.type === 'result' ? p.res(m.result) : p.rej(new Error(m.message)); }
  restart() { this.w.terminate(); for (const p of this.pending.values()) { clearTimeout(p.t); p.rej(new Error('restarted')); } this.pending.clear(); this.start(); }
  analyze(bitmap, options, reference) {
    const id = ++this.seq;
    return new Promise((res, rej) => {
      const t = setTimeout(() => { this.pending.delete(id); rej(new Error('timeout')); this.restart(); }, this.timeoutMs);
      this.pending.set(id, { res, rej, t });
      this.w.postMessage({ type: 'analyze', id, bitmap, options, reference }, [bitmap]);   // transfer, don't copy
    });
  }
}
