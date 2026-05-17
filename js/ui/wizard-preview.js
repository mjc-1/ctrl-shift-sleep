const WizardPreview = {
    _WORK_COLOR:    '#60a5fa',
    _SLEEP_COLOR:   '#818cf8',
    _ONSET_COLOR:   '#312e81',
    _COMMUTE_COLOR: '#f97316',

    draw(canvas, data) {
        const MIN_DAY_W = 40;
        const containerW = canvas.parentElement ? canvas.parentElement.clientWidth : 0;
        const numDays = (data.days && data.days > 0) ? data.days : 7;
        const days = this._buildDisplayDays(data, numDays);
        const targetW = days.length > 0
            ? Math.max(containerW, days.length * MIN_DAY_W)
            : containerW || 200;
        canvas.style.width = targetW + 'px';

        const dpr = window.devicePixelRatio || 1;
        const W   = canvas.offsetWidth;
        const H   = canvas.offsetHeight;
        if (!W || !H) return;

        canvas.width  = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, W, H);

        const bedtimeMins = this._buildBedtime(data);
        const PT_LABEL = 36;
        const PL = 6, PR = 6, PT = bedtimeMins !== null ? PT_LABEL : 6, PB = 18;
        const cW = W - PL - PR;
        const cH = H - PT - PB;

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
        const hoursKnown  = this._hoursKnown(data);
        const sleep       = this._buildSleep(data);
        const onsetDur    = data.onsetType === 'fixed'
            ? (data.onsetH || 0) * 60 + (data.onsetM || 0) : 0;

        const BAR_H = Math.floor(cH * 0.40);
        const BAR_Y = PT + Math.floor((cH - BAR_H) / 2);
        const RAG_H = Math.max(2, Math.floor((BAR_Y - PT) / 3));

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

        // Commute bars
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
                        ctx.fillRect(colX + (commStart / 1440) * dayW, BAR_Y, Math.max(2, (toMins / 1440) * dayW), BAR_H);
                    }
                    if (fromMins > 0) {
                        ctx.fillRect(colX + (day.workTo / 1440) * dayW, BAR_Y, Math.max(2, (fromMins / 1440) * dayW), BAR_H);
                    }
                } else {
                    const bw = Math.max(3, dayW * 0.12);
                    ctx.fillRect(colX + 1, BAR_Y, bw, BAR_H);
                    ctx.fillRect(colX + dayW - 1 - bw, BAR_Y, bw, BAR_H);
                }
            });
            ctx.globalAlpha = 1;
        }

        // Sleep onset bar (time-in-bed before sleep begins)
        if (bedtimeMins !== null && data.onsetType === 'fixed' && onsetDur > 0) {
            ctx.globalAlpha = 0.85;
            ctx.fillStyle = this._ONSET_COLOR;
            days.forEach((_, i) => {
                const colX = PL + i * dayW;
                const bx = colX + (bedtimeMins / 1440) * dayW;
                const bw = Math.max(2, (onsetDur / 1440) * dayW);
                ctx.fillRect(bx, BAR_Y, bw, BAR_H);
            });
            ctx.globalAlpha = 1;
        }

        // Sleep bars — actual sleep only (starts AFTER onset)
        if (sleep) {
            const sleepStart = (sleep.from + onsetDur) % 1440;
            const sleepEnd   = sleep.to;
            const dur = (sleepEnd - sleepStart + 1440) % 1440;

            if (dur > 0) {
                ctx.globalAlpha = 0.72;
                ctx.fillStyle = this._SLEEP_COLOR;
                days.forEach((_, i) => {
                    const colX = PL + i * dayW;
                    if (sleepStart + dur <= 1440) {
                        ctx.fillRect(colX + (sleepStart / 1440) * dayW, BAR_Y, Math.max(2, (dur / 1440) * dayW), BAR_H);
                    } else {
                        ctx.fillRect(colX + (sleepStart / 1440) * dayW, BAR_Y, Math.max(1, ((1440 - sleepStart) / 1440) * dayW), BAR_H);
                        ctx.fillRect(colX, BAR_Y, Math.max(1, ((sleepStart + dur - 1440) / 1440) * dayW), BAR_H);
                    }
                });
                ctx.globalAlpha = 1;
            }
        }

        // RAG sleep-need bands — above bar, start at end of onset (= start of actual sleep)
        if (bedtimeMins !== null && data.sleepNeedsSet) {
            const ragStart = (bedtimeMins + onsetDur) % 1440;
            const ragBands = [
                { dur: (data.sleepGoodH || 0) * 60 + (data.sleepGoodM || 0), color: '#22c55ecc', row: 0 },
                { dur: (data.sleepOkH   || 0) * 60 + (data.sleepOkM   || 0), color: '#f59e0bcc', row: 1 },
                { dur: (data.sleepBareH || 0) * 60 + (data.sleepBareM || 0), color: '#ef4444cc', row: 2 },
            ];
            ragBands.forEach(({ dur, color, row }) => {
                if (dur <= 0) return;
                const bandY  = BAR_Y - RAG_H * (3 - row);
                ctx.fillStyle = color;
                const endAbs = ragStart + dur;
                days.forEach((_, i) => {
                    const colX  = PL + i * dayW;
                    const fromX = colX + (ragStart / 1440) * dayW;
                    if (endAbs <= 1440) {
                        ctx.fillRect(fromX, bandY, Math.max(2, (dur / 1440) * dayW), RAG_H);
                    } else {
                        ctx.fillRect(fromX, bandY, Math.max(1, ((1440 - ragStart) / 1440) * dayW), RAG_H);
                        ctx.fillRect(colX,  bandY, Math.max(1, ((endAbs - 1440)   / 1440) * dayW), RAG_H);
                    }
                });
            });
        }

        // Bedtime 45° labels — every occurrence, spaced to avoid overlap
        if (bedtimeMins !== null) {
            const bedH = Math.floor(bedtimeMins / 60);
            const bedM = bedtimeMins % 60;
            const timeLabel = `🛏 ${String(bedH).padStart(2,'0')}:${String(bedM).padStart(2,'0')}`;
            ctx.save();
            ctx.font = '7px system-ui, sans-serif';
            ctx.fillStyle = 'rgba(129,140,248,0.92)';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'bottom';
            // Approximate horizontal footprint of rotated label: labelLen * cos(45°)
            const metrics = ctx.measureText(timeLabel);
            const labelFootprint = metrics.width * Math.cos(Math.PI / 4) + 4;
            let lastX = -Infinity;
            days.forEach((_, i) => {
                const colX = PL + i * dayW;
                const lx   = colX + (bedtimeMins / 1440) * dayW;
                if (lx - lastX < labelFootprint) return;
                lastX = lx;
                ctx.save();
                ctx.translate(lx, PT - 3);
                ctx.rotate(-Math.PI / 4);
                ctx.fillText(timeLabel, 0, 0);
                ctx.restore();
            });
            ctx.restore();
        }
    },

    // Cumulative sleep-debt line chart
    drawDebt(canvas, data) {
        const MIN_DAY_W = 40;
        const containerW = canvas.parentElement ? canvas.parentElement.clientWidth : 0;
        const numDays = (data.days && data.days > 0) ? data.days : 7;
        const days = this._buildDisplayDays(data, numDays);
        const targetW = days.length > 0
            ? Math.max(containerW, days.length * MIN_DAY_W)
            : containerW || 200;
        canvas.style.width = targetW + 'px';

        const dpr = window.devicePixelRatio || 1;
        const W   = canvas.offsetWidth;
        const H   = canvas.offsetHeight;
        if (!W || !H) return;

        canvas.width  = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, W, H);

        const sleep = this._buildSleep(data);
        if (!sleep || !days.length || !data.sleepNeedsSet) return;

        const onsetDur = data.onsetType === 'fixed'
            ? (data.onsetH || 0) * 60 + (data.onsetM || 0) : 0;
        const { from, to } = sleep;
        const rawSleep  = (to - from + 1440) % 1440;
        const actualSleep = Math.max(0, rawSleep - onsetDur);
        const targetSleep = (data.sleepGoodH || 8) * 60 + (data.sleepGoodM || 0);
        const dailyDebt   = targetSleep - actualSleep; // positive = in debt

        // Build cumulative per day
        const cumDebt = [];
        let running = 0;
        for (let i = 0; i < days.length; i++) {
            running += dailyDebt;
            cumDebt.push(running);
        }

        const PL = 6, PR = 6, PT = 4, PB = 14;
        const cW = W - PL - PR;
        const cH = H - PT - PB;
        const N    = days.length;
        const dayW = cW / N;

        const maxAbs = Math.max(60, Math.max(...cumDebt.map(Math.abs)));
        const zeroY  = PT + cH / 2;

        // Background
        ctx.fillStyle = 'rgba(255,255,255,0.02)';
        ctx.fillRect(PL, PT, cW, cH);

        // Zero line
        ctx.strokeStyle = 'rgba(255,255,255,0.22)';
        ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(PL, zeroY); ctx.lineTo(PL + cW, zeroY); ctx.stroke();

        // Build point list (end of each day column)
        const pts = cumDebt.map((v, i) => ({
            x: PL + (i + 1) * dayW,
            y: zeroY - (v / maxAbs) * (cH / 2),
        }));
        // Prepend origin
        const allPts = [{ x: PL, y: zeroY }, ...pts];

        if (allPts.length > 1) {
            // Red fill (above zero = debt)
            ctx.beginPath();
            ctx.moveTo(allPts[0].x, zeroY);
            allPts.forEach(p => ctx.lineTo(p.x, p.y));
            ctx.lineTo(allPts[allPts.length - 1].x, zeroY);
            ctx.closePath();
            ctx.fillStyle = 'rgba(239,68,68,0.28)';
            ctx.fill();

            // Green fill (below zero = surplus) — clip to lower half
            ctx.save();
            ctx.beginPath();
            ctx.rect(PL, zeroY, cW, PT + cH - zeroY);
            ctx.clip();
            ctx.beginPath();
            ctx.moveTo(allPts[0].x, zeroY);
            allPts.forEach(p => ctx.lineTo(p.x, p.y));
            ctx.lineTo(allPts[allPts.length - 1].x, zeroY);
            ctx.closePath();
            ctx.fillStyle = 'rgba(34,197,94,0.28)';
            ctx.fill();
            ctx.restore();

            // Line
            ctx.beginPath();
            allPts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
            ctx.strokeStyle = 'rgba(255,255,255,0.55)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        // Label
        ctx.font = '7px system-ui, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.28)';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText('cumulative sleep debt', PL + 2, PT + cH + 12);
    },

    _buildBedtime(data) {
        if (!data.bedtimeType || data.bedtimeType === 'variable') return null;
        if (data.bedtimeType === 'fixed') return Utils.timeToMins(data.bedtime);
        if (data.bedtimeType === 'after-shift') {
            const end = Utils.timeToMins(data.shiftHourPatterns[0]?.to || '17:00');
            return (end + (data.bedtimeOffsetH || 0) * 60 + (data.bedtimeOffsetM || 0)) % 1440;
        }
        return null;
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

    _buildDisplayDays(data, numDays) {
        const pattern = this._buildDays(data);
        if (!pattern.length) return [];
        const result = [];
        for (let i = 0; i < numDays; i++) result.push(pattern[i % pattern.length]);
        return result;
    },

    _buildSleep(data) {
        if (!data.bedtimeType || !data.wakeType) return null;
        if (data.bedtimeType === 'variable' || data.wakeType === 'variable') return null;

        let from = 22 * 60;
        if (data.bedtimeType === 'fixed') {
            from = Utils.timeToMins(data.bedtime);
        } else if (data.bedtimeType === 'after-shift') {
            const end = Utils.timeToMins(data.shiftHourPatterns[0]?.to || '17:00');
            from = (end + (data.bedtimeOffsetH || 0) * 60 + (data.bedtimeOffsetM || 0)) % 1440;
        }

        let to = 6 * 60 + 30;
        if (data.wakeType === 'fixed') {
            to = Utils.timeToMins(data.wakeTime);
        } else if (data.wakeType === 'after-duration') {
            const onset = data.onsetType === 'fixed' ? ((data.onsetH || 0) * 60 + (data.onsetM || 0)) : 0;
            to = (from + onset + (data.wakeDurationH || 0) * 60 + (data.wakeDurationM || 0)) % 1440;
        }

        return { from, to };
    },

    _hoursKnown(data) {
        if (data.shiftHoursType === 'same' && data.shiftHourPatterns[0]?.from) return true;
        if (data.shiftHoursType === 'variable') return true;
        return false;
    },
};
