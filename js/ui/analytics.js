function renderAnalytics() {
    let totalActualSecs = 0;
    const end = State.viewStart.plus({days: State.totalDays});
    State.activities.filter(a => a.type === 'Sleep').forEach(act => {
        let pS = luxon.DateTime.fromISO(act.start);
        const limit = act.forever ? State.totalDays + 30 : act.dur;
        for (let d = 0; d < limit; d += act.freq) {
            const t0   = pS.plus({ days: d, hours: act.from.split(':')[0], minutes: act.from.split(':')[1] });
            let   t1   = pS.plus({ days: d, hours: act.to.split(':')[0],   minutes: act.to.split(':')[1]   });
            if (t1 < t0) t1 = t1.plus({days: 1});
            const effS = t0.plus({ minutes: State.onsetH * 60 + State.onsetM });
            const inter = Math.min(t1.toMillis(), end.toMillis()) - Math.max(effS.toMillis(), State.viewStart.toMillis());
            if (inter > 0) totalActualSecs += inter / 1000;
        }
    });

    const t = State.targets;
    const actuals = { total: totalActualSecs, rem: totalActualSecs * 0.2 };
    const targets = {
        total: (t.totalH * 3600 + t.totalM * 60) / t.perVal * State.totalDays,
        rem:   (t.remH   * 3600 + t.remM   * 60) / t.perVal * State.totalDays
    };
    const debts  = { total: targets.total - actuals.total, rem: targets.rem - actuals.rem };
    const tColor = debts.total > 60 ? 'var(--danger)' : 'var(--success)';
    const rColor = debts.rem   > 60 ? 'var(--danger)' : 'var(--success)';
    const avg = {
        actualT: actuals.total / State.totalDays * t.perVal,
        actualR: actuals.rem   / State.totalDays * t.perVal,
        debtT:   debts.total   / State.totalDays * t.perVal,
        debtR:   debts.rem     / State.totalDays * t.perVal,
    };

    const band = (periodHtml, ttgt, rtgt, ta, ra, td, rd, bold) => `
        <div class="stats-band-group">
            <div class="period-cell" style="display:grid; grid-template-columns:50px auto; align-items:center; justify-content:center; gap:4px;">${periodHtml}</div>
            <div class="band-row band-total">
                <div class="type-cell">total</div>
                <div class="metric-cell">${ttgt}</div>
                <div class="metric-cell">${renderDataValue(ta, 'var(--text)', bold)}</div>
                <div class="metric-cell">${renderDataValue(td, tColor, bold)}</div>
            </div>
            <div class="band-row band-rem">
                <div class="type-cell">REM</div>
                <div class="metric-cell">${rtgt}</div>
                <div class="metric-cell">${renderDataValue(ra, 'var(--text)', bold)}</div>
                <div class="metric-cell">${renderDataValue(rd, rColor, bold)}</div>
            </div>
        </div>`;

    document.getElementById('stats-body').innerHTML =
        band(
            `${Utils.stepper(t.perVal, `Actions.stepTarget('perVal',1)`, `Actions.stepTarget('perVal',-1)`, 'day', v => Actions.setTarget('perVal', v))}<span class="sub-label-dim">days</span>`,
            renderTargetValue('totalH', 'totalM', 'total-hour'),
            renderTargetValue('remH',   'remM',   'rem-hour'),
            avg.actualT, avg.actualR, avg.debtT, avg.debtR, true
        ) +
        band(
            `<span class="sub-text" style="text-align:center;">${State.totalDays}</span><span class="sub-label-dim">days</span>`,
            renderDataValue(targets.total, 'var(--text)', false),
            renderDataValue(targets.rem,   C_REM,         false),
            actuals.total, actuals.rem, debts.total, debts.rem, false
        );
}
