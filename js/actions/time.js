const _TimeActions = {
    stepTime: (id, field, unit, delta) => {
        History.debouncedPush();
        const act = State.activities.find(a => a.id === id);
        let [h, m] = act[field].split(':').map(Number);
        if (unit === 'h') h = (h + delta + 24) % 24;
        else              m = (m + delta + 60) % 60;
        act[field] = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        UI.sync();
    },
    setTimeH: (id, field, h) => {
        History.debouncedPush();
        const act = State.activities.find(a => a.id === id);
        act[field] = `${String(h).padStart(2, '0')}:${act[field].split(':')[1]}`;
        UI.sync();
    },
    setTimeM: (id, field, m) => {
        History.debouncedPush();
        const act = State.activities.find(a => a.id === id);
        act[field] = `${act[field].split(':')[0]}:${String(m).padStart(2, '0')}`;
        UI.sync();
    },
};
