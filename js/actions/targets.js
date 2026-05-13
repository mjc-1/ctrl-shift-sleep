const _TargetActions = {
    setTarget: (field, v) => {
        const t = State.targets;
        const scale = (mins, r) => { const n = Math.max(0, Math.round(mins * r)); return { h: Math.floor(n / 60), m: n % 60 }; };
        const oldTotal = t.totalH * 60 + t.totalM;
        const oldPerVal = t.perVal;
        t[field] = v;
        if (field === 'perVal' && oldPerVal > 0) {
            const r = v / oldPerVal;
            const tot = scale(oldTotal, r);              t.totalH = tot.h; t.totalM = tot.m;
            const rem = scale(t.remH * 60 + t.remM, r); t.remH   = rem.h; t.remM   = rem.m;
        } else if ((field === 'totalH' || field === 'totalM') && oldTotal > 0) {
            const newTotal = t.totalH * 60 + t.totalM;
            const rem = scale(t.remH * 60 + t.remM, newTotal / oldTotal); t.remH = rem.h; t.remM = rem.m;
        }
        UI.sync();
    },
    stepTarget: (field, delta) => {
        const t = State.targets;
        const scale = (mins, r) => { const n = Math.max(0, Math.round(mins * r)); return { h: Math.floor(n / 60), m: n % 60 }; };
        const oldTotal  = t.totalH * 60 + t.totalM;
        const oldPerVal = t.perVal;
        if      (field === 'totalH') t.totalH = Math.max(0, t.totalH + delta);
        else if (field === 'totalM') t.totalM = Math.max(0, Math.min(59, t.totalM + delta));
        else if (field === 'remH')   t.remH   = Math.max(0, t.remH + delta);
        else if (field === 'remM')   t.remM   = Math.max(0, Math.min(59, t.remM + delta));
        else if (field === 'perVal') {
            t.perVal = Math.max(1, t.perVal + delta);
            const r   = t.perVal / oldPerVal;
            const tot = scale(oldTotal, r);              t.totalH = tot.h; t.totalM = tot.m;
            const rem = scale(t.remH * 60 + t.remM, r); t.remH   = rem.h; t.remM   = rem.m;
            UI.sync(); return;
        }
        if ((field === 'totalH' || field === 'totalM') && oldTotal > 0) {
            const newTotal = t.totalH * 60 + t.totalM;
            const rem = scale(t.remH * 60 + t.remM, newTotal / oldTotal); t.remH = rem.h; t.remM = rem.m;
        }
        UI.sync();
    },
};
