let _dragId   = null;
let _overRow  = null;
let _dropped  = false;

const DragReorder = {
    start: (e, id) => {
        _dragId = id;
        _dropped = false;
        e.dataTransfer.effectAllowed = 'move';
        e.currentTarget.style.opacity = '0.4';
    },
    over: (e, id) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const row = e.currentTarget;
        if (_overRow !== row) {
            if (_overRow) _overRow.style.outline = '';
            _overRow = row;
            row.style.outline = '2px solid var(--primary)';
        }
    },
    leave: (e) => {
        if (_overRow === e.currentTarget) {
            e.currentTarget.style.outline = '';
            _overRow = null;
        }
    },
    drop: (e, id) => {
        e.preventDefault();
        _dropped = true;
        if (_overRow) { _overRow.style.outline = ''; _overRow = null; }
        if (_dragId !== null && _dragId !== id) {
            const acts = State.activities;
            const from = acts.findIndex(a => a.id === _dragId);
            const to   = acts.findIndex(a => a.id === id);
            if (from !== -1 && to !== -1) { const [m] = acts.splice(from, 1); acts.splice(to, 0, m); }
        }
        _dragId = null;
        UI.sync();
    },
    end: () => {
        if (_overRow) { _overRow.style.outline = ''; _overRow = null; }
        _dragId = null;
        if (!_dropped) UI.sync();
        _dropped = false;
    },
};
