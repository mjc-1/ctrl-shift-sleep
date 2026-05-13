const _ActivityActions = {
    updateName: (id, name) => {
        State.activities.find(a => a.id === id).name = name;
        ChartEngine.render();
    },
    updateAct: (id, field, val) => {
        State.activities.find(a => a.id === id)[field] = val;
        UI.sync();
    },
    add: (name, color, type) => {
        History.push();
        const work = State.activities.find(a => a.type === 'Work');
        const commutes = State.activities.filter(a => a.type === 'Commute');
        let from = '09:00', to = '17:00', forever = false, dur = 7;
        if (type === 'Sleep') {
            from = '23:00'; to = '07:00'; forever = true;
        } else if (type === 'Work') {
            from = '09:00'; to = '17:00'; forever = true;
        } else if (type === 'Commute') {
            if (work) {
                // Always add as a pair — to work and from work
                const wFrom = Utils.timeToMins(work.from), wTo = Utils.timeToMins(work.to);
                State.activities.push(
                    { id: Date.now(),     name, color, type, start: State.viewStart.toISODate(), from: Utils.minsToTime(wFrom - 30), to: work.from,              freq: 1, dur, forever: true },
                    { id: Date.now() + 1, name, color, type, start: State.viewStart.toISODate(), from: work.to,              to: Utils.minsToTime(wTo + 30), freq: 1, dur, forever: true }
                );
                UI.sync();
                return;
            } else {
                from = '08:30'; to = '09:00';
            }
        } else {
            const waking = State.activities.filter(a => a.type !== 'Sleep');
            if (waking.length > 0) {
                const earliest = Math.min(...waking.map(a => Utils.timeToMins(a.from)));
                to = Utils.minsToTime(earliest - 5);
                from = Utils.minsToTime(earliest - 65);
            } else {
                from = '07:00'; to = '08:00';
            }
        }
        State.activities.push({ id: Date.now(), name, color, type, start: State.viewStart.toISODate(), from, to, freq: 1, dur, forever });
        UI.sync();
    },
    remove: (id) => {
        History.push();
        State.activities = State.activities.filter(a => a.id !== id);
        UI.sync();
    },
};
