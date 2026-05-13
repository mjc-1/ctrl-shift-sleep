const _ExportActions = {

    // ── Helpers ──────────────────────────────────────────────────────────────

    _opts() {
        return {
            printerFriendly: !!document.getElementById('ex-printer-friendly')?.checked,
            withBg:          !!document.getElementById('ex-withbg')?.checked,
        };
    },

    _scale() {
        return parseFloat(document.getElementById('ex-scale')?.value || 1);
    },

    _filename(suffix) {
        return (localStorage.getItem('sleepapp_name') || 'sleep-plan') + suffix;
    },

    _download(href, filename) {
        const a = document.createElement('a');
        a.download = filename; a.href = href; a.click();
    },

    _toBlob(content, mimeType, filename) {
        const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
        this._download(url, filename);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    },

    _toXLSX(rows, sheetName, filename) {
        if (typeof XLSX === 'undefined') { alert('XLSX library not available — check your connection.'); return; }
        const ws = XLSX.utils.aoa_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, filename);
    },

    _toCSVStr(rows) {
        return rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    },

    // ── Canvas export (Graph JPG / PNG) ──────────────────────────────────────

    _saveCanvas(srcCanvas, format, filename, opts) {
        const scale = this._scale();
        const isJpg = format === 'jpg';
        const out   = document.createElement('canvas');
        out.width   = srcCanvas.width  * scale;
        out.height  = srcCanvas.height * scale;
        const ctx   = out.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        if (isJpg) {
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#0f172a';
            ctx.fillRect(0, 0, out.width, out.height);
        }
        if (opts.printerFriendly) ctx.filter = 'grayscale(1) contrast(1.5)';
        ctx.drawImage(srcCanvas, 0, 0, out.width, out.height);
        this._download(out.toDataURL(isJpg ? 'image/jpeg' : 'image/png', 0.95), filename);
    },

    // ── Full-page capture (html2canvas) ──────────────────────────────────────

    _captureFullPage(format, opts) {
        if (typeof html2canvas === 'undefined') {
            alert('html2canvas not loaded — check your internet connection.');
            return;
        }
        const self = this;
        (async () => {
            const mc = document.getElementById('main-content');

            // Temporarily expand all scroll-constrained containers so nothing is cropped
            const scrollEls = document.querySelectorAll('#scroll-engine, .col-content');
            const saved = Array.from(scrollEls).map(el => ({
                el, overflow: el.style.overflow, maxH: el.style.maxHeight,
            }));
            scrollEls.forEach(el => { el.style.overflow = 'visible'; el.style.maxHeight = 'none'; });

            // Background image
            const bgEl = document.getElementById('_bg_style');
            let bgSaved   = null;
            let mcBgSaved = null;
            if (!opts.withBg && bgEl) {
                bgSaved = bgEl.textContent; bgEl.textContent = '';
            } else if (opts.withBg && mc) {
                // Apply the body background to mc so html2canvas captures it
                const bodyStyle = window.getComputedStyle(document.body);
                const bgImg = bodyStyle.backgroundImage;
                if (bgImg && bgImg !== 'none') {
                    mcBgSaved = {
                        image:    mc.style.backgroundImage    || '',
                        size:     mc.style.backgroundSize     || '',
                        position: mc.style.backgroundPosition || '',
                    };
                    mc.style.backgroundImage    = bgImg;
                    mc.style.backgroundSize     = bodyStyle.backgroundSize;
                    mc.style.backgroundPosition = bodyStyle.backgroundPosition;
                }
            }

            // Printer friendly
            const prevFilter = mc?.style.filter || '';
            if (opts.printerFriendly && mc) mc.style.filter = `${prevFilter} grayscale(1) contrast(1.5)`.trim();

            const canvas = await html2canvas(mc || document.body, {
                useCORS:     true,
                allowTaint:  true,
                width:       (mc || document.body).scrollWidth,
                height:      (mc || document.body).scrollHeight,
                windowWidth: document.documentElement.scrollWidth,
                backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#0f172a',
                scale:       self._scale(),
            });

            // Restore
            saved.forEach(({ el, overflow, maxH }) => { el.style.overflow = overflow; el.style.maxHeight = maxH; });
            if (bgSaved !== null && bgEl) bgEl.textContent = bgSaved;
            if (mcBgSaved !== null && mc) {
                mc.style.backgroundImage    = mcBgSaved.image;
                mc.style.backgroundSize     = mcBgSaved.size;
                mc.style.backgroundPosition = mcBgSaved.position;
            }
            if (mc) mc.style.filter = prevFilter;

            const isJpg = format === 'jpg';
            self._download(canvas.toDataURL(isJpg ? 'image/jpeg' : 'image/png', 0.95), self._filename('.' + format));
        })().catch(err => console.error('Full-page capture failed:', err));
    },

    // ── Section capture (Activities / Analytics JPG) ─────────────────────────

    _captureSection(colId, format, filename, opts) {
        if (typeof html2canvas === 'undefined') {
            alert('html2canvas not loaded — check your internet connection.');
            return;
        }
        const self = this;
        (async () => {
            const el = document.getElementById(colId);
            if (!el) return;

            const scrollEls = el.querySelectorAll('.col-content');
            const saved = Array.from(scrollEls).map(e => ({
                e, overflow: e.style.overflow, maxH: e.style.maxHeight,
            }));
            scrollEls.forEach(e => { e.style.overflow = 'visible'; e.style.maxHeight = 'none'; });

            let elBgSaved = null;
            if (opts.withBg) {
                const bodyStyle = window.getComputedStyle(document.body);
                const bgImg = bodyStyle.backgroundImage;
                if (bgImg && bgImg !== 'none') {
                    elBgSaved = {
                        image:    el.style.backgroundImage    || '',
                        size:     el.style.backgroundSize     || '',
                        position: el.style.backgroundPosition || '',
                    };
                    el.style.backgroundImage    = bgImg;
                    el.style.backgroundSize     = bodyStyle.backgroundSize;
                    el.style.backgroundPosition = bodyStyle.backgroundPosition;
                }
            }

            const prevFilter = el.style.filter || '';
            if (opts.printerFriendly) el.style.filter = `${prevFilter} grayscale(1) contrast(1.5)`.trim();

            const canvas = await html2canvas(el, {
                useCORS:         true,
                allowTaint:      true,
                width:           el.scrollWidth,
                height:          el.scrollHeight,
                backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#0f172a',
                scale:           self._scale(),
            });

            saved.forEach(({ e, overflow, maxH }) => { e.style.overflow = overflow; e.style.maxHeight = maxH; });
            if (elBgSaved !== null) {
                el.style.backgroundImage    = elBgSaved.image;
                el.style.backgroundSize     = elBgSaved.size;
                el.style.backgroundPosition = elBgSaved.position;
            }
            el.style.filter = prevFilter;

            const isJpg = format === 'jpg';
            self._download(canvas.toDataURL(isJpg ? 'image/jpeg' : 'image/png', 0.95), filename);
        })().catch(err => console.error('Section capture failed:', err));
    },

    // ── Print helpers (section-specific PDF) ─────────────────────────────────

    _printSection(bodyClass) {
        const prev = document.title;
        document.title = localStorage.getItem('sleepapp_name') || 'Sleep Plan';
        const opts = this._opts();

        const bgEl = document.getElementById('_bg_style');
        let bgSaved = null;
        if (!opts.withBg && bgEl) { bgSaved = bgEl.textContent; bgEl.textContent = ''; }
        if (opts.printerFriendly) document.body.classList.add('ex-printer-friendly');
        document.body.classList.add(bodyClass);

        window.print();

        document.body.classList.remove(bodyClass);
        if (opts.printerFriendly) document.body.classList.remove('ex-printer-friendly');
        if (bgSaved !== null && bgEl) bgEl.textContent = bgSaved;
        document.title = prev;
    },

    // ── Data generators ──────────────────────────────────────────────────────

    _activityRows() {
        const header = ['Name','Type','From','To','Every (days)','Starting','Ending','Forever','Length (h)','Span (days)'];
        const rows = State.activities.map(act => {
            const startDt = luxon.DateTime.fromISO(act.start);
            const endDate = act.forever ? '(forever)' : startDt.plus({days: act.dur}).toISODate();
            const fromMins = Utils.timeToMins(act.from), toMins = Utils.timeToMins(act.to);
            let dur = toMins - fromMins; if (dur <= 0) dur += 1440;
            return [act.name, act.type, act.from, act.to, act.freq, act.start, endDate,
                    act.forever ? 'Yes' : 'No', parseFloat((dur/60).toFixed(2)), act.forever ? '∞' : act.dur];
        });
        return [header, ...rows];
    },

    _activitiesTxt() {
        const lines = ['Activities', '─'.repeat(48)];
        State.activities.forEach(act => {
            const startDt = luxon.DateTime.fromISO(act.start);
            const endDate = act.forever ? 'ongoing' : startDt.plus({days: act.dur}).toISODate();
            const fromMins = Utils.timeToMins(act.from), toMins = Utils.timeToMins(act.to);
            let dur = toMins - fromMins; if (dur <= 0) dur += 1440;
            lines.push(`• ${act.name}: ${act.from}–${act.to} (${Math.floor(dur/60)}h ${dur%60}m), every ${act.freq} day(s), ${act.start} → ${endDate}`);
        });
        return lines.join('\n');
    },

    _analyticsRows() {
        const t = State.targets;
        let totalSecs = 0;
        const end = State.viewStart.plus({days: State.totalDays});
        State.activities.filter(a => a.type === 'Sleep').forEach(act => {
            let pS = luxon.DateTime.fromISO(act.start);
            const limit = act.forever ? State.totalDays + 30 : act.dur;
            for (let d = 0; d < limit; d += act.freq) {
                const t0 = pS.plus({days:d, hours:+act.from.split(':')[0], minutes:+act.from.split(':')[1]});
                let   t1 = pS.plus({days:d, hours:+act.to.split(':')[0],   minutes:+act.to.split(':')[1]});
                if (t1 < t0) t1 = t1.plus({days:1});
                const eff = t0.plus({minutes: State.onsetH * 60 + State.onsetM});
                const inter = Math.min(t1.toMillis(), end.toMillis()) - Math.max(eff.toMillis(), State.viewStart.toMillis());
                if (inter > 0) totalSecs += inter / 1000;
            }
        });
        const actuals = { total: totalSecs, rem: totalSecs * 0.2 };
        const tgt = {
            total: (t.totalH * 3600 + t.totalM * 60) / t.perVal * State.totalDays,
            rem:   (t.remH   * 3600 + t.remM   * 60) / t.perVal * State.totalDays,
        };
        const debts = { total: tgt.total - actuals.total, rem: tgt.rem - actuals.rem };
        const s2hm = s => { const sign = s < 0 ? '-' : ''; const a = Math.abs(s); return `${sign}${Math.floor(a/3600)}h ${Math.floor((a%3600)/60)}m`; };
        return [
            ['Metric', `Target (${State.totalDays} days)`, 'Actual (expected)', 'Debt (expected)'],
            ['Total sleep', s2hm(tgt.total),   s2hm(actuals.total), s2hm(debts.total)],
            ['REM sleep',   s2hm(tgt.rem),     s2hm(actuals.rem),   s2hm(debts.rem)],
        ];
    },

    _analyticsTxt() {
        const rows = this._analyticsRows();
        return ['Analytics', '─'.repeat(48), ...rows.map(r => r.join('\t'))].join('\n');
    },

    _graphRows() {
        const header = ['Activity', 'Type', 'Date', 'From', 'To', 'Duration (h)'];
        const rows = [];
        const end = State.viewStart.plus({days: State.totalDays});
        State.activities.forEach(act => {
            let pS = luxon.DateTime.fromISO(act.start);
            const limit = act.forever ? State.totalDays + 30 : act.dur;
            for (let d = 0; d < limit; d += act.freq) {
                const day = pS.plus({days: d});
                if (day >= end) break;
                const t0 = day.set({hour:+act.from.split(':')[0], minute:+act.from.split(':')[1], second:0});
                let   t1 = day.set({hour:+act.to.split(':')[0],   minute:+act.to.split(':')[1],   second:0});
                if (t1 <= t0) t1 = t1.plus({days:1});
                rows.push([act.name, act.type, day.toISODate(), act.from, act.to,
                           t1.diff(t0, 'hours').hours.toFixed(2)]);
            }
        });
        return [header, ...rows];
    },

    // ── Main dispatch ─────────────────────────────────────────────────────────

    exportFile(target, format) {
        const opts  = this._opts();
        const name  = this._filename('');
        const chart = document.getElementById('sleepChart');

        switch (`${target}:${format}`) {
            // Graph
            case 'graph:pdf':  this._printSection('print-graph'); break;
            case 'graph:jpg':  this._saveCanvas(chart, 'jpg', name + '.jpg', opts); break;
            case 'graph:png':  this._saveCanvas(chart, 'png', name + '.png', opts); break;
            case 'graph:csv':  this._toBlob(this._toCSVStr(this._graphRows()), 'text/csv', name + '_graph.csv'); break;
            case 'graph:xlsx': this._toXLSX(this._graphRows(), 'Graph', name + '_graph.xlsx'); break;

            // Activities
            case 'activities:pdf':  this._printSection('print-activities'); break;
            case 'activities:jpg':  this._captureSection('col-activities', 'jpg', name + '_activities.jpg', opts); break;
            case 'activities:txt':  this._toBlob(this._activitiesTxt(), 'text/plain', name + '_activities.txt'); break;
            case 'activities:csv':  this._toBlob(this._toCSVStr(this._activityRows()), 'text/csv', name + '.csv'); break;
            case 'activities:xlsx': this._toXLSX(this._activityRows(), 'Activities', name + '.xlsx'); break;

            // Analytics
            case 'analytics:pdf':  this._printSection('print-analytics'); break;
            case 'analytics:jpg':  this._captureSection('col-analytics', 'jpg', name + '_analytics.jpg', opts); break;
            case 'analytics:txt':  this._toBlob(this._analyticsTxt(), 'text/plain', name + '_analytics.txt'); break;
            case 'analytics:csv':  this._toBlob(this._toCSVStr(this._analyticsRows()), 'text/csv', name + '_analytics.csv'); break;
            case 'analytics:xlsx': this._toXLSX(this._analyticsRows(), 'Analytics', name + '_analytics.xlsx'); break;

            // Whole page
            case 'page:pdf': this._printSection('print-page'); break;
            case 'page:jpg': this._captureFullPage('jpg', opts); break;
        }
    },

    // Back-compat aliases
    exportPNG()  { this.exportFile('graph', 'png'); },
    exportJPG()  { this.exportFile('graph', 'jpg'); },
    exportPDF()  { this.exportFile('page',  'pdf'); },
    exportCSV()  { this.exportFile('activities', 'csv'); },
    exportXLSX() { this.exportFile('activities', 'xlsx'); },
};
