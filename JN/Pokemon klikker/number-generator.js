(() => {
  // Lightweight standalone Number Generator — no build tools required
  const types = [
  { name: 'Grass', color: '#7AC74C', icon: '🍃', effect: 'leaves' },
  { name: 'Fire', color: '#EE8130', icon: '🔥', effect: 'embers' },
  { name: 'Water', color: '#709dffff', icon: '💧', effect: 'bubbles' },
  { name: 'Electric', color: '#F7D02C', icon: '⚡', effect: 'sparks' },
  { name: 'Normal', color: '#A8A77A', icon: '🔰' },
  { name: 'Ice', color: '#96D9D6', icon: '❄️', effect: 'snow' },
  { name: 'Fighting', color: '#C22E28', icon: '🥊' },
  { name: 'Poison', color: '#A33EA1', icon: '☠️' },
  { name: 'Ground', color: '#E2BF65', icon: '🪨' },
  { name: 'Flying', color: '#A98FF3', icon: '🕊️' },
  { name: 'Psychic', color: '#F95587', icon: '🔮' },
  { name: 'Bug', color: '#A6B91A', icon: '🐛' },
  { name: 'Rock', color: '#B6A136', icon: '🪨' },
  { name: 'Ghost', color: '#735797', icon: '👻' },
  { name: 'Dragon', color: '#6F35FC', icon: '🐉' },
  { name: 'Dark', color: '#705746', icon: '🌑' },
  { name: 'Steel', color: '#B7B7CE', icon: '⚙️' },
  { name: 'Fairy', color: '#D685AD', icon: '✨' }
  ]

  function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }

  function buildWidget(root) {
    // Create main wrapper
    const page = document.createElement('div'); page.className = 'platinum-theme';
    const header = document.createElement('header'); header.className = 'app-header'; header.innerHTML = '<h1>Renegade Platinum — Tools</h1>';
    const widget = document.createElement('div'); widget.className = 'np-platinum-widget';

    widget.innerHTML = `
      <div class="np-header">
        <h2>Renegade Platinum — Number Generator</h2>
        <p class="np-sub">1–3 roll • final pick glows in a random Pokémon type</p>
        <p class="np-sub">Add Pokémon to your roster and track alive/dead for Nuzlocke runs by dragging it from Alive to the Dead box if failed press dead!</p>
      </div>
      <div class="np-body">
        <div class="np-number"><div class="np-number-inner">—</div></div>
        <div class="np-type"><span class="np-type-placeholder">Type: random</span></div>
        <div class="np-controls"><button class="np-btn">Generate</button></div>
      </div>
      <div class="np-footer"><small>Background animates and pulses using the chosen type color.</small></div>
      <div class="np-roster">
        <div class="roster-controls">
          <input class="poke-name" placeholder="Name (e.g. Infernape)" />
          <input class="poke-type1 type-input" placeholder="Type 1 (e.g. Grass)" />
          <input class="poke-type2 type-input" placeholder="Type 2 (optional)" />
          <button class="add-poke">Add</button>
        </div>
        <div class="roster-boxes">
          <div class="roster-box alive"><h3>Alive</h3><div class="list alive-list"></div></div>
          <div class="roster-box dead"><h3>Dead</h3><div class="list dead-list"></div></div>
        </div>
      </div>
    `

    page.appendChild(header); page.appendChild(widget);
    // replace fallback content
    root.innerHTML = ''; root.appendChild(page);

    const numberEl = widget.querySelector('.np-number');
    const numberInner = widget.querySelector('.np-number-inner');
    const typeEl = widget.querySelector('.np-type');
    const btn = widget.querySelector('.np-btn');
    const addBtn = widget.querySelector('.add-poke');
    const nameInput = widget.querySelector('.poke-name');
    const type1Select = widget.querySelector('.poke-type1');
    const type2Select = widget.querySelector('.poke-type2');
    const aliveListEl = widget.querySelector('.alive-list');
    const deadListEl = widget.querySelector('.dead-list');

    // attach autosuggest-style type inputs (user can type; suggestions show colored hovers)
    const rosterControls = widget.querySelector('.roster-controls');

    let interval = null; let rolling = false;
    // simple roster for nuzlocke
    let roster = [];
    let sel = new Set(); // selected ids in overlay or UI
    let lastAddedId = null;

    function addPokemon(name, t1, t2, alive = true) {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2,6);
      // normalize types: ignore empty second type and canonicalize names to match `types` list
      function normalizeType(n) {
        if (!n) return '';
        const found = types.find(x => x.name.toLowerCase() === ('' + n).toLowerCase());
        if (found) return found.name;
        const s = ('' + n).trim(); return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
      }
      const typesArr = [normalizeType(t1), normalizeType(t2)].filter(Boolean);
      roster.push({ id, name: name || 'Unnamed', types: typesArr, alive: !!alive });
      // remember the id so we can scroll it into view after render
      lastAddedId = id;
      renderRoster();
    }

    // wire up add button and Enter key for name input with brief feedback
    addBtn.addEventListener('click', () => {
      const name = nameInput.value.trim(); if (!name) { nameInput.focus(); return }
      addBtn.disabled = true; const old = addBtn.textContent; addBtn.textContent = 'Adding…';
      addPokemon(name, type1Select.value, type2Select.value || '');
      nameInput.value = ''; type1Select.value = ''; type2Select.value = ''; nameInput.focus();
      setTimeout(() => { addBtn.textContent = old; addBtn.disabled = false }, 420);
    });
    nameInput.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') addBtn.click() });

    // helper: attach a suggestion dropdown to a text input for types
    function attachTypeAutosuggest(input) {
      input.setAttribute('autocomplete','off');
      const box = document.createElement('div'); box.className = 'type-suggest'; box.style.position='fixed'; box.style.zIndex=20001; box.style.display='none'; box.style.minWidth = '140px'; box.style.padding = '6px'; box.style.borderRadius='8px'; box.style.background='rgba(8,10,12,0.96)'; box.style.boxShadow='0 8px 28px rgba(0,0,0,0.7)';
      for (const t of types) {
        const it = document.createElement('div'); it.className='type-suggest-item'; it.textContent = t.name; it.dataset.type = t.name; it.style.padding='6px 8px'; it.style.borderRadius='6px'; it.style.cursor='pointer'; it.style.color = '#dce6f8';
        it.addEventListener('mouseenter', () => { it.style.background = t.color; it.style.color = colorContrast(t.color); it.classList.add('hovering'); });
        it.addEventListener('mouseleave', () => { it.style.background='transparent'; it.style.color = '#dce6f8'; it.classList.remove('hovering'); });
        it.addEventListener('click', ()=>{ input.value = t.name; hide(); input.focus(); });
        box.appendChild(it);
      }
      document.body.appendChild(box);
      // ensure the suggestion box is scrollable and responds to wheel events
      box.style.maxHeight = box.style.maxHeight || '220px';
      box.style.overflowY = box.style.overflowY || 'auto';
      function show(){ const r = input.getBoundingClientRect(); box.style.left = (r.left)+'px'; box.style.top = (r.bottom + 6)+'px'; box.style.display='block'; }
      function hide(){ box.style.display='none'; }
      // standard wheel handler so the suggestion box can be scrolled with the mouse wheel
      box.addEventListener('wheel', (ev) => {
        if (box.scrollHeight > box.clientHeight) {
          // scroll the box and prevent outer page scroll
          ev.preventDefault();
          ev.stopPropagation();
          box.scrollTop += ev.deltaY;
        }
      }, { passive: false });
      input.addEventListener('focus', show);
      input.addEventListener('input', () => {
        const v = input.value.trim().toLowerCase(); Array.from(box.children).forEach(ch => { ch.style.display = ch.textContent.toLowerCase().includes(v) ? 'block' : 'none'; }); show();
      });
      // hide soon after blur to allow click to register
      input.addEventListener('blur', () => { setTimeout(hide, 150); });
      // expose a helper to programmatically highlight a type
      function selectType(name) {
        Array.from(box.children).forEach(ch => { if (ch.dataset.type === name) { const t = types.find(x=>x.name===name); if (t) { ch.style.background = t.color; ch.style.color = colorContrast(t.color); ch.classList.add('selected'); } } else { ch.style.background='transparent'; ch.style.color='#dce6f8'; ch.classList.remove('selected'); } });
      }
      // save helpers on the input so callers can preselect
      input._autosuggest = { box, show, hide, selectType };
      return { box, show, hide, selectType };
    }

    // attach autosuggest widgets to roster type inputs (use existing variables above)
    attachTypeAutosuggest(type1Select);
    attachTypeAutosuggest(type2Select);

    // make lists keyboard-focusable and ensure wheel scrolling works on Chrome
    aliveListEl.tabIndex = 0; deadListEl.tabIndex = 0;
    function listWheelHandler(ev) {
      // if the list is scrollable, handle wheel movement ourselves to ensure Chrome scrolls it
      const el = ev.currentTarget;
      if (el.scrollHeight > el.clientHeight) {
        // prevent outer page scroll and scroll the element
        ev.preventDefault();
        el.scrollTop += ev.deltaY;
      }
    }
    // Use passive:false so we can preventDefault inside wheel handler
    aliveListEl.addEventListener('wheel', listWheelHandler, { passive: false });
    deadListEl.addEventListener('wheel', listWheelHandler, { passive: false });

    // Removed the "Faint Selected" button — use drag-to-dead or double-click to mark fainted

    function renderRoster() {
      // cleanup selections that refer to dead pokemon
      for (const id of Array.from(sel)) {
        const p = roster.find(x=>x.id===id); if (!p || !p.alive) sel.delete(id);
      }
      aliveListEl.innerHTML = '';
      deadListEl.innerHTML = '';
      for (const p of roster) {
        const el = document.createElement('div'); el.className = 'poke-item'; el.dataset.id = p.id;
        const color = renderTypeStyle(p.types);
        el.style.background = color.bg; el.style.color = color.text;
        const typesHtml = (p.types || []).map(tn => {
          const tt = types.find(x=>x.name===tn); const tc = tt? tt.color : '#777';
          return `<span class="type-chip" data-type="${tn}" style="background:${hexToRgba(tc,0.18)};color:${colorContrast(tc)};box-shadow: 0 8px 22px ${hexToRgba(tc,0.12)}">${tn}</span>`;
        }).join('');
        el.innerHTML = `<div class="name">${p.name}</div><div class="types">${typesHtml}</div>`;
        // enable click selection for alive items
        el.addEventListener('click', () => {
          if (!p.alive) return; // only select alive
          if (sel.has(p.id)) { sel.delete(p.id); el.classList.remove('selected') } else { sel.add(p.id); el.classList.add('selected') }
        });
        // make alive items draggable to dead box
        if (p.alive) {
          el.setAttribute('draggable','true');
          el.style.cursor = 'grab';
          el.addEventListener('dragstart', (ev) => { ev.dataTransfer.setData('text/poke-id', p.id); ev.dataTransfer.setData('text/plain', p.id); ev.dataTransfer.setData('text', p.id); ev.dataTransfer.effectAllowed='move'; });
          el.addEventListener('dragend', ()=>{ const boxes = widget.querySelectorAll('.roster-box.dead'); boxes.forEach(b=>b.classList.remove('drop-over')); });
          el.addEventListener('dblclick', ()=>{ p.alive = false; renderRoster(); showBgToast(`${p.name} moved to Dead (dblclick)`, 'fail'); });
        } else {
          el.removeAttribute('draggable');
        }
        // add a colored left accent using primary type for clearer visuals
        const primaryType = (p.types && p.types[0]) ? (types.find(tt=>tt.name===p.types[0])?.color) : null;
        if (primaryType) { el.style.borderLeft = `6px solid ${primaryType}`; el.style.paddingLeft = '0.6rem' }
        // apply duo border if provided by renderTypeStyle
        if (color.border) { el.style.border = `1px solid ${color.border}` }
        // reapply selection state when rendering
        if (sel.has(p.id)) el.classList.add('selected');
        if (p.alive) aliveListEl.appendChild(el); else deadListEl.appendChild(el);
      }
      // if we recently added an item, scroll it into view and highlight briefly
      if (lastAddedId) {
        const el = widget.querySelector(`.poke-item[data-id="${lastAddedId}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          el.classList.add('jump');
          setTimeout(()=>{ el.classList.remove('jump') }, 800);
        }
        lastAddedId = null;
      }
    }

    function renderTypeStyle(typesArr) {
      // List items use a dark background; text is a readable tint of the type (or mix)
      const clean = (typesArr || []).filter(Boolean);
      if (clean.length === 0) return { bg: 'rgba(0,0,0,0.6)', text: '#fff' };
      if (clean.length === 1) {
        const t = types.find(x=>x.name===clean[0]); const c = t? t.color:'#fff';
        const txt = brightenHex(c, 0.62); // tint toward white for contrast
        // single type: dark base with a soft tinted overlay
        return { bg: `linear-gradient(90deg, ${hexToRgba(c,0.14)}, ${hexToRgba(c,0.06)}), rgba(0,0,0,0.6)`, text: txt };
      }
      const t0 = types.find(x=>x.name===clean[0]); const t1 = types.find(x=>x.name===clean[1]);
      const c0 = t0? t0.color : '#fff'; const c1 = t1? t1.color : '#888';
      // duo type: stronger gradient overlay and a subtle mixed border for better visibility
      const txt = brightenHex(mixColors(c0, c1, 0.5), 0.54);
      const border = hexToRgba(mixColors(c0, c1, 0.5), 0.18);
      return { bg: `linear-gradient(90deg, ${hexToRgba(c0,0.28)}, ${hexToRgba(c1,0.28)}), rgba(0,0,0,0.6)`, text: txt, border };
    }

    function hexToRgba(hex, alpha=1) {
      const c = hex.replace('#','');
      const r = parseInt(c.substring(0,2),16);
      const g = parseInt(c.substring(2,4),16);
      const b = parseInt(c.substring(4,6),16);
      return `rgba(${r},${g},${b},${alpha})`;
    }

    function mixColors(a,b,ratio){ const aa=a.replace('#',''), bb=b.replace('#',''); const ar=[parseInt(aa.slice(0,2),16),parseInt(aa.slice(2,4),16),parseInt(aa.slice(4,6),16)]; const br=[parseInt(bb.slice(0,2),16),parseInt(bb.slice(2,4),16),parseInt(bb.slice(4,6),16)]; const r=Math.round(ar[0]*(1-ratio)+br[0]*ratio).toString(16).padStart(2,'0'); const g=Math.round(ar[1]*(1-ratio)+br[1]*ratio).toString(16).padStart(2,'0'); const bl=Math.round(ar[2]*(1-ratio)+br[2]*ratio).toString(16).padStart(2,'0'); return `#${r}${g}${bl}` }

    function colorContrast(hex){ const c = hex.replace('#',''); const r=parseInt(c.slice(0,2),16), g=parseInt(c.slice(2,4),16), b=parseInt(c.slice(4,6),16); return (r*0.299+g*0.587+b*0.114)>150? '#111':'#fff'; }
    function darken(hex, amt){ const c = hex.replace('#',''); const r=Math.max(0,Math.floor(parseInt(c.slice(0,2),16)*(1-amt))).toString(16).padStart(2,'0'); const g=Math.max(0,Math.floor(parseInt(c.slice(2,4),16)*(1-amt))).toString(16).padStart(2,'0'); const b=Math.max(0,Math.floor(parseInt(c.slice(4,6),16)*(1-amt))).toString(16).padStart(2,'0'); return `#${r}${g}${b}` }

    function setTypeVisual(t) {
      if (!t) {
        widget.classList.remove('has-type');
        page.classList.remove('page-has-type');
        widget.style.removeProperty('--type-color');
        page.style.removeProperty('--page-type-color');
        typeEl.innerHTML = '<span class="np-type-placeholder">Type: random</span>'
        currentEffect = '';
        return
      }
      widget.classList.add('has-type'); page.classList.add('page-has-type');
      widget.style.setProperty('--type-color', t.color); page.style.setProperty('--page-type-color', t.color);
      typeEl.innerHTML = `<span class="np-type-dot" style="background:${t.color}">${t.icon}</span><span class="np-type-name">${t.name}</span>`
      // light up the number in the chosen type color briefly
      numberEl.classList.add('lit');
      numberEl.style.boxShadow = `0 18px 64px ${t.color}`;
      numberInner.style.color = colorContrast(t.color) === '#111' ? '#111' : '#fff';
      // pulse background using the color
      numberEl.style.background = `linear-gradient(135deg, ${t.color}, ${darken(t.color,0.22)})`;
      setTimeout(()=>{ numberEl.classList.remove('lit'); numberEl.style.boxShadow=''; numberInner.style.color=''; numberEl.style.background=''; }, 1400);
    }

    // Handle encounter: require selecting up to `count` alive pokémon that match typeName
    function handleEncounter(typeName, count) {
      // Show a small registration form: name, types, status. Cancel => reroll.
      const overlay = document.createElement('div'); overlay.className = 'encounter-overlay';
      const panel = document.createElement('div'); panel.className='panel';
      panel.innerHTML = `
        <div><strong>Encounter — ${typeName}</strong></div>
        <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <input class="enc-name" placeholder="Wild Pokémon name" style="flex:1;padding:6px;border-radius:6px;border:1px solid rgba(255,255,255,0.04)" />
          <input class="enc-type1 type-input" placeholder="Type 1" />
          <input class="enc-type2 type-input" placeholder="Type 2 (optional)" />
          <select class="enc-status"><option value="alive">Alive</option><option value="dead">Dead</option></select>
        </div>
        <div style="text-align:right;margin-top:10px"><button class="btn-cancel">Cancel</button><button class="btn-ok">Confirm</button></div>`;
      overlay.appendChild(panel); document.body.appendChild(overlay);

      // attach autosuggest widgets to the type inputs and prefill type1
      const type1Sel = panel.querySelector('.enc-type1');
      const type2Sel = panel.querySelector('.enc-type2');
      type1Sel.value = typeName;
      attachTypeAutosuggest(type1Sel); attachTypeAutosuggest(type2Sel);
      // highlight the initial drawn type in the suggestions
      if (type1Sel._autosuggest && typeof type1Sel._autosuggest.selectType === 'function') type1Sel._autosuggest.selectType(typeName);
      const nameInput = panel.querySelector('.enc-name'); nameInput.focus();

      const btnCancel = panel.querySelector('.btn-cancel');
      const btnOk = panel.querySelector('.btn-ok');

      btnCancel.addEventListener('click', () => {
        btnCancel.disabled = true; const old = btnCancel.textContent; btnCancel.textContent = 'Rerolling…';
        overlay.remove(); setTimeout(() => { if (!rolling) roll(); setTimeout(()=>{ btnCancel.textContent = old; btnCancel.disabled=false }, 420); }, 150);
      });

      function confirmRegister() {
        const nm = panel.querySelector('.enc-name').value.trim() || 'Wild Pokémon';
        const t1 = panel.querySelector('.enc-type1').value;
        const t2 = panel.querySelector('.enc-type2').value || '';
        const status = panel.querySelector('.enc-status').value;
        const aliveFlag = status === 'alive';
        btnOk.disabled = true; const old = btnOk.textContent; btnOk.textContent = 'Registering…';
        addPokemon(nm, t1, t2, aliveFlag);
        // if it fainted and count===1, consider encounter failed
        if (!aliveFlag && count === 1) {
          showBgToast(`Encounter failed: ${nm} fainted`, 'fail');
        } else {
          showBgToast(`Registered: ${nm}`, 'success');
        }
        overlay.remove(); setTimeout(()=>{ btnOk.textContent = old; btnOk.disabled = false }, 540);
      }

      btnOk.addEventListener('click', confirmRegister);
      nameInput.addEventListener('keydown', (ev)=>{ if (ev.key === 'Enter') confirmRegister(); });
    }

    // Particle canvas background — subtle floating particles that use the selected type color
    // Use a full-viewport, fixed canvas so particles cover the whole window
    const canvas = document.createElement('canvas');
    canvas.className = 'particle-canvas';
    // append to body so it covers the full window
    document.body.insertBefore(canvas, document.body.firstChild);
    const ctx = canvas.getContext('2d');
    let particles = [];
    let particleColor = '#6b6ff3';
    // brighter variant used for more vivid particles
    let particleColorBright = '#8b8fff';
    // current effect name ('' | 'snow' | 'bubbles' | 'embers' ...)
    let currentEffect = '';
    let frameTime = 0;
    let anim = null;

    function resizeCanvas() {
      // full window size for the particle field
      canvas.width = Math.max(300, Math.floor(window.innerWidth));
      canvas.height = Math.max(200, Math.floor(window.innerHeight));
    }

    function makeParticle(w, h) {
      // per-effect particle tuning (keeps overall code compact)
      const eff = currentEffect;
      let size = Math.random() * 14 + 6; // default 6..20
      let vx = (Math.random() - 0.5) * 0.5;
      let vy = (Math.random() - 0.5) * 0.4;
      let alpha = Math.random() * 0.6 + 0.32; // generally brighter
      if (eff === 'snow') {
        size = Math.random() * 10 + 6; vx = (Math.random() - 0.5) * 0.3; vy = 0.15 + Math.random() * 0.25; alpha = 0.72 + Math.random() * 0.36;
      } else if (eff === 'bubbles') {
        size = Math.random() * 20 + 8; vx = (Math.random() - 0.5) * 0.25; vy = -(0.3 + Math.random() * 0.6); alpha = 0.22 + Math.random() * 0.42;
      } else if (eff === 'embers') {
        size = Math.random() * 8 + 3; vx = (Math.random() - 0.5) * 0.6; vy = -(0.5 + Math.random() * 1.2); alpha = 0.72 + Math.random() * 0.4;
      } else if (eff === 'sparks') {
        size = Math.random() * 6 + 2; vx = (Math.random() - 0.5) * 1.2; vy = -(Math.random() * 0.8); alpha = 0.72 + Math.random() * 0.4;
      } else if (eff === 'leaves') {
        size = Math.random() * 14 + 6; vx = (Math.random() - 0.5) * 0.8; vy = 0.1 + Math.random() * 0.3; alpha = 0.64 + Math.random() * 0.44;
      }
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx, vy,
        size,
        baseSize: size,
        life: Math.random() * 200 + 120,
        ttl: 0,
        alpha,
        effect: eff
      }
    }

    function ensureParticles() {
      // further reduce density for smoother perf: fewer particles per area
      const area = canvas.width * canvas.height;
      const target = Math.min(60, Math.max(10, Math.floor(area / 30000)));
      while (particles.length < target) particles.push(makeParticle(canvas.width, canvas.height));
      while (particles.length > target) particles.pop();
    }

    // drag & drop handling for moving alive -> dead (attach to the dead box itself for robust handling)
    const deadBox = widget.querySelector('.roster-box.dead');
    function onDragOver(ev){ ev.preventDefault(); ev.dataTransfer.dropEffect='move'; deadBox.classList.add('drop-over'); }
    function onDragLeave(ev){ deadBox.classList.remove('drop-over'); }
    function onDrop(ev){ ev.preventDefault(); deadBox.classList.remove('drop-over'); const id = ev.dataTransfer.getData('text/poke-id') || ev.dataTransfer.getData('text/plain'); if (!id) return; const p = roster.find(x=>x.id===id); if (!p) return; p.alive = false; renderRoster(); showBgToast(`${p.name} moved to Dead`, 'fail'); }
    deadBox.addEventListener('dragover', onDragOver);
    deadBox.addEventListener('dragenter', onDragOver);
    deadBox.addEventListener('dragleave', onDragLeave);
    deadBox.addEventListener('drop', onDrop);

    function drawParticles() {
      // simple, low-cost draw routine with a global drift for more visible motion
      ctx.clearRect(0,0,canvas.width,canvas.height);
      // compute a global drift from the current frame time to avoid per-particle trig
      const t = frameTime * 0.001 || 0;
      const driftX = Math.sin(t * 0.6) * 0.45; // gentle but visible drift
      const driftY = Math.cos(t * 0.4) * 0.28;
      for (let p of particles) {
        p.ttl += 1;
        // apply motion with drift scaled by size for parallax effect
        p.x += p.vx + driftX * (p.size / 16);
        p.y += p.vy + driftY * (p.size / 20);
        // gentle size/alpha pulse (more intense)
        const pulse = 0.74 + 0.6 * Math.sin((p.ttl * 0.012) + (p.x * 0.0008));
        const a = Math.max(0.08, Math.min(1, p.alpha * pulse * 1.2));

        // wrap
        if (p.x < -p.size) p.x = canvas.width + p.size;
        if (p.x > canvas.width + p.size) p.x = -p.size;
        if (p.y < -p.size) p.y = canvas.height + p.size;
        if (p.y > canvas.height + p.size) p.y = -p.size;

        const eff = p.effect;
        if (eff === 'snow') {
          const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          grd.addColorStop(0, `rgba(255,255,255,${Math.min(1,a)})`);
          grd.addColorStop(0.6, `rgba(190,230,255,${Math.min(1,a * 0.7)})`);
          grd.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        } else if (eff === 'bubbles') {
          // bubble: soft inner + bright rim
          const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          grd.addColorStop(0, `rgba(255,255,255,${a * 0.9})`);
          grd.addColorStop(0.8, `rgba(200,230,255,${a * 0.3})`);
          grd.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
          // rim
          ctx.globalCompositeOperation = 'source-over'; ctx.strokeStyle = `rgba(255,255,255,${Math.min(1,a * 0.36)})`; ctx.lineWidth = Math.max(1, p.size * 0.12); ctx.beginPath(); ctx.arc(p.x, p.y, p.size - 0.5, 0, Math.PI * 2); ctx.stroke();
        } else if (eff === 'embers') {
          const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          grd.addColorStop(0, `rgba(255,220,120,${Math.min(1, a)})`);
          grd.addColorStop(0.5, `rgba(255,140,60,${Math.min(1, a * 0.6)})`);
          grd.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        } else {
          const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          grd.addColorStop(0, particleColorWithAlpha(Math.min(1, a * 1.15), true));
          grd.addColorStop(0.45, particleColorWithAlpha(Math.min(1, a * 0.6), false));
          grd.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        }
      }
    }

    function particleColorWithAlpha(a, bright) {
      // convert hex to rgba and optionally use the bright variant
      const hex = (bright ? particleColorBright : particleColor).replace('#','');
      const r = parseInt(hex.substring(0,2),16);
      const g = parseInt(hex.substring(2,4),16);
      const b = parseInt(hex.substring(4,6),16);
      return `rgba(${r},${g},${b},${a})`;
    }

    // throttle the animation to a modest FPS to reduce CPU/GPU usage
    let lastFrame = 0;
    const maxFPS = 16; // target FPS (lower == less CPU usage)
    const frameInterval = 1000 / maxFPS;
    function loop(now) {
      anim = requestAnimationFrame(loop);
      if (!lastFrame) lastFrame = now;
      if (now - lastFrame < frameInterval) return;
      lastFrame = now;
      frameTime = now;
      ensureParticles();
      drawParticles();
    }

    // DEPRECATED overlay-free background toast: appears behind widget as non-modal feedback
    const bgToast = document.createElement('div'); bgToast.className = 'bg-toast info'; bgToast.textContent = ''; page.appendChild(bgToast);
    let toastTimer = null;
    function showBgToast(msg, kind='info') {
      bgToast.className = 'bg-toast ' + kind; bgToast.textContent = msg; // place behind but visible
      // show briefly and then hide; keep it background (not modal)
      setTimeout(()=>{ bgToast.classList.add('show') }, 10);
      clearTimeout(toastTimer); toastTimer = setTimeout(()=>{ bgToast.classList.remove('show') }, 1600);
    }

    // update particle color when type changes
    const origSetTypeVisual = setTypeVisual;
    setTypeVisual = (t) => {
      origSetTypeVisual(t);
      if (t) {
        // compute a brighter variant for inner particle glow
        particleColor = t.color || particleColor;
        particleColorBright = brightenHex(particleColor, 0.6);
        currentEffect = t.effect || '';
      }
    }

    function brightenHex(hex, mix) {
      const c = hex.replace('#','');
      const r = parseInt(c.substring(0,2),16);
      const g = parseInt(c.substring(2,4),16);
      const b = parseInt(c.substring(4,6),16);
      const nr = Math.min(255, Math.round(r + (255 - r) * mix));
      const ng = Math.min(255, Math.round(g + (255 - g) * mix));
      const nb = Math.min(255, Math.round(b + (255 - b) * mix));
      return `#${nr.toString(16).padStart(2,'0')}${ng.toString(16).padStart(2,'0')}${nb.toString(16).padStart(2,'0')}`;
    }

    // init
    window.addEventListener('resize', () => { resizeCanvas(); ensureParticles(); });
    // initialize canvas to cover the viewport
    resizeCanvas(); ensureParticles(); anim = requestAnimationFrame(loop);

    function roll() {
      if (rolling) return
      rolling = true; btn.textContent = 'Rolling…'; numberEl.classList.add('rolling')
      interval = setInterval(() => { numberInner.textContent = randomInt(1,3) }, 60)
      setTimeout(() => {
        clearInterval(interval); interval = null; const finalNum = randomInt(1,3); const finalType = types[randomInt(0, types.length - 1)];
        numberInner.textContent = finalNum; setTypeVisual(finalType); // handle Nuzlocke encounter
        handleEncounter(finalType.name, finalNum);
        rolling = false; btn.textContent = 'Generate'; numberEl.classList.remove('rolling')
      }, 1000)
    }

    btn.addEventListener('click', roll)

    // expose for debugging
    return { page, widget, roll, setTypeVisual }
  }

  // bootstrap when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => buildWidget(document.getElementById('root')))
  } else {
    buildWidget(document.getElementById('root'))
  }

})();
