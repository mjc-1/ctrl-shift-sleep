function renderChart() {
    const lanes = [];
    let maxActivityEnd = 0;

    const datasets = State.activities.map(act => {
        const barPoints = [], intervals = [];
        let pS = luxon.DateTime.fromISO(act.start);
        if (!pS.isValid) return null;
        const limit = act.forever ? State.totalDays + 30 : act.dur;
        for (let d = 0; d < limit; d += act.freq) {
            const t0 = pS.plus({ days: d, hours: act.from.split(':')[0], minutes: act.from.split(':')[1] });
            let   t1 = pS.plus({ days: d, hours: act.to.split(':')[0],   minutes: act.to.split(':')[1]   });
            if (t1 < t0) t1 = t1.plus({days: 1});
            intervals.push({ s: t0.toMillis(), e: t1.toMillis() });
            if (!act.forever || d < State.totalDays) {
                if (t1.toMillis() > maxActivityEnd) maxActivityEnd = t1.toMillis();
            }
        }
        let laneIdx = 0;
        while (true) {
            if (!lanes[laneIdx]) lanes[laneIdx] = [];
            if (!intervals.some(iv => lanes[laneIdx].some(tk => iv.s < tk.e && iv.e > tk.s))) {
                lanes[laneIdx].push(...intervals); break;
            }
            laneIdx++;
        }
        intervals.forEach(iv => barPoints.push({ x: iv.s, y: 5.5 + laneIdx }, { x: iv.e, y: 5.5 + laneIdx }, { x: null }));
        return { label: act.name, icon: getActivityIcon(act.type), data: barPoints, borderColor: act.color, borderWidth: 8, pointRadius: 0 };
    }).filter(Boolean);

    const hypnoColor = State._theme ? State._theme.hypnoColor : '#818cf8';
    const hypnoFill  = State._theme ? State._theme.hypnoFill  : 'rgba(129,140,248,0.15)';
    datasets.push({ label: 'Hypnogram', data: buildHypnogram(), borderColor: hypnoColor, borderWidth: 0.75, backgroundColor: hypnoFill, fill: { target: { value: 4 }, below: hypnoFill }, tension: 0.4, pointRadius: 0 });

    const earliestFromMins = State.activities.length
        ? State.activities.reduce((min, act) => Math.min(min, Utils.timeToMins(act.from)), 1440)
        : 0;
    const defaultMax = State.viewStart.plus({days: State.totalDays}).toMillis();
    ChartEngine.instance.options.scales.y.max = 5 + Math.max(1, lanes.length);
    ChartEngine.instance.options.scales.x.min = State.viewStart.plus({ minutes: Math.max(0, earliestFromMins - 30) }).toMillis();
    ChartEngine.instance.options.scales.x.max = maxActivityEnd > 0 ? maxActivityEnd : defaultMax;
    ChartEngine.instance.data.datasets = datasets;
    ChartEngine.instance.update('none');
}
