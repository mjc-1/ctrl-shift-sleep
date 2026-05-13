const WizardPreview = {
    _WORK_COLOR:    '#60a5fa',
    _SLEEP_COLOR:   '#818cf8',
    _ONSET_COLOR:   '#312e81',
    _COMMUTE_COLOR: '#f97316',

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

        const BAR_H = Math.floor(cH * 0.40);
        const BAR_Y = PT + Math.floor((cH - BAR_H) / 2);

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
        ctx.fillStyle = this._WORK_COLOR;
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
            ctx.fillRect(barX, BAR_Y, barW, BAR_H);
        });
        ctx.globalAlpha = 1;

        // Commute bars (adjacent to work bars)
        if (data.extraActivities?.includes('Commute')) {
            const toMins   = (data.commuteToWorkH   || 0) * 60 + (data.commuteToWorkM   || 0);
            const fromMins = (data.commuteFromWorkH || 0) * 60 + (data.commuteFromWorkM || 0);
            ctx.globalAlpha = 0.78;
            ctx.fillStyle = this._COMMUTE_COLOR;
            days.forEach((day, i) => {
                if (!day.isWork) return;
                const colX = PL + i * dayW;
                if (hoursKnown && day.workFrom !== null && day.workTo !== null) {
                    if (toMins > 0) {
                        const commStart = ((day.workFrom - toMins) % 1440 + 1440) % 1440;
                        const bx = colX + (commStart / 1440) * dayW;
                        const bw = Math.max(2, (toMins / 1440) * dayW);
                        ctx.fillRect(bx, BAR_Y, bw, BAR_H);
                    }
                    if (fromMins > 0) {
                        const bx = colX + (day.workTo / 1440) * dayW;
                        const bw = Math.max(2, (fromMins / 1440) * dayW);
                        ctx.fillRect(bx, BAR_Y, bw, BAR_H);
                    }
                } else {
                    const bw = Math.max(3, dayW * 0.12);
                    ctx.fillRect(colX + 1, BAR_Y, bw, BAR_H);
                    ctx.fillRect(colX + dayW - 1 - bw, BAR_Y, bw, BAR_H);
                }
            });
            ctx.globalAlpha = 1;
        }

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
                    ctx.fillRect(bx, BAR_Y, bw, BAR_H);
                } else {
                    // crosses midnight — evening part
                    const ew = Math.max(1, ((1440 - from) / 1440) * dayW);
                    ctx.fillRect(colX + (from / 1440) * dayW, BAR_Y, ew, BAR_H);
                    // morning part
                    const mw = Math.max(1, (to / 1440) * dayW);
                    ctx.fillRect(colX, BAR_Y, mw, BAR_H);
                }
            });
            ctx.globalAlpha = 1;
        }

        // Bedtime vertical line
        if (sleep) {
            ctx.strokeStyle = 'rgba(129,140,248,0.7)';
            ctx.lineWidth = 1.5;
            days.forEach((_, i) => {
                const colX = PL + i * dayW;
                const lx = Math.round(colX + (sleep.from / 1440) * dayW) + 0.5;
                ctx.beginPath();
                ctx.moveTo(lx, BAR_Y - 3);
                ctx.lineTo(lx, BAR_Y + BAR_H + 3);
                ctx.stroke();
            });
        }

        // Onset bar (overlaid on sleep bar)
        if (sleep && data.onsetType === 'fixed') {
            const onsetDur = (data.onsetH || 0) * 60 + (data.onsetM || 0);
            if (onsetDur > 0) {
                ctx.globalAlpha = 0.88;
                ctx.fillStyle = this._ONSET_COLOR;
                days.forEach((_, i) => {
                    const colX = PL + i * dayW;
                    const bx = colX + (sleep.from / 1440) * dayW;
                    const bw = Math.max(2, (onsetDur / 1440) * dayW);
                    ctx.fillRect(bx, BAR_Y, bw, BAR_H);
                });
                ctx.globalAlpha = 1;
            }
        }

        // RAG sleep-need threshold lines (at bedtime + each duration)
        if (sleep && data.sleepBareH !== undefined) {
            const thresholds = [
                { dur: (data.sleepBareH || 0) * 60 + (data.sleepBareM || 0), color: '#ef4444' },
                { dur: (data.sleepOkH   || 0) * 60 + (data.sleepOkM   || 0), color: '#f59e0b' },
                { dur: (data.sleepGoodH || 0) * 60 + (data.sleepGoodM || 0), color: '#22c55e' },
            ];
            ctx.lineWidth = 1.5;
            thresholds.forEach(({ dur, color }) => {
                if (dur <= 0) return;
                const wakePos = (sleep.from + dur) % 1440;
                ctx.strokeStyle = color + 'bb';
                days.forEach((_, i) => {
                    const colX = PL + i * dayW;
                    const lx = Math.round(colX + (wakePos / 1440) * dayW) + 0.5;
                    ctx.beginPath();
                    ctx.moveTo(lx, BAR_Y);
                    ctx.lineTo(lx, BAR_Y + BAR_H);
                    ctx.stroke();
                });
            });
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
};
