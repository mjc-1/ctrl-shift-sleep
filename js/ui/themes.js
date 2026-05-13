const THEMES = {
    'Midnight': {
        primary: '#818cf8', bg: '#0f172a', card: '#1e293b', text: '#f8fafc',
        border: '#475569', danger: '#ef4444', warn: '#fbbf24', success: '#10b981',
        cTotal: '#60a5fa', cRem: '#818cf8',
        hypnoColor: '#818cf8', hypnoFill: 'rgba(129,140,248,0.15)',
        cardRgb: '30, 41, 59',
        activityColors: { Sleep: '#818cf8', Work: '#fbbf24', Commute: '#f97316', Exercise: '#22d3ee', Family: '#ec4899', Custom: '#10b981' }
    },
    'Deep Sea': {
        primary: '#22d3ee', bg: '#0a1628', card: '#0f2040', text: '#e0f2fe',
        border: '#164e63', danger: '#f87171', warn: '#fbbf24', success: '#34d399',
        cTotal: '#22d3ee', cRem: '#818cf8',
        hypnoColor: '#818cf8', hypnoFill: 'rgba(129,140,248,0.15)',
        cardRgb: '15, 32, 64',
        activityColors: { Sleep: '#818cf8', Work: '#06b6d4', Commute: '#0ea5e9', Exercise: '#22d3ee', Family: '#a78bfa', Custom: '#34d399' }
    },
    'Ember': {
        primary: '#fb923c', bg: '#1a0f07', card: '#2a1a0e', text: '#fef3c7',
        border: '#78350f', danger: '#f87171', warn: '#fcd34d', success: '#86efac',
        cTotal: '#fbbf24', cRem: '#fb923c',
        hypnoColor: '#fb923c', hypnoFill: 'rgba(251,146,60,0.15)',
        cardRgb: '42, 26, 14',
        activityColors: { Sleep: '#c084fc', Work: '#fb923c', Commute: '#ef4444', Exercise: '#f59e0b', Family: '#f472b6', Custom: '#86efac' }
    },
    'Forest': {
        primary: '#16a34a', bg: '#011b09', card: '#052e14', text: '#d1fae5',
        border: '#14532d', danger: '#fca5a5', warn: '#fde68a', success: '#6ee7b7',
        cTotal: '#16a34a', cRem: '#0891b2',
        hypnoColor: '#16a34a', hypnoFill: 'rgba(22,163,74,0.15)',
        cardRgb: '5, 46, 20',
        activityColors: { Sleep: '#16a34a', Work: '#65a30d', Commute: '#ca8a04', Exercise: '#0891b2', Family: '#db2777', Custom: '#7c3aed' }
    },
    'Steel': {
        primary: '#94a3b8', bg: '#0d1117', card: '#161b22', text: '#c9d1d9',
        border: '#30363d', danger: '#f85149', warn: '#d29922', success: '#3fb950',
        cTotal: '#58a6ff', cRem: '#bc8cff',
        hypnoColor: '#94a3b8', hypnoFill: 'rgba(148,163,184,0.15)',
        cardRgb: '22, 27, 34',
        activityColors: { Sleep: '#bc8cff', Work: '#d29922', Commute: '#f28c5c', Exercise: '#3fb950', Family: '#f78166', Custom: '#58a6ff' }
    }
};

const _BG_PATTERNS = { none: { image: 'none', size: 'auto' } };

const _BG_IMAGES = [
    { id: 'img0',  label: 'Starry Sky',      url: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1920&h=1080&fit=crop&auto=format&q=80', thumb: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=200&h=130&fit=crop&auto=format&q=70' },
    { id: 'img1',  label: 'Aurora',          url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1920&h=1080&fit=crop&auto=format&q=80', thumb: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=200&h=130&fit=crop&auto=format&q=70' },
    { id: 'img2',  label: 'Milky Way',       url: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1920&h=1080&fit=crop&auto=format&q=80', thumb: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=200&h=130&fit=crop&auto=format&q=70' },
    { id: 'img3',  label: 'Night Forest',    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&h=1080&fit=crop&auto=format&q=80', thumb: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=200&h=130&fit=crop&auto=format&q=70' },
    { id: 'img4',  label: 'City Lights',     url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&h=1080&fit=crop&auto=format&q=80', thumb: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=200&h=130&fit=crop&auto=format&q=70' },
    { id: 'img5',  label: 'Northern Lights', url: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1920&h=1080&fit=crop&auto=format&q=80', thumb: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=200&h=130&fit=crop&auto=format&q=70' },
    { id: 'img6',  label: 'Moonlit Coast',   url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1920&h=1080&fit=crop&auto=format&q=80', thumb: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=200&h=130&fit=crop&auto=format&q=70' },
    { id: 'img7',  label: 'Storm',           url: 'https://images.unsplash.com/photo-1469413627633-bc3e49b03c20?w=1920&h=1080&fit=crop&auto=format&q=80', thumb: 'https://images.unsplash.com/photo-1469413627633-bc3e49b03c20?w=200&h=130&fit=crop&auto=format&q=70' },
    { id: 'img8',  label: 'Stars & Mountains',url:'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=1920&h=1080&fit=crop&auto=format&q=80', thumb: 'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=200&h=130&fit=crop&auto=format&q=70' },
    { id: 'img9',  label: 'Night Peaks',     url: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=1920&h=1080&fit=crop&auto=format&q=80', thumb: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=200&h=130&fit=crop&auto=format&q=70' },
    { id: 'img10', label: 'Deep Space',      url: 'https://images.unsplash.com/photo-1516912481800-0f549f98d80f?w=1920&h=1080&fit=crop&auto=format&q=80', thumb: 'https://images.unsplash.com/photo-1516912481800-0f549f98d80f?w=200&h=130&fit=crop&auto=format&q=70' },
    { id: 'img11', label: 'Dark Road',       url: 'https://images.unsplash.com/photo-1510784722466-f2aa240478c4?w=1920&h=1080&fit=crop&auto=format&q=80', thumb: 'https://images.unsplash.com/photo-1510784722466-f2aa240478c4?w=200&h=130&fit=crop&auto=format&q=70' },
];

// 'text' picker also controls --primary (unified)
const _CC_KEYS = ['bg', 'card', 'text', 'border'];

function _setBg(image, size, position) {
    let el = document.getElementById('_bg_style');
    if (!el) { el = document.createElement('style'); el.id = '_bg_style'; document.head.appendChild(el); }
    const s = size     ? `background-size:${size}!important;`         : '';
    const p = position ? `background-position:${position}!important;` : '';
    el.textContent = `body{background-image:${image}!important;${s}${p}}`;
}

function _setThemeVars(t) {
    const r = document.documentElement;
    r.style.setProperty('--primary',  t.primary);
    r.style.setProperty('--bg',       t.bg);
    r.style.setProperty('--card',     t.card);
    r.style.setProperty('--text',     t.text);
    r.style.setProperty('--border',   t.border);
    r.style.setProperty('--danger',   t.danger);
    r.style.setProperty('--warn',     t.warn);
    r.style.setProperty('--success',  t.success);
    r.style.setProperty('--c-total',  t.cTotal);
    r.style.setProperty('--c-rem',    t.cRem);
    r.style.setProperty('--card-rgb', t.cardRgb);
}

function _updateColorPickers(t) {
    const textEl = document.getElementById('cc-text');
    if (textEl) textEl.value = t.text;
    ['bg', 'card', 'border'].forEach(k => {
        const el = document.getElementById(`cc-${k}`); if (el) el.value = t[k] || '#000000';
    });
    _ThemeUI.renderActivityColorSection();
    const fcEl = document.getElementById('font-color');
    if (fcEl && !localStorage.getItem('sleepapp_font_color')) fcEl.value = t.text;
}

const _ThemeUI = {
    applyTheme(name) {
        const t = THEMES[name];
        if (!t) return;
        History.push();
        _setThemeVars(t);
        State._theme = t;
        State.activities.forEach(a => { if (t.activityColors[a.type]) a.color = t.activityColors[a.type]; });
        _CC_KEYS.forEach(k => localStorage.removeItem(`sleepapp_cc_${k}`));
        _updateColorPickers(t);
        localStorage.setItem('sleepapp_theme', name);
        UI.sync();
    },
    applyBackground(name) {
        History.push();
        document.querySelectorAll('.theme-bg-btn, .theme-img-btn').forEach(b => b.classList.remove('active'));
        const btn = document.getElementById(`bg-btn-${name}`);
        if (btn) btn.classList.add('active');
        localStorage.setItem('sleepapp_bg', name);
        const p = _BG_PATTERNS[name];
        if (p) { _setBg(p.image, p.size); return; }
        const img = _BG_IMAGES.find(i => i.id === name);
        if (img) _setBg(`url('${img.url}')`, 'cover', 'center');
    },
    applyCustomBg(url) {
        url = (url || '').trim();
        if (!url) return;
        History.push();
        document.querySelectorAll('.theme-bg-btn, .theme-img-btn').forEach(b => b.classList.remove('active'));
        _setBg(`url('${url}')`, 'cover', 'center');
        localStorage.setItem('sleepapp_bg', 'custom:' + url);
    },
    applyCustomColor(key, value) {
        History.debouncedPush();
        const cssVar = { bg: '--bg', card: '--card', text: '--text', border: '--border' }[key];
        if (!cssVar) return;
        document.documentElement.style.setProperty(cssVar, value);
        if (key === 'text') {
            // Text and primary are unified — same colour for text and accents
            document.documentElement.style.setProperty('--primary', value);
        }
        if (key === 'card') {
            const rv = parseInt(value.slice(1,3),16), gv = parseInt(value.slice(3,5),16), bv = parseInt(value.slice(5,7),16);
            document.documentElement.style.setProperty('--card-rgb', `${rv}, ${gv}, ${bv}`);
        }
        localStorage.setItem(`sleepapp_cc_${key}`, value);
    },
    applyActivityColorByName(name, value) {
        History.debouncedPush();
        State.activities.filter(a => a.name === name).forEach(a => { a.color = value; });
        // Persist name→colour map
        const stored = JSON.parse(localStorage.getItem('sleepapp_acn') || '{}');
        stored[name] = value;
        localStorage.setItem('sleepapp_acn', JSON.stringify(stored));
        ChartEngine.render();
    },
    renderActivityColorSection() {
        const container = document.getElementById('act-color-list');
        if (!container) return;
        const seen = new Set();
        const rows = [];
        State.activities.forEach(a => {
            const name = a.name || '(unnamed)';
            if (!seen.has(name)) { seen.add(name); rows.push({ name, color: a.color }); }
        });
        container.innerHTML = rows.map(({ name, color }) =>
            `<div class="cc-row"><span>${name}</span>` +
            `<input type="color" value="${color}" class="ap-color" oninput="UI.applyActivityColorByName(${JSON.stringify(name)},this.value)"></div>`
        ).join('');
    },
    initImageButtons() {
        const row = document.getElementById('bg-img-row');
        if (!row) return;
        row.innerHTML = _BG_IMAGES.map(img =>
            `<button class="theme-img-btn" id="bg-btn-${img.id}" title="${img.label}"
                style="background-image:url('${img.thumb}')"
                onclick="UI.applyBackground('${img.id}')"></button>`
        ).join('');
    },
    loadAppearance() {
        const themeName = localStorage.getItem('sleepapp_theme')     || 'Midnight';
        const bg        = localStorage.getItem('sleepapp_bg')        || 'img0';
        const opacity   = localStorage.getItem('sleepapp_opacity')   || '0.50';
        const bright    = localStorage.getItem('sleepapp_bright')    || '1';
        const cont      = localStorage.getItem('sleepapp_contrast')  || '1';
        const fontFace  = localStorage.getItem('sleepapp_font_face') || 'system-ui, sans-serif';
        const fontSize  = localStorage.getItem('sleepapp_font_size') || '100';
        const fontColor = localStorage.getItem('sleepapp_font_color')|| '';

        const t = THEMES[themeName] || THEMES['Midnight'];
        _setThemeVars(t);
        State._theme = t;
        State.activities.forEach(a => { if (t.activityColors[a.type]) a.color = t.activityColors[a.type]; });
        _updateColorPickers(t);

        // Re-apply custom colour overrides (theme-level)
        _CC_KEYS.forEach(key => {
            const val = localStorage.getItem(`sleepapp_cc_${key}`);
            if (!val) return;
            document.documentElement.style.setProperty(`--${key}`, val);
            if (key === 'text') document.documentElement.style.setProperty('--primary', val);
            if (key === 'card') {
                const rv = parseInt(val.slice(1,3),16), gv = parseInt(val.slice(3,5),16), bv = parseInt(val.slice(5,7),16);
                document.documentElement.style.setProperty('--card-rgb', `${rv}, ${gv}, ${bv}`);
            }
            const el = document.getElementById(`cc-${key}`); if (el) el.value = val;
        });

        // Re-apply per-activity colour overrides (by name)
        const acn = JSON.parse(localStorage.getItem('sleepapp_acn') || '{}');
        Object.entries(acn).forEach(([name, color]) => {
            State.activities.filter(a => a.name === name).forEach(a => { a.color = color; });
        });

        // Background
        if (bg.startsWith('custom:')) _ThemeUI.applyCustomBg(bg.slice(7));
        else _ThemeUI.applyBackground(bg);

        // Sliders
        const opEl = document.getElementById('sl-opacity'), brEl = document.getElementById('sl-bright'), coEl = document.getElementById('sl-contrast');
        if (opEl) opEl.value = opacity;
        if (brEl) brEl.value = bright;
        if (coEl) coEl.value = cont;
        _ThemeUI.setCardOpacity(opacity);
        _ThemeUI.setFilter();

        // Font
        const ffEl = document.getElementById('font-face'), fsEl = document.getElementById('font-size-sl'), fcEl = document.getElementById('font-color'), flbl = document.getElementById('font-size-lbl');
        if (ffEl) ffEl.value = fontFace;
        if (fsEl) fsEl.value = fontSize;
        if (fcEl) fcEl.value = fontColor || t.text;
        if (flbl) flbl.textContent = fontSize + '%';
        const r = document.documentElement;
        r.style.setProperty('--font-family', fontFace);
        r.style.setProperty('--font-scale', (parseFloat(fontSize) / 100).toFixed(2));
        if (fontColor) r.style.setProperty('--font-color', fontColor);

        // Plan name
        const nameEl = document.getElementById('plan-name');
        if (nameEl) nameEl.value = localStorage.getItem('sleepapp_name') || '';

        // Intro-on-reload checkbox
        const introChk = document.getElementById('intro-on-reload');
        if (introChk) introChk.checked = !!localStorage.getItem('sleepapp_show_on_reload');
    },
    setCardOpacity(val) {
        History.debouncedPush();
        document.documentElement.style.setProperty('--card-opacity', parseFloat(val).toFixed(2));
        localStorage.setItem('sleepapp_opacity', parseFloat(val).toFixed(2));
    },
    setFilter() {
        History.debouncedPush();
        const b = parseFloat(document.getElementById('sl-bright')?.value   || 1);
        const c = parseFloat(document.getElementById('sl-contrast')?.value || 1);
        const mc = document.getElementById('main-content');
        if (mc) mc.style.filter = (b === 1 && c === 1) ? '' : `brightness(${b}) contrast(${c})`;
        localStorage.setItem('sleepapp_bright',   b.toString());
        localStorage.setItem('sleepapp_contrast', c.toString());
    },
    setFont() {
        History.debouncedPush();
        const face  = document.getElementById('font-face')?.value    || 'system-ui, sans-serif';
        const size  = document.getElementById('font-size-sl')?.value || '100';
        const color = document.getElementById('font-color')?.value   || '';
        const lbl   = document.getElementById('font-size-lbl');
        if (lbl) lbl.textContent = size + '%';
        const r = document.documentElement;
        r.style.setProperty('--font-family', face);
        r.style.setProperty('--font-scale', (parseFloat(size) / 100).toFixed(2));
        if (color) r.style.setProperty('--font-color', color);
        else r.style.removeProperty('--font-color');
        localStorage.setItem('sleepapp_font_face',  face);
        localStorage.setItem('sleepapp_font_size',  size);
        localStorage.setItem('sleepapp_font_color', color);
    },
    resetFontColor() {
        document.documentElement.style.removeProperty('--font-color');
        localStorage.removeItem('sleepapp_font_color');
        const t = State._theme || THEMES['Midnight'];
        const el = document.getElementById('font-color');
        if (el) el.value = t.text;
    },
    toggleAppearanceMenu(e) {
        e.stopPropagation();
        PersistMenu.close();
        UI.closeExportMenu();
        const m = document.getElementById('appearance-menu');
        if (m.style.display === 'block') { m.style.display = 'none'; return; }
        m.style.display = 'block';
        const rect = e.currentTarget.getBoundingClientRect();
        const mW = m.offsetWidth, mH = m.offsetHeight;
        let left = rect.left, top = rect.bottom + 6;
        if (left + mW > window.innerWidth  - 8) left = window.innerWidth  - mW - 8;
        if (top  + mH > window.innerHeight - 8) top  = rect.top - mH - 6;
        m.style.left = Math.max(4, left) + 'px';
        m.style.right = 'auto';
        m.style.top  = Math.max(4, top)  + 'px';
    },
    closeAppearanceMenu() { const m = document.getElementById('appearance-menu'); if (m) m.style.display = 'none'; },
    // Aliases kept for backward compatibility
    toggleThemeMenu(e) { _ThemeUI.toggleAppearanceMenu(e); },
    closeThemeMenu()   { _ThemeUI.closeAppearanceMenu(); },
    toggleExportMenu(e) {
        e.stopPropagation();
        UI.closeThemeMenu(); UI.closeAppearanceMenu();
        PersistMenu.close();
        const m = document.getElementById('export-menu');
        if (m.style.display === 'block') { m.style.display = 'none'; return; }
        m.style.display = 'block';
        const rect = e.currentTarget.getBoundingClientRect();
        const mW = m.offsetWidth, mH = m.offsetHeight;
        let left = rect.right - mW, top = rect.bottom + 6;
        if (top + mH > window.innerHeight - 8) top = rect.top - mH - 6;
        m.style.left = Math.max(4, left) + 'px';
        m.style.top  = Math.max(4, top)  + 'px';
    },
    closeExportMenu() { const m = document.getElementById('export-menu'); if (m) m.style.display = 'none'; },
    switchTab(name) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + name));
        if (name === 'graph') requestAnimationFrame(() => ChartEngine.refreshZoom());
    },
};
