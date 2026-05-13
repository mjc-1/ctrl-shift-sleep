function buildHypnogram() {
    const hypno = [];
    const lerp = (a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t));
    const Y = { AWAKE: 4.0, REM: 3.5, N1: 2.8, N2: 1.6, N3: 0.4 };

    State.activities.filter(a => a.type === 'Sleep').forEach(act => {
        let pS = luxon.DateTime.fromISO(act.start);
        const limit = act.forever ? State.totalDays + 30 : act.dur;
        for (let d = 0; d < limit; d++) {
            const t0  = pS.plus({ days: d, hours: act.from.split(':')[0], minutes: act.from.split(':')[1] });
            let   t1  = pS.plus({ days: d, hours: act.to.split(':')[0],   minutes: act.to.split(':')[1]   });
            if (t1 < t0) t1 = t1.plus({days: 1});
            const eff = t0.plus({ minutes: State.onsetH * 60 + State.onsetM });
            hypno.push({ x: t0.toMillis(), y: Y.AWAKE }, { x: eff.toMillis(), y: Y.AWAKE });

            const totalMs = Math.max(0, t1.diff(eff).as('milliseconds'));
            const CYCLE = 90 * 60000, STEP = 5 * 60000;
            for (let ms = 0; ms <= totalMs; ms += STEP) {
                const cycleIdx    = Math.floor(ms / CYCLE);
                const tcMin       = (ms % CYCLE) / 60000;
                const swsDur      = Math.max(0, 25 - cycleIdx * 8);
                const remDur      = Math.min(42, 5 + cycleIdx * 10);
                const T_N1_END    = 5;
                const T_SWS_END   = 10 + swsDur;
                const T_REM_START = 90 - remDur;
                let y;
                if      (tcMin < T_N1_END)    y = lerp(Y.AWAKE, Y.N2, tcMin / T_N1_END);
                else if (tcMin < 10)           y = swsDur > 0 ? lerp(Y.N2, Y.N3, (tcMin - T_N1_END) / 5) : Y.N2;
                else if (tcMin < T_SWS_END)    y = swsDur > 0 ? Y.N3 : Y.N2;
                else if (tcMin < T_REM_START)  y = lerp(swsDur > 0 ? Y.N3 : Y.N2, Y.N1, (tcMin - T_SWS_END) / Math.max(1, T_REM_START - T_SWS_END));
                else                           y = Y.REM;
                const pt = eff.plus({ milliseconds: ms });
                if (pt.toMillis() <= t1.toMillis()) hypno.push({ x: pt.toMillis(), y });
            }
            hypno.push({ x: t1.toMillis(), y: Y.AWAKE }, { x: null });
        }
    });
    return hypno;
}
