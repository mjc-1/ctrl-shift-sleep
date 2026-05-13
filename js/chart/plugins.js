const chartPlugins = [
    { id: 'banding', beforeDraw: chart => {
        const {ctx, scales: {x, y}} = chart;
        for (let d = 0; d < State.totalDays; d++) {
            const x0 = x.getPixelForValue(State.viewStart.plus({days: d}).toMillis());
            const x1 = x.getPixelForValue(State.viewStart.plus({days: d+1}).toMillis());
            ctx.fillStyle = d % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.01)';
            ctx.fillRect(x0, y.top, x1 - x0, y.bottom - y.top);

            const label = State.viewStart.plus({days: d}).toFormat('ccc d MMM');
            ctx.font      = 'bold 10px sans-serif';
            ctx.fillStyle = '#94a3b8';
            const firstCharW = ctx.measureText(label.charAt(0)).width;
            const tx = x0 - (firstCharW / 2) * Math.cos(Math.PI / 4);
            ctx.save();
            ctx.translate(tx, y.top - 4);
            ctx.rotate(-Math.PI / 4);
            ctx.textAlign    = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, 0, 0);
            ctx.restore();
        }
    }},
    { id: 'labels', afterDatasetsDraw: chart => {
        const {ctx, scales: {x, y}} = chart;
        ctx.save();
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'white';
        chart.data.datasets.forEach(ds => {
            if (ds.label === 'Hypnogram') return;
            for (let i = 0; i < ds.data.length; i += 3) {
                if (!ds.data[i] || !ds.data[i+1]) continue;
                const px0 = x.getPixelForValue(ds.data[i].x);
                const px1 = x.getPixelForValue(ds.data[i+1].x);
                const barW = px1 - px0;
                if (barW <= 0) continue;
                const cx = (px0 + px1) / 2, cy = y.getPixelForValue(ds.data[i].y);
                const full = ds.label;
                const ICON_W = 14;
                ctx.font = 'bold 9px sans-serif';
                const labelW = ctx.measureText(full).width;
                if (ds.icon && barW >= ICON_W + 6 + labelW + 8) {
                    const totalW = ICON_W + 6 + labelW;
                    const startX = cx - totalW / 2;
                    ctx.textAlign = 'left';
                    ctx.font = '13px sans-serif';
                    ctx.fillText(ds.icon, startX, cy);
                    ctx.font = 'bold 9px sans-serif';
                    ctx.fillText(full, startX + ICON_W + 6, cy);
                    ctx.textAlign = 'center';
                } else if (ds.icon && barW >= ICON_W + 4) {
                    ctx.font = '13px sans-serif';
                    ctx.fillText(ds.icon, cx, cy);
                    ctx.font = 'bold 9px sans-serif';
                } else if (barW >= 12) {
                    ctx.fillText(full.charAt(0), cx, cy);
                }
            }
        });
        ctx.restore();
    }},
    { id: 'alignLabels', afterDraw: chart => {
        const y = chart.scales.y;
        ['N3', 'N2', 'N1', 'REM', 'Awake'].forEach((lbl, i) => {
            const el = document.getElementById('lbl-' + lbl);
            if (el) el.style.top = y.getPixelForValue(i + 0.5) + 'px';
        });
    }},
];
