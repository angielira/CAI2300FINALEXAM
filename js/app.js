/* Ballet Pose Matcher: the page.
 * Owners: Juno (frontend-engineer), with Wren (states and flow), Margot (coach text),
 * Forge (worker client) and Ledger (library). The page never runs OpenCV itself:
 * all vision work goes to shape.worker.js.
 */
'use strict';
(() => {
  const $ = (id) => document.getElementById(id);
  const ANALYSIS_TIMEOUT_MS = 30000;   // a stuck worker is restarted after 30 s
  const LOAD_TIMEOUT_MS = 120000;      // OpenCV.js is ~10 MB; allow slow networks

  // ---------------------------------------------------------------- status pill
  const statusEl = $('status');
  let cvReady = false;
  function setStatus(state, text) {
    statusEl.className = `pill pill-${state}`;
    $('status-text').textContent = text;
  }

  function showBanner(html, actions = [], kind = '') {
    const b = $('banner');
    b.dataset.kind = kind;
    b.innerHTML = html;
    for (const [label, fn] of actions) {
      const btn = document.createElement('button');
      btn.className = 'btn btn-small'; btn.type = 'button'; btn.textContent = label;
      btn.addEventListener('click', fn);
      b.appendChild(btn);
    }
    b.hidden = false;
  }
  function hideBanner() { $('banner').hidden = true; }

  // ---------------------------------------------------------------- worker client (Forge)
  class VisionWorker {
    constructor() { this.seq = 0; this.pending = new Map(); this.start(); }

    start() {
      cvReady = false;
      setStatus('loading', 'Loading OpenCV…');
      this.worker = new Worker('shape.worker.js');
      this.worker.onmessage = (e) => this.onMessage(e.data);
      this.worker.onerror = (e) => {
        e.preventDefault();
        this.fail(`The vision worker crashed: ${e.message || 'unknown error'}`);
      };
      clearTimeout(this.loadTimer);
      this.loadTimer = setTimeout(() => {
        if (!cvReady) this.fail('OpenCV.js is taking too long to load. Check your connection, then try again.');
      }, LOAD_TIMEOUT_MS);
    }

    fail(message) {
      setStatus('error', 'OpenCV error');
      showBanner(`<strong>Could not start OpenCV.js.</strong> ${escapeHtml(message)}`, [['Try again', () => { hideBanner(); this.restart(); }]], 'opencv');
      for (const p of this.pending.values()) { clearTimeout(p.timer); p.reject(new Error(message)); }
      this.pending.clear();
      updateBusy();
    }

    restart() {
      try { this.worker.terminate(); } catch (e) { /* ignore */ }
      for (const p of this.pending.values()) { clearTimeout(p.timer); p.reject(new Error('Worker restarted')); }
      this.pending.clear();
      this.start();
    }

    onMessage(msg) {
      if (msg.type === 'status') {
        if (msg.state === 'ready') {
          cvReady = true; clearTimeout(this.loadTimer);
          setStatus('ready', `Ready · OpenCV ${msg.version}`);
          hideBannerIf('opencv');
          updateBusy();
        } else if (msg.state === 'error') {
          clearTimeout(this.loadTimer);
          this.fail(msg.message);
        }
        return;
      }
      const p = this.pending.get(msg.id);
      if (!p) return;
      clearTimeout(p.timer);
      this.pending.delete(msg.id);
      if (msg.type === 'result') p.resolve(msg.result); else p.reject(new Error(msg.message));
    }

    analyze(bitmap, options, reference, candidates = []) {
      const id = ++this.seq;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          this.pending.delete(id);
          reject(new Error('This photo took longer than 30 seconds, so the worker was restarted. Try a smaller photo or turn GrabCut off.'));
          this.restart();
        }, ANALYSIS_TIMEOUT_MS + (cvReady ? 0 : LOAD_TIMEOUT_MS));
        this.pending.set(id, { resolve, reject, timer });
        this.worker.postMessage({ type: 'analyze', id, bitmap, options, reference, candidates }, [bitmap]);
      });
    }
  }
  // Hide only a banner of this kind (an OpenCV error), never e.g. the library-blocked banner.
  function hideBannerIf(kind) { if ($('banner').dataset.kind === kind) hideBanner(); }

  // ---------------------------------------------------------------- ballet pose gallery (Margot)
  const POSES = [
    ['arabesque', 'Arabesque'], ['penche', 'Penché'], ['attitude', 'Attitude derrière'], ['attitude-devant', 'Attitude devant'],
    ['developpe-devant', 'Développé devant'], ['a-la-seconde', 'À la seconde'], ['ecarte', 'Écarté'], ['retire', 'Retiré'],
    ['first-bras-bas', 'First position, bras bas'], ['fifth-en-haut', 'Fifth position, en haut'], ['second-plie', 'Second position plié'],
    ['tendu-devant', 'Tendu devant'], ['tendu-seconde', 'Tendu à la seconde'], ['fourth-croise', 'Fourth position croisé'],
    ['grand-jete', 'Grand jeté'], ['reverence', 'Révérence'],
  ].map(([slug, name]) => ({ slug, name, ref: `samples/ballet-${slug}-reference.jpg`, attempt: `samples/ballet-${slug}-attempt.jpg` }));

  // ---------------------------------------------------------------- state
  const state = {
    blob: null,               // the current photo (kept so "Run again" can re-analyse)
    suggestedName: '',
    last: null,               // last successful result
    refs: [],
    settings: { threshold: null, thresholdValue: 120, cleanup: 3, grabcut: false, ghost: true, autosave: true, refId: '' },
    busy: false,
    urls: new Set(),
  };
  const vision = new VisionWorker();

  function updateBusy() {
    $('btn-rerun').disabled = !state.blob || state.busy || !cvReady;
    $('btn-add-all').disabled = state.busy || !cvReady;
    $('working').hidden = !state.busy;
  }

  // ---------------------------------------------------------------- helpers
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function objectUrl(blob) { const u = URL.createObjectURL(blob); state.urls.add(u); return u; }
  function fmtDate(ts) { return new Date(ts).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }); }
  function canvasToBlob(canvas, type = 'image/jpeg', quality = 0.86) {
    return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
  }
  async function scaledBlob(source, maxSide, quality = 0.85) {
    const bmp = source instanceof Blob ? await createImageBitmap(source) : source;
    const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    if (source instanceof Blob) bmp.close();
    return canvasToBlob(c, 'image/jpeg', quality);
  }
  function bbox(points) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let i = 0; i < points.length; i += 2) {
      const x = points[i], y = points[i + 1];
      if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }
  /** Area centroid x of a closed polygon (same as OpenCV moments m10/m00). */
  function centroidX(points) {
    let a = 0, cx = 0;
    for (let i = 0; i < points.length; i += 2) {
      const j = (i + 2) % points.length;
      const cross = points[i] * points[j + 1] - points[j] * points[i + 1];
      a += cross; cx += (points[i] + points[j]) * cross;
    }
    return a ? cx / (3 * a) : bbox(points).x + bbox(points).w / 2;
  }
  function selectedRef() { return state.refs.find((r) => r.id === state.settings.refId) || null; }

  // ---------------------------------------------------------------- coach (Margot)
  function coachText(score, parts, metrics, ref) {
    let head;
    if (score >= 85) head = 'Brava! That is very close to your reference.';
    else if (score >= 70) head = 'Close. The line is there; refine the details.';
    else if (score >= 50) head = 'Recognisable. Keep working on this position.';
    else head = 'Quite a different position. Check the reference you picked, and that your whole body is in the frame.';
    const tips = [];
    const ratio = metrics.aspect / ref.aspect;
    if (ratio > 1.12) tips.push('Your line is taller and narrower than the reference: extend the working leg and the arms further out.');
    else if (ratio < 0.89) tips.push('Your shape is lower and wider than the reference: pull up through the standing leg and lengthen the spine.');
    const solid = metrics.solidity - ref.solidity;
    if (solid > 0.05) tips.push('You look more compact: extend fully through the working leg and point the foot.');
    else if (solid < -0.05) tips.push('Your limbs reach further out than the reference: bring the arms back into their rounded position.');
    return [head, ...tips.slice(0, 1)].join(' ');
  }

  // ---------------------------------------------------------------- drawing the result
  function drawResult(result, ref) {
    const canvas = $('canvas');
    canvas.width = result.width; canvas.height = result.height;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(new ImageData(result.pixels, result.width, result.height), 0, 0);

    // Ghost: the reference outline, scaled to your height and aligned on your centroid,
    // exactly the alignment the overlap score uses (drawn by the page, not OpenCV).
    if (ref && state.settings.ghost && ref.points && ref.points.length > 4) {
      const mine = bbox(result.points), theirs = bbox(ref.points);
      const s = mine.h / theirs.h;
      const ox = centroidX(result.points) - centroidX(ref.points) * s;
      const oy = mine.y - theirs.y * s;
      ctx.save();
      ctx.setLineDash([8, 6]);
      ctx.lineWidth = Math.max(2, result.width / 320);
      ctx.strokeStyle = 'rgba(255,255,255,0.95)';
      ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 4;
      ctx.beginPath();
      for (let i = 0; i < ref.points.length; i += 2) {
        const x = ref.points[i] * s + ox, y = ref.points[i + 1] * s + oy;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath(); ctx.stroke(); ctx.restore();
    }
    canvas.classList.remove('hidden');
    $('empty').hidden = true;
  }

  function showMetrics(m) {
    const rows = [
      ['Shape size', `${m.width} × ${m.height}px`],
      ['Height ÷ width', m.aspect.toFixed(2)],
      ['Openness', `${Math.round((1 - m.solidity) * 100)}%`],
      ['Fills its box', `${Math.round(m.extent * 100)}%`],
      ['Threshold', m.thresholdUsed == null ? 'auto' : m.thresholdUsed],
      ['Outline points', m.points],
    ];
    const dl = $('metrics');
    dl.innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${escapeHtml(v)}</dd></div>`).join('');
    dl.hidden = false;
  }

  function showRanking(ranking) {
    const el = $('ranking');
    if (!ranking || !ranking.length) { el.hidden = true; return; }
    const [best, ...rest] = ranking;
    const sure = best.total >= 60 && (!rest.length || best.total - rest[0].total >= 10);
    el.innerHTML = `<strong>${sure ? 'Looks most like' : 'Closest pose (not sure)'}: ${escapeHtml(best.name)} · ${best.total}%</strong>`
      + (rest.length ? `<span>then ${rest.slice(0, 2).map((r) => `${escapeHtml(r.name)} ${r.total}%`).join(', ')}</span>` : '');
    el.hidden = false;
  }

  function showScore(score, metrics, ref) {
    const row = $('score-row');
    if (!score) { row.hidden = true; return; }
    const ring = $('ring');
    ring.style.setProperty('--p', score.total);
    ring.style.setProperty('--ring', score.total >= 80 ? 'var(--ok)' : score.total >= 55 ? 'var(--warn)' : 'var(--accent)');
    $('score').textContent = score.total;
    $('score-title').textContent = `Match with “${ref.name}”`;
    $('coach').textContent = coachText(score.total, score.parts, metrics, ref)
      + ` (overlap ${score.parts.shape}%, proportions ${score.parts.proportions}%, openness ${score.parts.openness}%)`;
    row.hidden = false;
  }

  // ---------------------------------------------------------------- analyse
  async function analyze(blob, suggestedName = '') {
    if (!blob) return;
    state.blob = blob;
    state.suggestedName = suggestedName;
    state.busy = true; updateBusy();
    if (cvReady) setStatus('working', 'Working…');
    const ref = selectedRef();
    try {
      const bitmap = await createImageBitmap(blob);
      const options = {
        cleanup: state.settings.cleanup,
        threshold: state.settings.threshold,
        grabcut: state.settings.grabcut,
      };
      const reference = ref ? { points: ref.points, aspect: ref.aspect, solidity: ref.solidity } : null;
      const candidates = state.refs.map((r) => ({ id: r.id, name: r.name, points: r.points, aspect: r.aspect, solidity: r.solidity }));
      const result = await vision.analyze(bitmap, options, reference, candidates);
      setStatus('ready', $('status-text').textContent.startsWith('Ready') ? $('status-text').textContent : 'Ready');
      if (!result.ok) {
        state.last = null;
        $('score-row').hidden = true; $('metrics').hidden = true; $('save-ref').hidden = true; $('ranking').hidden = true;
        $('canvas').classList.add('hidden'); $('empty').hidden = false;
        $('empty').innerHTML = '<p><strong>No dancer found.</strong><br>Try a plainer wall, switch the threshold to Manual and move the slider, or turn on GrabCut.</p>';
        $('perf').textContent = `Looked for ${Math.round(result.ms)} ms.`;
        return;
      }
      state.last = { ...result, refId: ref ? ref.id : null };
      drawResult(result, ref);
      showMetrics(result.metrics);
      showScore(result.score, result.metrics, ref);
      showRanking(result.ranking);
      $('save-ref').hidden = false;
      $('ref-name').value = suggestedName;
      $('perf').textContent = `OpenCV.js (WebAssembly, in a Web Worker) took ${Math.round(result.ms)} ms. `
        + `Mats still in memory: ${result.matsAlive}.`;
      setStatus('ready', `Done in ${Math.round(result.ms)} ms`);
      if (ref && result.score && state.settings.autosave) await saveAttempt(result, ref);
    } catch (err) {
      // If the worker failed, keep its banner (it has the "Try again" button).
      if (!statusEl.classList.contains('pill-error')) showBanner(`<strong>That didn’t work.</strong> ${escapeHtml(err.message)}`);
      if (cvReady) setStatus('ready', 'Ready');
    } finally {
      state.busy = false; updateBusy();
    }
  }

  // ---------------------------------------------------------------- library (Ledger)
  async function saveAttempt(result, ref) {
    try {
      const [originalBlob, resultBlob, thumbBlob] = await Promise.all([
        scaledBlob(state.blob, 800),
        canvasToBlob($('canvas')),
        scaledBlob(await createImageBitmap($('canvas')), 240),
      ]);
      await DB.saveAttempt({
        id: DB.newId(), createdAt: Date.now(), refId: ref.id, refName: ref.name,
        score: result.score.total, parts: result.score.parts, metrics: result.metrics, ms: Math.round(result.ms),
        originalBlob, resultBlob, thumbBlob,
      });
      await renderLibrary();
    } catch (err) { libraryError(err); }
  }

  async function saveReference() {
    const r = state.last;
    const name = $('ref-name').value.trim();
    if (!r) return;
    if (!name) { $('ref-name').focus(); $('ref-name').placeholder = 'Give it a name first'; return; }
    try {
      const imageBlob = await canvasToBlob($('canvas'));
      const thumbBlob = await scaledBlob(await createImageBitmap($('canvas')), 360);
      const ref = { id: DB.newId(), name, createdAt: Date.now(), points: r.points, aspect: r.metrics.aspect, solidity: r.metrics.solidity, imageBlob, thumbBlob };
      await DB.saveReference(ref);
      state.settings.refId = ref.id; persistSettings();
      await renderLibrary();
      $('save-ref').hidden = true;
      showBanner(`Saved “${escapeHtml(name)}”. It is now selected: open an attempt photo to get a score.`);
      setTimeout(hideBanner, 4000);
    } catch (err) { libraryError(err); }
  }

  function libraryError(err) {
    const quota = err && err.name === 'QuotaExceededError';
    showBanner(`<strong>Could not save.</strong> ${quota ? 'This browser is out of storage space for the app. Delete some attempts or use Reset app data.' : escapeHtml(err.message || String(err))}`);
  }

  function sparkline(scores) {
    if (scores.length < 2) return '';
    const w = 200, h = 34, step = w / (scores.length - 1);
    const pts = scores.map((s, i) => `${(i * step).toFixed(1)},${(h - 3 - (s / 100) * (h - 6)).toFixed(1)}`).join(' ');
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-label="Score trend"><polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>`;
  }

  async function renderLibrary() {
    for (const u of state.urls) URL.revokeObjectURL(u);   // free old thumbnails
    state.urls.clear();
    const [refs, attempts] = await Promise.all([DB.listReferences(), DB.listAttempts()]);
    state.refs = refs;

    // Reference select
    const sel = $('ref-select');
    sel.innerHTML = '<option value="">None: just find my outline</option>'
      + refs.map((r) => `<option value="${r.id}">${escapeHtml(r.name)}</option>`).join('');
    if (!refs.some((r) => r.id === state.settings.refId)) state.settings.refId = '';
    sel.value = state.settings.refId;

    // Reference cards
    const byRef = new Map();
    for (const a of attempts) { if (!byRef.has(a.refId)) byRef.set(a.refId, []); byRef.get(a.refId).push(a); }
    $('tab-refs').innerHTML = refs.length ? refs.map((r) => {
      const list = (byRef.get(r.id) || []).slice().reverse();     // oldest -> newest
      const best = list.length ? Math.max(...list.map((a) => a.score)) : null;
      return `<article class="ref" data-id="${r.id}">
        <img src="${objectUrl(r.thumbBlob || r.imageBlob)}" alt="Reference shape ${escapeHtml(r.name)}">
        <h3>${escapeHtml(r.name)}</h3>
        <div class="meta">${list.length} attempt${list.length === 1 ? '' : 's'}${best != null ? ` · best ${best}%` : ''} · saved ${fmtDate(r.createdAt)}</div>
        ${sparkline(list.map((a) => a.score))}
        <div class="actions"><button class="btn btn-small btn-primary" data-act="practice">Practise this</button>
        <button class="btn btn-small btn-danger" data-act="delete-ref">Delete</button></div></article>`;
    }).join('') : '';

    // History
    $('tab-history').innerHTML = attempts.length ? attempts.map((a) => `
      <div class="hrow" data-id="${a.id}">
        <img src="${objectUrl(a.thumbBlob)}" alt="Attempt at ${escapeHtml(a.refName)}" data-act="view">
        <div><div class="t">${escapeHtml(a.refName)}</div><div class="d">${fmtDate(a.createdAt)} · ${a.ms} ms</div></div>
        <span class="badge ${a.score >= 80 ? 'good' : a.score >= 55 ? 'mid' : ''}">${a.score}%</span>
        <button class="btn btn-small btn-danger" data-act="delete-attempt" aria-label="Delete attempt">Delete</button>
      </div>`).join('') : '';

    const tab = document.querySelector('.library [aria-selected="true"]').dataset.tab;
    const empty = tab === 'refs' ? !refs.length : !attempts.length;
    $('lib-state').hidden = !empty;
    $('lib-state').textContent = tab === 'refs'
      ? 'No reference shapes yet. Analyse a photo of a shape you want to practise, then press “Save reference”.'
      : 'No attempts yet. Pick a reference shape in step 2, then analyse a photo.';
    await updateStorage();
  }

  async function updateStorage() {
    const est = await DB.estimate().catch(() => null);
    if (est && est.usage != null) {
      $('storage').textContent = `Everything stays in this browser · using ${(est.usage / 1048576).toFixed(1)} MB of storage`;
    }
  }

  // ---------------------------------------------------------------- settings
  let saveTimer = null;
  function persistSettings() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => DB.saveSettings(state.settings).catch(() => {}), 250);
  }
  function applySettingsToUI() {
    const s = state.settings;
    document.querySelectorAll('[data-thr]').forEach((b) => b.setAttribute('aria-checked', String((b.dataset.thr === 'auto') === (s.threshold == null))));
    $('thr-wrap').hidden = s.threshold == null;
    $('thr').value = s.thresholdValue; $('thr-out').textContent = s.thresholdValue;
    $('cleanup').value = s.cleanup; $('cleanup-out').textContent = s.cleanup;
    $('grabcut').checked = s.grabcut; $('ghost').checked = s.ghost; $('autosave').checked = s.autosave;
  }

  // ---------------------------------------------------------------- events
  const fileInput = $('file');
  const drop = $('drop');
  fileInput.addEventListener('change', () => { if (fileInput.files[0]) analyze(fileInput.files[0]); fileInput.value = ''; });
  drop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });
  ['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', (e) => { const f = e.dataTransfer.files[0]; if (f && f.type.startsWith('image/')) analyze(f); });

  function renderGallery() {
    $('samples').innerHTML = POSES.map((p) => `
      <div class="pose" role="listitem">
        <img src="${p.ref}" alt="" loading="lazy">
        <span class="pose-name">${escapeHtml(p.name)}</span>
        <span class="pose-btns">
          <button class="sample btn btn-small" type="button" data-src="${p.ref}" data-name="${escapeHtml(p.name)}" aria-label="${escapeHtml(p.name)} reference photo">Reference</button>
          <button class="sample btn btn-small" type="button" data-src="${p.attempt}" data-pose="${escapeHtml(p.name)}" aria-label="${escapeHtml(p.name)} attempt photo">Attempt</button>
        </span>
      </div>`).join('');
  }

  // Add every gallery pose to the library as a reference (skips names already there).
  async function addAllPoses() {
    const btn = $('btn-add-all');
    const have = new Set(state.refs.map((r) => r.name));
    const todo = POSES.filter((p) => !have.has(p.name));
    if (!todo.length) { showBanner('All 16 poses are already in your library.'); setTimeout(hideBanner, 3000); return; }
    state.busy = true; updateBusy();
    let added = 0;
    try {
      for (const p of todo) {
        btn.textContent = `Adding ${p.name}… (${added + 1}/${todo.length})`;
        const blob = await (await fetch(p.ref)).blob();
        const r = await vision.analyze(await createImageBitmap(blob), { cleanup: 3, threshold: null, grabcut: false }, null, []);
        if (!r.ok) continue;
        const c = document.createElement('canvas');
        c.width = r.width; c.height = r.height;
        c.getContext('2d').putImageData(new ImageData(r.pixels, r.width, r.height), 0, 0);
        const imageBlob = await canvasToBlob(c);
        const thumbBlob = await scaledBlob(await createImageBitmap(c), 360);
        await DB.saveReference({ id: DB.newId(), name: p.name, createdAt: Date.now() + added, points: r.points,
          aspect: r.metrics.aspect, solidity: r.metrics.solidity, imageBlob, thumbBlob });
        added++;
      }
      await renderLibrary();
      showBanner(`Added ${added} pose${added === 1 ? '' : 's'} to your library. Open any <em>Attempt</em> to get a score and see which pose it looks like.`);
      setTimeout(hideBanner, 5000);
    } catch (err) {
      libraryError(err);
    } finally {
      btn.textContent = 'Add all 16 poses to my library';
      state.busy = false; updateBusy();
      await renderLibrary().catch(() => {});
    }
  }
  $('btn-add-all').addEventListener('click', addAllPoses);

  $('samples').addEventListener('click', async (e) => {
    const btn = e.target.closest('.sample');
    if (!btn) return;
    // Opening an attempt: compare it with the same pose if that pose is in the library.
    if (btn.dataset.pose) {
      const match = state.refs.find((r) => r.name === btn.dataset.pose);
      if (match && state.settings.refId !== match.id) { state.settings.refId = match.id; $('ref-select').value = match.id; persistSettings(); }
    }
    try {
      const res = await fetch(btn.dataset.src);
      if (!res.ok) throw new Error(`Could not load the sample (${res.status})`);
      analyze(await res.blob(), btn.dataset.name || '');
    } catch (err) { showBanner(escapeHtml(err.message)); }
  });

  $('ref-select').addEventListener('change', (e) => {
    state.settings.refId = e.target.value; persistSettings();
    if (state.blob && cvReady) analyze(state.blob, state.suggestedName);
  });
  document.querySelectorAll('[data-thr]').forEach((b) => b.addEventListener('click', () => {
    state.settings.threshold = b.dataset.thr === 'auto' ? null : Number($('thr').value);
    applySettingsToUI(); persistSettings();
  }));
  $('thr').addEventListener('input', (e) => {
    state.settings.thresholdValue = Number(e.target.value);
    if (state.settings.threshold != null) state.settings.threshold = state.settings.thresholdValue;
    $('thr-out').textContent = e.target.value; persistSettings();
  });
  $('thr').addEventListener('change', () => { if (state.blob && cvReady) analyze(state.blob, state.suggestedName); });
  $('cleanup').addEventListener('input', (e) => { state.settings.cleanup = Number(e.target.value); $('cleanup-out').textContent = e.target.value; persistSettings(); });
  $('cleanup').addEventListener('change', () => { if (state.blob && cvReady) analyze(state.blob, state.suggestedName); });
  for (const id of ['grabcut', 'ghost', 'autosave']) {
    $(id).addEventListener('change', (e) => { state.settings[id] = e.target.checked; persistSettings(); });
  }
  $('btn-rerun').addEventListener('click', () => analyze(state.blob, state.suggestedName));
  $('btn-save-ref').addEventListener('click', saveReference);
  $('ref-name').addEventListener('keydown', (e) => { if (e.key === 'Enter') saveReference(); });

  // Library tabs and actions
  document.querySelectorAll('.library [data-tab]').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('.library [data-tab]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    $('tab-refs').hidden = b.dataset.tab !== 'refs';
    $('tab-history').hidden = b.dataset.tab !== 'history';
    renderLibrary().catch(libraryError);
  }));
  $('tab-refs').addEventListener('click', async (e) => {
    const btn = e.target.closest('button'); if (!btn) return;
    const id = btn.closest('.ref').dataset.id;
    if (btn.dataset.act === 'practice') {
      state.settings.refId = id; persistSettings(); $('ref-select').value = id;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (state.blob && cvReady) analyze(state.blob, state.suggestedName);
    } else if (btn.dataset.act === 'delete-ref') {
      if (!confirm('Delete this reference shape? Its attempts stay in your history.')) return;
      await DB.deleteReference(id).catch(libraryError);
      renderLibrary().catch(libraryError);
    }
  });
  $('tab-history').addEventListener('click', async (e) => {
    const el = e.target.closest('[data-act]'); if (!el) return;
    const id = el.closest('.hrow').dataset.id;
    if (el.dataset.act === 'delete-attempt') {
      await DB.deleteAttempt(id).catch(libraryError);
      renderLibrary().catch(libraryError);
    } else if (el.dataset.act === 'view') {
      const a = await DB.getAttempt(id);
      if (!a) return;
      $('viewer-title').textContent = `${a.refName} · ${a.score}%`;
      $('viewer-orig').src = objectUrl(a.originalBlob);
      $('viewer-res').src = objectUrl(a.resultBlob);
      $('viewer-meta').textContent = `${fmtDate(a.createdAt)} · overlap ${a.parts.shape}%, proportions ${a.parts.proportions}%, openness ${a.parts.openness}% · ${a.ms} ms`;
      $('viewer').showModal();
    }
  });
  $('viewer-close').addEventListener('click', () => $('viewer').close());

  // Camera with a self-timer (so a dancer can get into position)
  let stream = null, countdownTimer = null;
  $('btn-camera').addEventListener('click', async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false });
      $('video').srcObject = stream; await $('video').play();
      $('camera').showModal();
    } catch (err) { showBanner(`<strong>Camera unavailable.</strong> ${escapeHtml(err.message)} You can upload a photo instead.`); }
  });
  function stopCamera() {
    clearInterval(countdownTimer); $('countdown').hidden = true;
    if (stream) stream.getTracks().forEach((t) => t.stop());
    stream = null; if ($('camera').open) $('camera').close();
  }
  $('btn-cam-close').addEventListener('click', stopCamera);
  $('camera').addEventListener('close', stopCamera);
  $('btn-capture').addEventListener('click', () => {
    let n = Number($('timer').value);
    const shoot = async () => {
      const v = $('video');
      const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight;
      const ctx = c.getContext('2d'); ctx.translate(c.width, 0); ctx.scale(-1, 1); ctx.drawImage(v, 0, 0);
      const blob = await canvasToBlob(c, 'image/jpeg', 0.92);
      stopCamera(); analyze(blob);
    };
    if (!n) { shoot(); return; }
    const cd = $('countdown'); cd.hidden = false; cd.textContent = n;
    countdownTimer = setInterval(() => { n -= 1; if (n <= 0) { clearInterval(countdownTimer); cd.hidden = true; shoot(); } else cd.textContent = n; }, 1000);
  });

  // Reset app data: delete the database, caches and service worker, then reload.
  $('btn-reset').addEventListener('click', async () => {
    if (!confirm('Delete all reference shapes, practice history and settings from this browser?')) return;
    clearTimeout(saveTimer);             // a pending settings save would recreate the database
    try {
      await DB.resetAll();
      if (self.caches) for (const k of await caches.keys()) await caches.delete(k);
      if (navigator.serviceWorker) for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
      location.reload();
    } catch (err) { showBanner(`<strong>Reset failed.</strong> ${escapeHtml(err.message)}`); }
  });

  // ---------------------------------------------------------------- database events
  DB.on('blocked', () => {
    $('lib-state').hidden = false;
    $('lib-state').textContent = 'Opening library…';
    showBanner('<strong>The library is waiting for another tab.</strong> Another tab of this app is still open on an older version. Close the other tabs, then reload.', [['Reload', () => location.reload()]]);
  });
  DB.on('versionchange', () => {
    showBanner('<strong>A newer version of the app opened in another tab.</strong> Reload this tab to keep using your library.', [['Reload', () => location.reload()]]);
  });

  // ---------------------------------------------------------------- start
  renderGallery();
  (async () => {
    try {
      const saved = await DB.getSettings();
      if (saved) { delete saved.key; Object.assign(state.settings, saved); }
      applySettingsToUI();
      await renderLibrary();
    } catch (err) {
      $('lib-state').textContent = 'The library could not open. Your shapes still work, but nothing will be saved.';
      showBanner(`<strong>Library unavailable.</strong> ${escapeHtml(err.message || String(err))}`, [['Reset app data', () => $('btn-reset').click()]]);
    }
  })();
  applySettingsToUI();
  updateBusy();

  // Offline support: cache the app and OpenCV.js after the first visit.
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }

  // Exposed for the QA tests only.
  window.__ballet = { state, vision, renderLibrary, addAllPoses, POSES };
})();
