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

    const perStepper = Utils.stepper(t.perVal,
        `Actions.stepTarget('perVal',1)`, `Actions.stepTarget('perVal',-1)`,
        'day', v => Actions.setTarget('perVal', v));

    document.getElementById('stats-body').innerHTML = `
        <table class="an-table">
            <thead>
                <tr>
                    <th></th>
                    <th colspan="2" class="an-period-hdr">
                        <div class="an-period-stepper">${perStepper}<span class="sub-label-dim">days</span></div>
                    </th>
                    <th colspan="2" class="an-period-hdr">
                        <div class="an-period-stepper">
                            <span class="sub-text">${State.totalDays}</span>
                            <span class="sub-label-dim">days total</span>
                        </div>
                    </th>
                </tr>
                <tr>
                    <th></th>
                    <th class="an-type-hdr an-total">Sleep</th>
                    <th class="an-type-hdr an-rem">REM</th>
                    <th class="an-type-hdr an-total">Sleep</th>
                    <th class="an-type-hdr an-rem">REM</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <th class="an-metric-lbl">Target</th>
                    <td>${renderTargetValue('totalH', 'totalM', 'total-hour')}</td>
                    <td>${renderTargetValue('remH', 'remM', 'rem-hour')}</td>
                    <td>${renderDataValue(targets.total, 'var(--text)', false)}</td>
                    <td>${renderDataValue(targets.rem, C_REM, false)}</td>
                </tr>
                <tr>
                    <th class="an-metric-lbl">Actual</th>
                    <td>${renderDataValue(avg.actualT, 'var(--text)', true)}</td>
                    <td>${renderDataValue(avg.actualR, 'var(--text)', true)}</td>
                    <td>${renderDataValue(actuals.total, 'var(--text)', false)}</td>
                    <td>${renderDataValue(actuals.rem, 'var(--text)', false)}</td>
                </tr>
                <tr>
                    <th class="an-metric-lbl">Debt</th>
                    <td>${renderDataValue(avg.debtT, tColor, true)}</td>
                    <td>${renderDataValue(avg.debtR, rColor, true)}</td>
                    <td>${renderDataValue(debts.total, tColor, false)}</td>
                    <td>${renderDataValue(debts.rem, rColor, false)}</td>
                </tr>
            </tbody>
        </table>`;
}
