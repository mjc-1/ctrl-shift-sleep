const SLOTS_KEY = 'sleep-planner-slots';

function getSlots() {
    try { return Object.keys(JSON.parse(localStorage.getItem(SLOTS_KEY) || '{}')); }
    catch { return []; }
}

function _saveToSlot(name) {
    let db = {};
    try { db = JSON.parse(localStorage.getItem(SLOTS_KEY) || '{}'); } catch {}
    db[name] = { activities: State.activities, targets: State.targets,
                 totalDays: State.totalDays, onsetH: State.onsetH, onsetM: State.onsetM };
    localStorage.setItem(SLOTS_KEY, JSON.stringify(db));
}

function _loadFromSlot(name) {
    try {
        const db = JSON.parse(localStorage.getItem(SLOTS_KEY) || '{}');
        const d  = db[name];
        if (!d) return;
        if (d.activities)          State.activities = d.activities;
        if (d.targets)             Object.assign(State.targets, d.targets);
        if (d.totalDays)           State.totalDays  = d.totalDays;
        if (d.onsetH !== undefined) State.onsetH    = d.onsetH;
        if (d.onsetM !== undefined) State.onsetM    = d.onsetM;
        UI.sync(); ChartEngine.refreshZoom();
    } catch { alert('Save data is corrupted.'); }
}

const _PersistActions = {
    save: (event) => PersistMenu.open('save', event.currentTarget),
    load: (event) => PersistMenu.open('load', event.currentTarget),
    getSlots,
    _saveToSlot,
    _loadFromSlot,
};
