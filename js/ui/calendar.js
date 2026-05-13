const Calendar = (() => {
    let _actId = null, _field = null, _viewDate = null, _selected = null;
    let _mode = 'days', _decadeStart = 2020;

    function open(actId, field, isoDate, anchorEl) {
        _actId       = actId;
        _field       = field;
        _selected    = luxon.DateTime.fromISO(isoDate);
        _viewDate    = _selected.startOf('month');
        _decadeStart = Math.floor(_selected.year / 12) * 12;
        _mode        = 'days';
        const el     = document.getElementById('cal-picker');
        _render(el);
        el.style.display = 'block';
        const rect = anchorEl.getBoundingClientRect();
        const elW  = el.offsetWidth, elH = el.offsetHeight;
        let left = rect.left;
        let top  = rect.bottom + 4;
        if (left + elW > window.innerWidth  - 8) left = window.innerWidth  - elW - 8;
        if (top  + elH > window.innerHeight - 8) top  = rect.top - elH - 4;
        el.style.left = Math.max(4, left) + 'px';
        el.style.top  = Math.max(4, top)  + 'px';
    }

    function _render(el) {
        if (_mode === 'months') { _renderMonths(el); return; }
        if (_mode === 'years')  { _renderYears(el);  return; }
        _renderDays(el);
    }

    function _renderDays(el) {
        const firstDay = _viewDate.startOf('month');
        const lastDay  = _viewDate.endOf('month');
        const startDow = firstDay.weekday % 7;

        let cells = '';
        for (let i = 0; i < startDow; i++) cells += `<div class="cal-day cal-empty"></div>`;
        for (let d = 1; d <= lastDay.day; d++) {
            const iso   = _viewDate.set({ day: d }).toISODate();
            const isSel = iso === _selected.toISODate();
            cells += `<div class="cal-day${isSel ? ' cal-sel' : ''}" onclick="Calendar.pick('${iso}')">${d}</div>`;
        }

        el.innerHTML = `
            <div class="cal-nav">
                <button class="cal-nav-btn" onclick="Calendar.shiftYear(-1)" title="Prev year">«</button>
                <button class="cal-nav-btn" onclick="Calendar.shiftMonth(-1)" title="Prev month">‹</button>
                <div class="cal-hdr-btns">
                    <button class="cal-hdr-btn" onclick="Calendar.setMode('months')">${_viewDate.toFormat('MMM')}</button>
                    <button class="cal-hdr-btn" onclick="Calendar.setMode('years')">${_viewDate.year}</button>
                </div>
                <button class="cal-nav-btn" onclick="Calendar.shiftMonth(1)" title="Next month">›</button>
                <button class="cal-nav-btn" onclick="Calendar.shiftYear(1)" title="Next year">»</button>
            </div>
            <div class="cal-dow"><div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div></div>
            <div class="cal-grid">${cells}</div>`;
    }

    function _renderMonths(el) {
        const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const cells = names.map((m, i) => {
            const isSel = (i + 1) === _viewDate.month;
            return `<div class="cal-pick-cell${isSel ? ' cal-sel' : ''}" onclick="Calendar.pickMonth(${i + 1})">${m}</div>`;
        }).join('');

        el.innerHTML = `
            <div class="cal-nav">
                <button class="cal-nav-btn" onclick="Calendar.shiftYear(-1)">‹</button>
                <button class="cal-hdr-btn cal-hdr-btn-wide" onclick="Calendar.setMode('years')">${_viewDate.year}</button>
                <button class="cal-nav-btn" onclick="Calendar.shiftYear(1)">›</button>
            </div>
            <div class="cal-pick-grid">${cells}</div>`;
    }

    function _renderYears(el) {
        let cells = '';
        for (let y = _decadeStart; y < _decadeStart + 12; y++) {
            const isSel = y === _viewDate.year;
            cells += `<div class="cal-pick-cell${isSel ? ' cal-sel' : ''}" onclick="Calendar.pickYear(${y})">${y}</div>`;
        }

        el.innerHTML = `
            <div class="cal-nav">
                <button class="cal-nav-btn" onclick="Calendar.shiftDecade(-1)">‹</button>
                <span class="cal-month-lbl">${_decadeStart}–${_decadeStart + 11}</span>
                <button class="cal-nav-btn" onclick="Calendar.shiftDecade(1)">›</button>
            </div>
            <div class="cal-pick-grid">${cells}</div>`;
    }

    function pick(iso) {
        if (_field === 'start') Actions.updateAct(_actId, 'start', iso);
        else                    Actions.setEnding(_actId, iso);
        close();
    }

    function pickMonth(m) {
        _viewDate = _viewDate.set({ month: m });
        _mode = 'days';
        _render(document.getElementById('cal-picker'));
    }

    function pickYear(y) {
        _viewDate = _viewDate.set({ year: y });
        _mode = 'months';
        _render(document.getElementById('cal-picker'));
    }

    function setMode(mode) {
        if (mode === 'years') _decadeStart = Math.floor(_viewDate.year / 12) * 12;
        _mode = mode;
        _render(document.getElementById('cal-picker'));
    }

    function shiftMonth(d)  { _viewDate = _viewDate.plus({ months: d }); _render(document.getElementById('cal-picker')); }
    function shiftYear(d)   { _viewDate = _viewDate.plus({ years: d });  _render(document.getElementById('cal-picker')); }
    function shiftDecade(d) { _decadeStart += d * 12; _render(document.getElementById('cal-picker')); }
    function close()        { const el = document.getElementById('cal-picker'); if (el) el.style.display = 'none'; }

    return { open, pick, pickMonth, pickYear, setMode, shiftMonth, shiftYear, shiftDecade, close };
})();
