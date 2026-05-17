if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
}

ChartEngine.init();
UI.sync();
UI.initImageButtons();
UI.loadAppearance();
History.init();
ChartEngine.refreshZoom();
Wizard.show();

// Intro-on-reload checkbox
document.getElementById('intro-on-reload')?.addEventListener('change', e => {
    if (e.target.checked) {
        localStorage.removeItem('sleepapp_wizard_done');
        localStorage.setItem('sleepapp_show_on_reload', '1');
    } else {
        localStorage.removeItem('sleepapp_show_on_reload');
        localStorage.setItem('sleepapp_wizard_done', '1');
    }
});

// Plan name persistence
const _nameEl = document.getElementById('plan-name');
if (_nameEl) _nameEl.addEventListener('input', () => localStorage.setItem('sleepapp_name', _nameEl.value));

document.addEventListener('click', () => {
    if (_skipPickerClose) { _skipPickerClose = false; return; }
    document.getElementById('num-picker').style.display = 'none';
    document.getElementById('persist-menu').style.display = 'none';
    UI.closeOtherMenu();
    UI.closeAppearanceMenu();
    UI.closeExportMenu();
    Calendar.close();
});

document.addEventListener('keydown', e => {
    const inText = (e.target.tagName === 'INPUT' && e.target.type === 'text') ||
                   e.target.tagName === 'TEXTAREA' || e.target.isContentEditable;
    if (inText) return;
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') { e.preventDefault(); History.undo(); }
    if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) { e.preventDefault(); History.redo(); }
});

document.getElementById('scroll-engine').addEventListener('wheel', e => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { e.preventDefault(); e.currentTarget.scrollLeft += e.deltaX; }
}, { passive: false });

