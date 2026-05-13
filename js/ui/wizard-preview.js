const WizardPreview = {
    _WORK_COLOR:  '#fbbf24',
    _SLEEP_COLOR: '#818cf8',

    draw(canvas, data) {
        const dpr = window.devicePixelRatio || 1;
        const W   = canvas.offsetWidth;
        const H   = canvas.offsetHeight;
        if (!W || !H) return;

        canvas.width  = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, W, H);

        const PL = 6, PR = 6, PT = 6, PB = 18;
        const cW = W - PL - PR;
        const cH = H - PT - PB;

        const days = this._buildDays(data);

        if (!days.length) {
            ctx.fillStyle = 'rgba(255,255,255,0.18)';
            ctx.font = '11px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Your schedule will appear here as you fill in each step', W / 2, H / 2);
            return;
        }

        const N    = days.length;
        const dayW = cW / N;
        const hoursKnown = this._hoursKnown(data);
        const sleep      = this._buildSleep(data);

        const WORK_BAR_H  = Math.floor(cH * 0.34);
        const SLEEP_BAR_H = Math.floor(cH * 0.34);
        const WORK_Y      = PT + Math.floor(cH * 0.07);
        const SLEEP_Y     = PT + Math.floor(cH * 0.54);

        // Chart area
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        ctx.fillRect(PL, PT, cW, cH);

        // Day dividers
        ctx.strokeStyle = 'rgba(255,255,255,0.10)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= N; i++) {
            const x = PL + i * dayW;
            ctx.beginPath(); ctx.moveTo(x, PT); ctx.lineTo(x, PT + cH); ctx.stroke();
        }

        // Hour sub-ticks
        if (hoursKnown && dayW >= 18) {
            ctx.strokeStyle = 'rgba(255,255,255,0.06)';
            ctx.lineWidth = 0.5;
            const ticks = dayW >= 36 ? [6, 12, 18] : [12];
            for (let i = 0; i < N; i++) {
                const colX = PL + i * dayW;
                ticks.forEach(h => {
                    const tx = colX + (h / 24) * dayW;
                    ctx.beginPath(); ctx.moveTo(tx, PT); ctx.lineTo(tx, PT + cH); ctx.stroke();
                });
            }
        }

        // Day labels
        const fontSize = Math.max(8, Math.min(10, Math.floor(dayW * 0.38)));
        ctx.font = `${fontSize}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = 'rgba(255,255,255,0.40)';
        days.forEach((day, i) => {
            const skip = N > 10 && i % Math.ceil(N / 7) !== 0;
            if (!skip) ctx.fillText(day.label, PL + (i + 0.5) * dayW, PT + cH + 13);
        });

        // Work bars
        ctx.globalAlpha = 0.82;
        days.forEach((day, i) => {
            if (!day.isWork) return;
            const colX = PL + i * dayW;
            let barX, barW;
            if (hoursKnown && day.workFrom !== null && day.workTo !== null) {
                const f = day.workFrom / 1440;
                const dur = day.workTo >= day.workFrom
                    ? day.workTo - day.workFrom
                    : day.workTo + 1440 - day.workFrom;
                barX = colX + f * dayW;
                barW = Math.max(2, (dur / 1440) * dayW);
            } else {
                barX = colX + 1; barW = dayW - 2;
            }
            ctx.fillStyle = this._WORK_COLOR;
            this._bar(ctx, barX, WORK_Y, barW, WORK_BAR_H);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // Sleep bars
        if (sleep) {
            ctx.globalAlpha = 0.72;
            ctx.fillStyle = this._SLEEP_COLOR;
            const { from, to } = sleep;
            days.forEach((_, i) => {
                const colX = PL + i * dayW;
                if (to > from) {
                    const bx = colX + (from / 1440) * dayW;
                    const bw = Math.max(2, ((to - from) / 1440) * dayW);
                    this._bar(ctx, bx, SLEEP_Y, bw, SLEEP_BAR_H); ctx.fill();
                } else {
                    // crosses midnight — evening part
                    const ew = Math.max(1, ((1440 - from) / 1440) * dayW);
                    this._bar(ctx, colX + (from / 1440) * dayW, SLEEP_Y, ew, SLEEP_BAR_H); ctx.fill();
                    // morning part
                    const mw = Math.max(1, (to / 1440) * dayW);
                    this._bar(ctx, colX, SLEEP_Y, mw, SLEEP_BAR_H); ctx.fill();
                }
            });
            ctx.globalAlpha = 1;
        }
    },

    _buildDays(data) {
        const SHORT = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
        const t = data.shiftDaysType;
        if (!t) return [];

        const getFrom = dayIdx => {
            if (data.shiftHoursType === 'same') {
                const p = data.shiftHourPatterns[0];
                return p ? Utils.timeToMins(p.from) : null;
            }
            if (data.shiftHoursType === 'variable' && dayIdx !== null) {
                const e = data.shiftDetailEntries?.find(e => e.days.includes(dayIdx));
                return e ? Utils.timeToMins(e.from) : null;
            }
            return null;
        };
        const getTo = dayIdx => {
            if (data.shiftHoursType === 'same') {
                const p = data.shiftHourPatterns[0];
                return p ? Utils.timeToMins(p.to) : null;
            }
            if (data.shiftHoursType === 'variable' && dayIdx !== null) {
                const e = data.shiftDetailEntries?.find(e => e.days.includes(dayIdx));
                return e ? Utils.timeToMins(e.to) : null;
            }
            return null;
        };

        if (t === 'weekly') {
            return SHORT.map((label, i) => ({
                label, isWork: data.shiftWeekDays.includes(i),
                workFrom: data.shiftWeekDays.includes(i) ? getFrom(i) : null,
                workTo:   data.shiftWeekDays.includes(i) ? getTo(i)   : null,
            }));
        }

        if (t === 'cycle') {
            const c = data.shiftCycles[0] || { on: 4, off: 3 };
            const total = Math.min(c.on + c.off, 28);
            return Array.from({ length: total }, (_, i) => ({
                label: `D${i + 1}`, isWork: i < c.on,
                workFrom: i < c.on ? getFrom(null) : null,
                workTo:   i < c.on ? getTo(null)   : null,
            }));
        }

        if (t === 'variable') {
            return SHORT.map((label, i) => {
                const e = data.shiftDetailEntries?.find(e => e.days.includes(i));
                return { label, isWork: !!e,
                    workFrom: e ? Utils.timeToMins(e.from) : null,
                    workTo:   e ? Utils.timeToMins(e.to)   : null };
            });
        }

        return [];
    },

    _buildSleep(data) {
        if (!data.bedtimeType || !data.wakeType) return null;
        if (data.bedtimeType === 'variable' || data.wakeType === 'variable') return null;

        let from = 22 * 60;
        if (data.bedtimeType === 'fixed') {
            from = Utils.timeToMins(data.bedtime);
        } else if (data.bedtimeType === 'after-shift') {
            const end = Utils.timeToMins(data.shiftHourPatterns[0]?.to || '17:00');
            from = (end + data.bedtimeOffsetH * 60 + data.bedtimeOffsetM) % 1440;
        }

        let to = 6 * 60 + 30;
        if (data.wakeType === 'fixed') {
            to = Utils.timeToMins(data.wakeTime);
        } else if (data.wakeType === 'after-duration') {
            const onset = data.onsetType === 'fixed' ? (data.onsetH * 60 + data.onsetM) : 0;
            to = (from + onset + data.wakeDurationH * 60 + data.wakeDurationM) % 1440;
        }

        return { from, to };
    },

    _hoursKnown(data) {
        if (data.shiftHoursType === 'same' && data.shiftHourPatterns[0]?.from) return true;
        if (data.shiftHoursType === 'variable') return true;
        return false;
    },

    _bar(ctx, x, y, w, h) {
        if (w <= 0 || h <= 0) return;
        const r = Math.min(2, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h);
        ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
    },
};
