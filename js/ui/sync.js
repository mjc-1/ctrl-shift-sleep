function syncUI() {
    Object.keys(_pkReg).forEach(k => delete _pkReg[k]);
    _pkN = 0;

    document.getElementById('days-mount').innerHTML    = Utils.stepper(State.totalDays, 'Actions.adjustDays(1)', 'Actions.adjustDays(-1)', 'day', v => { State.totalDays = Math.max(1, v); UI.sync(); ChartEngine.refreshZoom(); });
    document.getElementById('onset-h-mount').innerHTML = Utils.stepper(State.onsetH, "State.onsetH++; UI.sync()", "State.onsetH=Math.max(0,State.onsetH-1); UI.sync()", 'clock-hour', v => { State.onsetH = v; UI.sync(); });
    document.getElementById('onset-m-mount').innerHTML = Utils.stepper(State.onsetM, "State.onsetM=Math.min(59,State.onsetM+1); UI.sync()", "State.onsetM=Math.max(0,State.onsetM-1); UI.sync()", 'clock-min',  v => { State.onsetM = v; UI.sync(); });

    document.getElementById('activity-list').innerHTML = State.activities.map(buildActivityRow).join('');

    UI.renderActivityColorSection();
    renderAnalytics();
    ChartEngine.render();
}
