function refreshZoom() {
    const ctrl = document.getElementById('zoom-ctrl');
    const maxZ = State.totalDays + 0.5;
    let val = Math.min(parseFloat(ctrl.value) || 1.0, maxZ);
    ctrl.value = val;
    const visibleDays = Math.max(0.5, State.totalDays - (val - 1));
    const sizer = document.getElementById('canvas-sizer');
    const box   = document.getElementById('scroll-engine');
    const pivotRatio = (box.scrollLeft + box.clientWidth / 2) / sizer.clientWidth;
    sizer.style.width = (State.totalDays / visibleDays * 100) + '%';
    box.scrollLeft = (pivotRatio * sizer.clientWidth) - box.clientWidth / 2;
    document.getElementById('zoom-hint').innerText = `(${Number.isInteger(visibleDays) ? visibleDays : visibleDays.toFixed(1)} days)`;
    ChartEngine.render();
}
