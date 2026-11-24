(() => {
'use strict';
const $ = s => document.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// mobile menu
const menu = $('.menu'), links = $('#navlinks');
menu.addEventListener('click', () => { const o = links.classList.toggle('open'); menu.setAttribute('aria-expanded', o); });
links.addEventListener('click', e => { if (e.target.tagName === 'A') { links.classList.remove('open'); menu.setAttribute('aria-expanded', false); } });

// reveal on scroll
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
document.querySelectorAll('.rv').forEach(e => io.observe(e));

// hero: example prompts, function calls and reasoning
const DEMO = [
  { p: 'Build this house from the plan and the section.', calls: [['reads the drawings', 'trace_plan'], ['registers the section', 'trace_section'], ['builds the model', 'build_model'], ['compares it with the drawings', 'critique_model']], cot: 'Ground floor 12 by 9 m, walls 30 cm, section height 3.00 m.' },
  { p: 'Add the real context around the site.', calls: [['finds the place', 'locate_site'], ['takes buildings from the maps', 'build_context'], ['checks them on the satellite photo', 'build_context'], ['reads the facades', 'declare_streetview']], cot: 'Twelve blocks within 150 m, heights from the facades.' },
  { p: 'Render it from the terrace and make it photographic.', calls: [['places a target camera', 'add_camera'], ['renders with the path tracer', 'render_for_chatgpt'], ['writes the prompt from the IDs', 'get_render_prompt'], ['saves the final image', 'save_render_result']], cot: 'Camera on the terrace, 1.6 m high. Same geometry, materials from the IDs.' },
];
const typed = $('#typed'), calls = $('#calls'), cot = $('#cot');
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function demo() {
  for (let k = 0; ; k = (k + 1) % DEMO.length) {
    const d = DEMO[k];
    calls.innerHTML = d.calls.map(([t, f]) => `<li><b>○</b><span>${t}</span><code>${f}</code></li>`).join('');
    cot.innerHTML = '<b>Gapsman</b> · ';
    typed.textContent = '';
    if (reduce) typed.textContent = d.p; else for (const ch of d.p) { typed.textContent += ch; await sleep(34); }
    await sleep(500);
    const li = [...calls.children];
    for (const e of li) { e.classList.add('on'); e.querySelector('b').textContent = '◐'; await sleep(700); e.querySelector('b').textContent = '✓'; }
    cot.innerHTML = `<b>Gapsman</b> · ${d.cot}`;
    await sleep(3200);
  }
}
demo();

// video: load the player only when asked
$('#poster').addEventListener('click', () => {
  const f = document.createElement('iframe');
  f.src = 'video/gapsman-video.html?autoplay=1';
  f.title = 'Gapsman video';
  f.allow = 'autoplay; fullscreen';
  f.allowFullscreen = true;
  $('#player').replaceChildren(f);
  f.addEventListener('load', () => { try { f.contentWindow.focus(); } catch (e) { /* cross-origin */ } });
});

// render pipeline
const STEPS = [
  { l: 'Basic render · path tracer', h: '1 · The basic render', d: 'The AI places a target camera and renders the model with the path tracer, in tiles, inside the chat.', li: ['Path, Full and Lite engines', 'Quality from 1 to 5', 'HDRI sky and sun'] },
  { l: 'Render ID · one colour per material', h: '2 · The ID render', d: 'Every material and every object gets a colour and a code. This is how the final image knows what is concrete, glass, water or a tree.', legend: true },
  { l: 'Layers · post-produced render', h: '3 · The layers', d: 'The levers of the render panel adjust exposure, light mix, temperature, reflections, contrast and saturation. Move the lever to see the post-produced layer over the basic render.', li: ['The AI moves the levers from your words', 'You can move them by hand'] },
  { l: 'Stable Diffusion · final image', h: '4 · The final image', d: 'ChatGPT receives the post-produced render, the ID render and a prompt written from the IDs, and returns the final image with the same camera and geometry.', li: ['Same format, same camera', 'Materials from the ID codes'] },
];
const LEG = [['#a9a9a9', 'CONCRETE-01'], ['#6fe8f5', 'GLASS-01'], ['#0a7f8c', 'WATER-01'], ['#d8c6a6', 'STONE-01'], ['#2bb52b', 'E-01 · trees'], ['#2f7ee8', 'SKY']];
const box = $('#stagebox'), [i3, iid, isd] = box.querySelectorAll('.top3'), lever = $('#lever'), lev = $('#lev'), levv = $('#levv');
const tabs = [...document.querySelectorAll('.tabs button')];
function step(k) {
  tabs.forEach((b, i) => b.setAttribute('aria-selected', i === k));
  const s = STEPS[k];
  $('#slbl').textContent = s.l;
  iid.style.opacity = k === 1 ? 1 : 0;
  isd.style.opacity = k === 3 ? 1 : 0;
  i3.style.opacity = k === 2 ? lev.value / 100 : k === 3 ? 1 : 0;
  lever.classList.toggle('on', k === 2);
  $('#pdesc').innerHTML = `<h3>${s.h}</h3><p>${s.d}</p>` + (s.li ? `<ul>${s.li.map(x => `<li>${x}</li>`).join('')}</ul>` : '') +
    (s.legend ? `<div class="legend">${LEG.map(([c, t]) => `<span><i style="background:${c}"></i><b class="mono" style="font-size:12px">${t}</b></span>`).join('')}</div>` : '');
  if (k === 2 && !reduce && lev.value == 0) animateLever();
}
let anim = 0;
function animateLever() {
  const t0 = performance.now(), id = ++anim;
  const f = now => { if (id !== anim) return; const p = Math.min(1, (now - t0) / 3000); lev.value = Math.round(p * 100); lev.dispatchEvent(new Event('input')); if (p < 1) requestAnimationFrame(f); };
  requestAnimationFrame(f);
}
lev.addEventListener('input', () => { levv.textContent = lev.value; i3.style.opacity = lev.value / 100; });
lev.addEventListener('pointerdown', () => anim++);
tabs.forEach((b, i) => b.addEventListener('click', () => step(i)));
tabs.forEach((b, i) => b.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const n = (i + (e.key === 'ArrowRight' ? 1 : 3)) % 4; tabs[n].focus(); step(n); } }));
step(0);

// gallery
const G = [
  ['01', 'Villa with pool', 1], ['18', 'From a sketch to a photorealistic image'], ['02', 'Plaster house'], ['03', 'Dining area'],
  ['15', 'Real city context', 1], ['04', 'Sunset terrace'], ['05', 'Residential towers'], ['06', 'Living room with fireplace'],
  ['07', 'Glass towers'], ['16', 'Interior'], ['08', 'Double-height living room'], ['09', 'Open space'],
  ['17', 'Square with a church', 1], ['10', 'Curved canopy'], ['11', 'Green terraces'], ['12', 'Organic villa'],
  ['13', 'Mirror pavilion'], ['14', 'Glass wave'],
];
const gal = $('#gal');
gal.innerHTML = G.map(([n, t, w], i) => `<button class="${w ? 'wide' : ''}" data-i="${i}" aria-label="Enlarge: ${t}"><img src="img/gallery/${n}.webp" alt="${t}" loading="lazy"><span>${t}</span></button>`).join('');
const lb = $('#lb'), lbimg = $('#lbimg'), lbcap = $('#lbcap');
let cur = 0;
const show = i => { cur = (i + G.length) % G.length; lbimg.src = `img/gallery/${G[cur][0]}.webp`; lbimg.alt = G[cur][1]; lbcap.textContent = G[cur][1]; };
gal.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; show(+b.dataset.i); lb.showModal(); });
lb.querySelector('.x').onclick = () => lb.close();
lb.querySelector('.pv').onclick = () => show(cur - 1);
lb.querySelector('.nx').onclick = () => show(cur + 1);
lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
lb.addEventListener('keydown', e => { if (e.key === 'ArrowRight') show(cur + 1); else if (e.key === 'ArrowLeft') show(cur - 1); });

// limits, same texts as the plugin panel
const L = [
  ['Time grows with booleans', 'each Boolean recomputes the whole solid in the kernel', 'many openings or cuts in a row slow the build'],
  ['A 2D drawing has no heights or thicknesses', 'plans and photos lack the third dimension', 'missing dimensions become standard values, to check'],
  ['Free forms need the user’s hand', 'loft, sweep and network depend on the input curves', 'the first result must be refined in the modeler'],
  ['Operations on operations strain the kernel', 'tiny edges and faces accumulate numerical errors', 'a boolean may fail or leave the solid open'],
  ['Valid does not mean buildable', 'the software checks geometry, not structure or codes', 'a licensed professional is always needed'],
  ['Mesh weight in the chat', 'the model travels as triangles inside the chat window', 'very large scenes open more slowly'],
];
$('#lims').innerHTML = L.map(([t, c, e]) => `<div class="lim rv in"><h3>${t}</h3><dl><dt>Cause</dt><dd>${c}</dd><dt>Effect</dt><dd>${e}</dd></dl></div>`).join('');
})();
