function syncUI() {
    Object.keys(_pkReg).forEach(k => delete _pkReg[k]);
    _pkN = 0;

    document.getElementById('days-mount').innerHTML    = Utils.stepper(State.totalDays, 'Actions.adjustDays(1)', 'Actions.adjustDays(-1)', 'day', v => { State.totalDays = Math.max(1, v); UI.sync(); ChartEngine.refreshZoom(); });
    document.getElementById('onset-h-mount').innerHTML = Utils.stepper(State.onsetH, "State.onsetH++; UI.sync()", "State.onsetH=Math.max(0,State.onsetH-1); UI.sync()", 'clock-hour', v => { State.onsetH = v; UI.sync(); });
    document.getElementById('onset-m-mount').innerHTML = Utils.stepper(State.onsetM, "State.onsetM=Math.min(59,State.onsetM+1); UI.sync()", "State.onsetM=Math.max(0,State.onsetM-1); UI.sync()", 'clock-min',  v => { State.onsetM = v; UI.sync(); });

    const acts = State.activities;
    const al   = document.getElementById('activity-list');
    if (!acts.length) {
        al.innerHTML = '';
    } else {
        const nameCells = acts.map(a =>
            `<td draggable="true" style="cursor:grab"
                ondragstart="DragReorder.start(event,${a.id})"
                ondragover="DragReorder.over(event,${a.id})"
                ondragleave="DragReorder.leave(event)"
                ondrop="DragReorder.drop(event,${a.id})"
                ondragend="DragReorder.end()">${_actCellName(a)}</td>`
        ).join('');

        al.innerHTML =
            `<tr><th>Name</th>${nameCells}</tr>` +
            `<tr><th>From</th>${acts.map(a => `<td>${_actCellTime(a,'from',5)}</td>`).join('')}</tr>` +
            `<tr><th>To</th>${acts.map(a => `<td>${_actCellTime(a,'to',5)}</td>`).join('')}</tr>` +
            `<tr><th>Length</th>${acts.map(a => `<td>${_actCellLength(a)}</td>`).join('')}</tr>` +
            `<tr><th>Every</th>${acts.map(a => `<td>${_actCellEvery(a)}</td>`).join('')}</tr>` +
            `<tr><th>Starting</th>${acts.map(a => `<td>${_actCellStart(a)}</td>`).join('')}</tr>` +
            `<tr><th>Forever</th>${acts.map(a => `<td>${_actCellForever(a)}</td>`).join('')}</tr>` +
            `<tr><th>Ending</th>${acts.map(a => `<td>${_actCellEnd(a)}</td>`).join('')}</tr>` +
            `<tr><th>Span</th>${acts.map(a => `<td>${_actCellSpan(a)}</td>`).join('')}</tr>` +
            `<tr><th></th>${acts.map(a => `<td>${_actCellRemove(a)}</td>`).join('')}</tr>`;
    }

    UI.renderActivityColorSection();
    renderAnalytics();
    ChartEngine.render();
}
