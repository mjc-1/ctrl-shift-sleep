const _FieldActions = {
    stepField: (id, field, delta) => {
        History.debouncedPush();
        const act = State.activities.find(a => a.id === id);
        act[field] = Math.max(1, act[field] + delta);
        UI.sync();
    },
    setField: (id, field, v) => {
        History.debouncedPush();
        State.activities.find(a => a.id === id)[field] = v;
        UI.sync();
    },
    setEnding: (id, endDateStr) => {
        History.debouncedPush();
        const act = State.activities.find(a => a.id === id);
        const diff = luxon.DateTime.fromISO(endDateStr).diff(luxon.DateTime.fromISO(act.start), 'days').days;
        act.dur = Math.max(1, Math.round(diff));
        UI.sync();
    },
    setLengthH: (id, h) => {
        History.debouncedPush();
        const act = State.activities.find(a => a.id === id);
        const fromMins = Utils.timeToMins(act.from);
        const toMins   = Utils.timeToMins(act.to);
        let durMins = toMins - fromMins; if (durMins <= 0) durMins += 1440;
        const dM = durMins % 60;
        act.to = Utils.minsToTime(fromMins + Math.max(5, h * 60 + dM));
        UI.sync();
    },
    setLengthM: (id, m) => {
        History.debouncedPush();
        const act = State.activities.find(a => a.id === id);
        const fromMins = Utils.timeToMins(act.from);
        const toMins   = Utils.timeToMins(act.to);
        let durMins = toMins - fromMins; if (durMins <= 0) durMins += 1440;
        const dH = Math.floor(durMins / 60);
        act.to = Utils.minsToTime(fromMins + Math.max(5, dH * 60 + m));
        UI.sync();
    },
    setSpan: (id, days) => {
        History.debouncedPush();
        State.activities.find(a => a.id === id).dur = Math.max(1, days);
        UI.sync();
    },
};
