// ════════════════════════════════════════════════════════════
//  utils.js  —  UTILS topbar dropdown + Calculator modal
// ════════════════════════════════════════════════════════════

// ── Dropdown ─────────────────────────────────────────────────
let _utilsDropOpen = false;

function toggleUtilsDropdown() {
  _utilsDropOpen = !_utilsDropOpen;
  const dd = document.getElementById('utils-dropdown');
  if (_utilsDropOpen) {
    const btn = document.getElementById('btn-utils');
    const r = btn.getBoundingClientRect();
    dd.style.top   = (r.bottom + 6) + 'px';
    dd.style.right = (window.innerWidth - r.right) + 'px';
    dd.style.left  = 'auto';
  }
  dd.style.display = _utilsDropOpen ? 'block' : 'none';
}

// Close when clicking outside
document.addEventListener('mousedown', e => {
  try {
    const wrap = document.getElementById('utils-dropdown-wrap');
    const dd   = document.getElementById('utils-dropdown');
    if (dd && !dd.contains(e.target) && (!wrap || !wrap.contains(e.target))) {
      _utilsDropOpen = false;
      dd.style.display = 'none';
    }
  } catch(_){}
}, true);


// ── Calculator modal ─────────────────────────────────────────
// Track which tool panels and sci panel are open
let _calcOpenTool = null;   // 'circ' | 'cloud' | 'hm' | null
let _calcSciOpen  = false;

function openCalculator() {
  _utilsDropOpen = false;
  document.getElementById('utils-dropdown').style.display = 'none';

  _calcPopulateBodies();

  const overlay = document.getElementById('calc-modal-overlay');
  overlay.style.display = 'flex';

  // Open first tool by default if none open
  if (!_calcOpenTool) calcToggleTool('circ', true);
  calcUpdate();
}

function closeCalculator() {
  document.getElementById('calc-modal-overlay').style.display = 'none';
}

// Close on overlay background click
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('calc-modal-overlay')?.addEventListener('click', e => {
    if (e.target === document.getElementById('calc-modal-overlay')) closeCalculator();
  });
});

// Close on ESC
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const overlay = document.getElementById('calc-modal-overlay');
    if (overlay && overlay.style.display !== 'none') closeCalculator();
  }
});

function _calcPopulateBodies() {
  const sel = document.getElementById('calc-body-sel');
  if (!sel) return;
  const names = Object.keys(typeof bodies !== 'undefined' ? bodies : {});
  if (!names.length) {
    sel.innerHTML = '<option value="">— no bodies loaded —</option>';
    return;
  }
  names.sort((a, b) => {
    const ac = bodies[a]?.isCenter ? -1 : 1;
    const bc = bodies[b]?.isCenter ? -1 : 1;
    if (ac !== bc) return ac - bc;
    return a.localeCompare(b);
  });
  sel.innerHTML = names.map(n =>
    `<option value="${n}">${n}${bodies[n]?.isCenter ? ' ★' : ''}</option>`
  ).join('');
  if (typeof selectedBody !== 'undefined' && selectedBody && bodies[selectedBody]) {
    sel.value = selectedBody;
  }
  calcBodyChanged();
}

function calcBodyChanged() {
  calcUpdate();
}

function _calcGetBodyData() {
  const sel  = document.getElementById('calc-body-sel');
  const name = sel?.value;
  if (!name || typeof bodies === 'undefined' || !bodies[name]) return null;
  const d = bodies[name].data || {};
  const radius_m           = d.BASE_DATA?.radius || 0;
  const cloudStartHeight_m = d.ATMOSPHERE_VISUALS_DATA?.CLOUDS?.startHeight || 0;
  return { name, radius_m, cloudStartHeight_m };
}

// ── New: toggle tool panel (accordion-style) ──────────────────
function calcToggleTool(tool, forceOpen) {
  const isOpen = _calcOpenTool === tool;
  const shouldOpen = forceOpen !== undefined ? forceOpen : !isOpen;

  // Close all panels first
  ['circ', 'cloud', 'hm'].forEach(t => {
    const panel = document.getElementById('calc-panel-' + t);
    const arrow = document.getElementById('calc-arrow-' + t);
    const item  = document.getElementById('calc-tool-' + t);
    if (panel) panel.style.display = 'none';
    if (arrow) arrow.style.transform = '';
    if (item)  item.classList.remove('calc-tool-open');
  });

  if (shouldOpen) {
    _calcOpenTool = tool;
    const panel = document.getElementById('calc-panel-' + tool);
    const arrow = document.getElementById('calc-arrow-' + tool);
    const item  = document.getElementById('calc-tool-' + tool);
    if (panel) panel.style.display = 'block';
    if (arrow) arrow.style.transform = 'rotate(90deg)';
    if (item)  item.classList.add('calc-tool-open');
    calcUpdate();
  } else {
    _calcOpenTool = null;
  }
}

// ── Legacy tab API shim (keep compat if anything still calls it) ─
function calcSetTab(tab) {
  calcToggleTool(tab, true);
}

// ── Scientific calculator toggle ──────────────────────────────
function calcToggleSci() {
  _calcSciOpen = !_calcSciOpen;
  const panel   = document.getElementById('calc-sci-panel');
  const chevron = document.getElementById('calc-sci-chevron');
  if (panel)   panel.style.display = _calcSciOpen ? 'block' : 'none';
  if (chevron) chevron.style.transform = _calcSciOpen ? 'rotate(90deg)' : '';
}

// ── Scientific calculator logic ───────────────────────────────
let _sciExpr    = '';
let _sciResult  = null;
let _sciNewNum  = false;  // after = was pressed, fresh input clears

function _sciRender() {
  const disp = document.getElementById('calc-sci-display');
  const expr = document.getElementById('calc-sci-expr');
  if (disp) disp.textContent = _sciExpr || '0';
  if (expr) expr.textContent = '';
}

function sciInsert(ch) {
  if (_sciNewNum && /[\d.]/.test(ch)) { _sciExpr = ''; }
  _sciNewNum = false;
  _sciExpr += ch;
  _sciRender();
}

function sciConst(c) {
  const val = c === 'Math.PI' ? Math.PI : Math.E;
  if (_sciNewNum) { _sciExpr = ''; }
  _sciNewNum = false;
  _sciExpr += val.toString();
  _sciRender();
}

function sciDel() {
  _sciNewNum = false;
  _sciExpr = _sciExpr.slice(0, -1);
  _sciRender();
}

function sciClear() {
  _sciExpr = '';
  _sciResult = null;
  _sciNewNum = false;
  const disp = document.getElementById('calc-sci-display');
  const expr = document.getElementById('calc-sci-expr');
  if (disp) disp.textContent = '0';
  if (expr) expr.textContent = '';
}

function sciFunc(fn) {
  // If there's already an expression, wrap it; otherwise start fresh
  const src = _sciExpr || '0';
  const num = parseFloat(src);

  const wrapFns = {
    sin:   () => `sin(${src})`,
    cos:   () => `cos(${src})`,
    tan:   () => `tan(${src})`,
    log:   () => `log(${src})`,
    ln:    () => `ln(${src})`,
    sqrt:  () => `√(${src})`,
    abs:   () => `|${src}|`,
    floor: () => `⌊${src}⌋`,
    pow2:  () => `(${src})²`,
    pow3:  () => `(${src})³`,
    inv:   () => `1/(${src})`,
  };

  const exprLabel = document.getElementById('calc-sci-expr');
  if (exprLabel) exprLabel.textContent = wrapFns[fn] ? wrapFns[fn]() : src;

  let result;
  try {
    switch(fn) {
      case 'sin':   result = Math.sin(num); break;
      case 'cos':   result = Math.cos(num); break;
      case 'tan':   result = Math.tan(num); break;
      case 'log':   result = Math.log10(num); break;
      case 'ln':    result = Math.log(num); break;
      case 'sqrt':  result = Math.sqrt(num); break;
      case 'abs':   result = Math.abs(num); break;
      case 'floor': result = Math.floor(num); break;
      case 'pow2':  result = Math.pow(num, 2); break;
      case 'pow3':  result = Math.pow(num, 3); break;
      case 'inv':   result = 1 / num; break;
      default:      result = NaN;
    }
    _sciExpr   = isFinite(result) ? _sciPretty(result) : 'Error';
    _sciResult = result;
    _sciNewNum = true;
  } catch(err) {
    _sciExpr = 'Error';
  }
  const disp = document.getElementById('calc-sci-display');
  if (disp) disp.textContent = _sciExpr;
}

function sciEval() {
  try {
    // Replace display operators and power operator before eval
    let expr = _sciExpr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/\^/g, '**');

    const exprLabel = document.getElementById('calc-sci-expr');
    if (exprLabel) exprLabel.textContent = _sciExpr + ' =';

    // Safe eval via Function constructor
    // eslint-disable-next-line no-new-func
    const result = Function('"use strict"; return (' + expr + ')')();
    _sciResult = result;
    _sciExpr   = isFinite(result) ? _sciPretty(result) : 'Error';
    _sciNewNum = true;
  } catch(e) {
    _sciExpr = 'Error';
    _sciNewNum = true;
  }
  const disp = document.getElementById('calc-sci-display');
  if (disp) disp.textContent = _sciExpr;
}

function _sciPretty(n) {
  if (!isFinite(n)) return 'Error';
  // Show up to 10 sig figs, strip trailing zeros
  const s = parseFloat(n.toPrecision(10)).toString();
  return s;
}

// Format metres
function _fmtMetres(m) {
  if (!isFinite(m) || m <= 0) return '—';
  return `${parseFloat(m.toFixed(7))} m`;
}

function calcUpdate() {
  const bd = _calcGetBodyData();
  const info   = document.getElementById('calc-body-info');
  const infoR  = document.getElementById('calc-info-r');
  const infoC  = document.getElementById('calc-info-cloud');

  if (!bd || bd.radius_m <= 0) {
    if (info) info.style.display = 'none';
    document.getElementById('calc-res-circ').textContent  = '—';
    document.getElementById('calc-res-cloud').textContent = '—';
    document.getElementById('calc-res-hm').textContent    = '—';
    return;
  }

  const { radius_m, cloudStartHeight_m } = bd;

  if (info) {
    info.style.display = '';
    infoR.textContent  = `r = ${_fmtMetres(radius_m)}`;
    infoC.textContent  = cloudStartHeight_m > 0
      ? `cloudStartHeight = ${_fmtMetres(cloudStartHeight_m)}`
      : 'No cloud layer defined';
  }

  // Circumference
  const circ = 2 * Math.PI * radius_m;
  document.getElementById('calc-res-circ').textContent = _fmtMetres(circ);

  // Cloud width
  const cloudN = Math.max(1, parseInt(document.getElementById('calc-cloud-n')?.value) || 8);
  const cloudNote = document.getElementById('calc-cloud-sh-note');
  if (cloudStartHeight_m > 0) {
    const cloudCirc  = 2 * Math.PI * (radius_m + cloudStartHeight_m);
    const cloudWidth = cloudCirc / cloudN;
    document.getElementById('calc-res-cloud').textContent = _fmtMetres(cloudWidth);
    if (cloudNote) cloudNote.textContent = `cloudStartHeight = ${_fmtMetres(cloudStartHeight_m)}`;
  } else {
    const cloudWidth = circ / cloudN;
    document.getElementById('calc-res-cloud').textContent = _fmtMetres(cloudWidth) + '  (no cloud layer — using surface r)';
    if (cloudNote) cloudNote.textContent = 'No CLOUDS.startHeight found for this body';
  }

  // Heightmap width
  const hmN    = Math.max(1, parseInt(document.getElementById('calc-hm-n')?.value) || 1024);
  const hmWidth = circ / hmN;
  document.getElementById('calc-res-hm').textContent = _fmtMetres(hmWidth);
}

// ════════════════════════════════════════════════════════════
//  HEIGHTMAP TOOLS
// ════════════════════════════════════════════════════════════

let _hmtBmpImg   = null;   // loaded Image element
let _hmtBmpPx    = null;   // Uint8ClampedArray pixels of the bump map
let _hmtBmpW     = 0;
let _hmtBmpH     = 0;
let _hmtProfile  = null;   // Float32Array of height values [0..1], output-width samples
let _hmtDragging = false;

function openHeightmapTools() {
  _utilsDropOpen = false;
  document.getElementById('utils-dropdown').style.display = 'none';
  const modal = document.getElementById('hmt-modal');
  modal.style.display = 'flex';
  hmtSetTab('bumpmap');
}

function closeHeightmapTools() {
  document.getElementById('hmt-modal').style.display = 'none';
}

// Close on backdrop click
document.getElementById('hmt-modal').addEventListener('mousedown', function(e){
  if(e.target === this) closeHeightmapTools();
});

function hmtSetTab(tab) {
  // Only one tab for now
  document.getElementById('hmt-bumpmap').style.display = 'flex';
}

// ── Load bump map image ───────────────────────────────────────
function hmtLoadFile(file) {
  if(!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      _hmtBmpImg = img;
      _hmtBmpW = img.width; _hmtBmpH = img.height;
      // Rasterise to offscreen canvas
      const oc = document.createElement('canvas');
      oc.width = _hmtBmpW; oc.height = _hmtBmpH;
      oc.getContext('2d').drawImage(img, 0, 0);
      _hmtBmpPx = oc.getContext('2d').getImageData(0, 0, _hmtBmpW, _hmtBmpH).data;

      // Draw preview
      const pv = document.getElementById('hmt-preview');
      pv.width  = _hmtBmpW;
      pv.height = _hmtBmpH;
      pv.getContext('2d').drawImage(img, 0, 0);

      // Size overlay canvas to match
      const ov = document.getElementById('hmt-overlay');
      ov.width  = _hmtBmpW;
      ov.height = _hmtBmpH;

      document.getElementById('hmt-dropzone').style.display = 'none';
      document.getElementById('hmt-loaded').style.display   = 'flex';

      hmtInitOverlayEvents();
      hmtUpdate();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ── Overlay drag events ───────────────────────────────────────
function hmtInitOverlayEvents() {
  const ov  = document.getElementById('hmt-overlay');
  const lat = document.getElementById('hmt-lat');

  function posToLat(clientY) {
    const rect = ov.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    return (frac * 100).toFixed(1);
  }

  ov.addEventListener('mousedown', e => { _hmtDragging = true; lat.value = posToLat(e.clientY); hmtUpdate(); });
  ov.addEventListener('mousemove', e => { if(_hmtDragging){ lat.value = posToLat(e.clientY); hmtUpdate(); } });
  window.addEventListener('mouseup', () => { _hmtDragging = false; });

  ov.addEventListener('touchstart', e => { _hmtDragging = true; lat.value = posToLat(e.touches[0].clientY); hmtUpdate(); }, {passive:true});
  ov.addEventListener('touchmove',  e => { if(_hmtDragging){ lat.value = posToLat(e.touches[0].clientY); hmtUpdate(); } }, {passive:true});
  ov.addEventListener('touchend',   () => { _hmtDragging = false; });
}

// ── Main update ───────────────────────────────────────────────
function hmtUpdate() {
  if(!_hmtBmpPx) return;

  const latFrac   = parseFloat(document.getElementById('hmt-lat').value) / 100;   // 0=top 1=bottom
  const lonOff    = parseFloat(document.getElementById('hmt-lon').value) / 100;   // 0–1 fraction
  const scale     = parseFloat(document.getElementById('hmt-scale').value);
  const smooth    = parseInt(document.getElementById('hmt-smooth').value);
  const invert    = document.getElementById('hmt-invert').checked;
  const outW      = parseInt(document.getElementById('hmt-width').value);

  // Update labels
  const latDeg = Math.round((latFrac - 0.5) * 180);
  document.getElementById('hmt-lat-val').textContent    = (latDeg >= 0 ? '+' : '') + latDeg + '°';
  document.getElementById('hmt-lon-val').textContent    = Math.round(lonOff * 360) + '°';
  document.getElementById('hmt-scale-val').textContent  = scale.toFixed(2) + '×';
  document.getElementById('hmt-smooth-val').textContent = smooth;

  // Sample row from bump map — interpolate between two rows for sub-pixel accuracy
  const rowF  = latFrac * (_hmtBmpH - 1);
  const row0  = Math.floor(rowF);
  const row1  = Math.min(row0 + 1, _hmtBmpH - 1);
  const rowT  = rowF - row0;

  const raw = new Float32Array(outW);
  for(let i = 0; i < outW; i++) {
    // Map output column i → source column with longitude offset
    const srcFrac = ((i / outW) + lonOff) % 1;
    const srcX    = srcFrac * (_hmtBmpW - 1);
    const x0 = Math.floor(srcX), x1 = Math.min(x0 + 1, _hmtBmpW - 1);
    const xT = srcX - x0;

    // Bilinear sample — use luminance (R channel of greyscale)
    function luma(row, col) {
      const idx = (row * _hmtBmpW + col) * 4;
      return _hmtBmpPx[idx] / 255; // R channel (same as G and B for greyscale)
    }
    const v = (luma(row0, x0) * (1-xT) + luma(row0, x1) * xT) * (1-rowT)
            + (luma(row1, x0) * (1-xT) + luma(row1, x1) * xT) * rowT;
    raw[i] = invert ? (1 - v) : v;
  }

  // Gaussian smoothing
  const prof = smooth > 0 ? _hmtGaussian(raw, smooth) : raw;

  // Apply scale — clamp to [0..1]
  _hmtProfile = new Float32Array(outW);
  for(let i = 0; i < outW; i++) {
    _hmtProfile[i] = Math.max(0, Math.min(1, prof[i] * scale));
  }

  hmtDrawOverlay(latFrac, lonOff);
  hmtDrawProfile();
}

function _hmtGaussian(data, radius) {
  const out = new Float32Array(data.length);
  const N   = data.length;
  const sigma = radius / 2;
  const ks = Math.ceil(radius * 2);
  // Build kernel
  const kern = new Float32Array(ks * 2 + 1);
  let ksum = 0;
  for(let i = -ks; i <= ks; i++) {
    kern[i + ks] = Math.exp(-(i*i) / (2 * sigma * sigma));
    ksum += kern[i + ks];
  }
  for(let i = 0; i < kern.length; i++) kern[i] /= ksum;
  for(let x = 0; x < N; x++) {
    let acc = 0;
    for(let k = -ks; k <= ks; k++) {
      acc += data[(x + k + N) % N] * kern[k + ks]; // wrap-around (equirectangular is cyclic)
    }
    out[x] = acc;
  }
  return out;
}

// ── Draw overlay line on the preview image ────────────────────
function hmtDrawOverlay(latFrac, lonOff) {
  const ov  = document.getElementById('hmt-overlay');
  const ctx = ov.getContext('2d');
  const W = ov.width, H = ov.height;
  const y = Math.round(latFrac * H);

  ctx.clearRect(0, 0, W, H);

  // Draw sample line
  ctx.strokeStyle = 'rgba(100,220,180,.85)';
  ctx.lineWidth   = Math.max(1, H / 200);
  ctx.setLineDash([]);
  ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();

  // Longitude offset marker
  const lonX = Math.round(lonOff * W);
  ctx.strokeStyle = 'rgba(255,200,80,.7)';
  ctx.lineWidth   = Math.max(1, H / 200);
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(lonX, 0); ctx.lineTo(lonX, H); ctx.stroke();
  ctx.setLineDash([]);

  // Drag handle on the latitude line
  ctx.fillStyle = 'rgba(100,220,180,.9)';
  ctx.beginPath(); ctx.arc(W / 2, y, Math.max(6, H / 60), 0, Math.PI*2); ctx.fill();
}

// ── Draw height profile canvas ────────────────────────────────
function hmtDrawProfile() {
  if(!_hmtProfile) return;
  const cv  = document.getElementById('hmt-profile');
  const ctx = cv.getContext('2d');
  const W   = cv.offsetWidth || 800;
  const H   = cv.offsetHeight || 64;
  cv.width  = W; cv.height = H;

  ctx.fillStyle = 'rgba(4,8,20,.95)';
  ctx.fillRect(0, 0, W, H);

  const N = _hmtProfile.length;
  // Fill
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, 'rgba(100,220,180,.6)');
  grad.addColorStop(1, 'rgba(100,220,180,.08)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(0, H);
  for(let i = 0; i < N; i++) {
    const x = (i / (N - 1)) * W;
    const y = H - _hmtProfile[i] * (H - 2) - 1;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
  // Line
  ctx.strokeStyle = 'rgba(100,220,180,.9)';
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  for(let i = 0; i < N; i++) {
    const x = (i / (N - 1)) * W;
    const y = H - _hmtProfile[i] * (H - 2) - 1;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
}

// ── Download as SFS heightmap PNG ─────────────────────────────
// SFS format: RGBA PNG where alpha encodes terrain height.
// Per _parseHmPng: scan bottom→top per column; first pixel where alpha < 255
// gives height = (j + alpha_frac) / H  where j=0 is image bottom.
// We encode height fraction h by placing the top-edge at row (H - floor(h*H) - 1)
// with alpha = fractional part * 255, everything below fully opaque, above transparent.
function hmtDownloadPNG() {
  if(!_hmtProfile) { alert('Load a bump map first.'); return; }
  const outW = _hmtProfile.length;
  const outH = 256; // standard SFS heightmap height
  const outC = document.createElement('canvas');
  outC.width = outW; outC.height = outH;
  const ctx  = outC.getContext('2d');
  const imgd = ctx.createImageData(outW, outH);
  const d    = imgd.data;

  for(let x = 0; x < outW; x++) {
    const frac    = _hmtProfile[outW - x - 1]; // horizontal mirror (game convention)
    // row 0 = top of canvas = j = H-1 bottom-up
    // terrain fills from bottom; edge pixel row (canvas) = H - 1 - Math.floor(frac * H)
    const edgeRow = outH - 1 - Math.floor(frac * (outH - 1));
    const alpha   = Math.round((frac * (outH - 1) - Math.floor(frac * (outH - 1))) * 255);

    for(let y = 0; y < outH; y++) {
      const idx = (y * outW + x) * 4;
      d[idx]     = 200; // R
      d[idx + 1] = 200; // G
      d[idx + 2] = 200; // B
      if(y > edgeRow) {
        d[idx + 3] = 255; // below edge = fully opaque (terrain body)
      } else if(y === edgeRow) {
        d[idx + 3] = alpha; // edge pixel = fractional alpha
      } else {
        d[idx + 3] = 0;   // above edge = transparent (sky)
      }
    }
  }

  ctx.putImageData(imgd, 0, 0);
  const link = document.createElement('a');
  link.href     = outC.toDataURL('image/png');
  link.download = 'heightmap_bumpconvert.png';
  link.click();
}
