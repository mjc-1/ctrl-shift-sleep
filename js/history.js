const _H_CC_KEYS = ['bg', 'card', 'text', 'border'];

const History = (() => {
    const _undo = [], _redo = [];
    const MAX = 50;
    let _initialized = false, _debounceTimer = null;

    function _snapshot() {
        return {
            activities:   JSON.parse(JSON.stringify(State.activities)),
            totalDays:    State.totalDays,
            onsetH:       State.onsetH,
            onsetM:       State.onsetM,
            targets:      JSON.parse(JSON.stringify(State.targets)),
            name:         localStorage.getItem('sleepapp_name')        || '',
            theme:        localStorage.getItem('sleepapp_theme')       || 'Midnight',
            bg:           localStorage.getItem('sleepapp_bg')          || 'img0',
            opacity:      localStorage.getItem('sleepapp_opacity')     || '0.50',
            bright:       localStorage.getItem('sleepapp_bright')      || '1',
            contrast:     localStorage.getItem('sleepapp_contrast')    || '1',
            fontFace:     localStorage.getItem('sleepapp_font_face')   || 'system-ui, sans-serif',
            fontSize:     localStorage.getItem('sleepapp_font_size')   || '100',
            fontColor:    localStorage.getItem('sleepapp_font_color')  || '',
            customColors: Object.fromEntries(_H_CC_KEYS.map(k => [k, localStorage.getItem(`sleepapp_cc_${k}`)])),
            activityColorMap: localStorage.getItem('sleepapp_acn') || '{}',
        };
    }

    function _restore(snap) {
        // Save per-activity colours before applyTheme resets them
        const savedColors = snap.activities.map(a => ({ id: a.id, color: a.color }));

        Object.assign(State, {
            activities: snap.activities,
            totalDays:  snap.totalDays,
            onsetH:     snap.onsetH,
            onsetM:     snap.onsetM,
            targets:    snap.targets,
        });

        const nameEl = document.getElementById('plan-name');
        if (nameEl) { nameEl.value = snap.name; localStorage.setItem('sleepapp_name', snap.name); }

        UI.applyTheme(snap.theme);

        // Re-apply per-activity colours (applyTheme reset them to theme defaults)
        savedColors.forEach(({ id, color }) => {
            const a = State.activities.find(x => x.id === id);
            if (a) a.color = color;
        });
        // Restore the name→colour map in localStorage
        localStorage.setItem('sleepapp_acn', snap.activityColorMap || '{}');

        if (snap.bg.startsWith('custom:')) UI.applyCustomBg(snap.bg.slice(7));
        else UI.applyBackground(snap.bg);

        // Re-apply snapshotted custom colour overrides (theme-level)
        const r = document.documentElement;
        Object.entries(snap.customColors || {}).forEach(([k, v]) => {
            if (!v) { localStorage.removeItem(`sleepapp_cc_${k}`); return; }
            r.style.setProperty(`--${k}`, v);
            if (k === 'text') r.style.setProperty('--primary', v);
            if (k === 'card') {
                const rv = parseInt(v.slice(1,3),16), gv = parseInt(v.slice(3,5),16), bv = parseInt(v.slice(5,7),16);
                r.style.setProperty('--card-rgb', `${rv}, ${gv}, ${bv}`);
            }
            localStorage.setItem(`sleepapp_cc_${k}`, v);
            const el = document.getElementById(`cc-${k}`); if (el) el.value = v;
        });

        const opEl = document.getElementById('sl-opacity');
        const brEl = document.getElementById('sl-bright');
        const coEl = document.getElementById('sl-contrast');
        if (opEl) opEl.value = snap.opacity;
        if (brEl) brEl.value = snap.bright;
        if (coEl) coEl.value = snap.contrast;
        UI.setCardOpacity(snap.opacity);
        UI.setFilter();

        const ffEl = document.getElementById('font-face');
        const fsEl = document.getElementById('font-size-sl');
        const fcEl = document.getElementById('font-color');
        const flbl = document.getElementById('font-size-lbl');
        if (ffEl) ffEl.value = snap.fontFace;
        if (fsEl) fsEl.value = snap.fontSize;
        if (fcEl) fcEl.value = snap.fontColor || '#f8fafc';
        if (flbl) flbl.textContent = snap.fontSize + '%';
        UI.setFont();

        UI.sync();
    }

    function push() {
        if (!_initialized) return;
        if (_debounceTimer) { clearTimeout(_debounceTimer); _debounceTimer = null; }
        _undo.push(_snapshot());
        if (_undo.length > MAX) _undo.shift();
        _redo.length = 0;
    }

    function debouncedPush() {
        if (!_initialized) return;
        if (_debounceTimer) { clearTimeout(_debounceTimer); _debounceTimer = setTimeout(() => { _debounceTimer = null; }, 800); return; }
        _undo.push(_snapshot());
        if (_undo.length > MAX) _undo.shift();
        _redo.length = 0;
        _debounceTimer = setTimeout(() => { _debounceTimer = null; }, 800);
    }

    function undo() {
        if (!_initialized || !_undo.length) return;
        _initialized = false;
        _redo.push(_snapshot());
        _restore(_undo.pop());
        _initialized = true;
    }

    function redo() {
        if (!_initialized || !_redo.length) return;
        _initialized = false;
        _undo.push(_snapshot());
        _restore(_redo.pop());
        _initialized = true;
    }

    function init() { _initialized = true; }

    return { push, debouncedPush, undo, redo, init };
})();
