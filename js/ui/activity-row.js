function buildActivityRow(act) {
    const startDt = luxon.DateTime.fromISO(act.start);
    const endDate = startDt.plus({days: act.dur}).toISODate();

    const fromMins = Utils.timeToMins(act.from);
    const toMins   = Utils.timeToMins(act.to);
    let durMins = toMins - fromMins;
    if (durMins <= 0) durMins += 1440;
    const dH = Math.floor(durMins / 60), dM = durMins % 60;
    const lengthStr = dM > 0 ? `${dH}h${dM}m` : `${dH}h`;

    const nameCell = act.type === 'Custom'
        ? `<input type="text" value="${act.name}" placeholder="Activity name" oninput="Actions.updateName(${act.id}, this.value)">`
        : `<div style="font-size:0.75rem; font-weight:bold; color:var(--primary); padding-left:4px;">${act.name}</div>`;

    const timeCell = (field, mStep) =>
        `<div class="stepper-wrap">` +
        Utils.stepper(act[field].split(':')[0], `Actions.stepTime(${act.id},'${field}','h',1)`,  `Actions.stepTime(${act.id},'${field}','h',-1)`,  'clock-hour', v => Actions.setTimeH(act.id, field, v)) +
        ` : ` +
        Utils.stepper(act[field].split(':')[1], `Actions.stepTime(${act.id},'${field}','m',${mStep})`, `Actions.stepTime(${act.id},'${field}','m',-${mStep})`, 'clock-min',  v => Actions.setTimeM(act.id, field, v)) +
        `</div>`;

    const startFmt = startDt.toFormat('ccc d MMM');
    const endFmt   = act.forever ? '—' : luxon.DateTime.fromISO(endDate).toFormat('ccc d MMM');

    return `<tr data-id="${act.id}" draggable="true"
        ondragstart="DragReorder.start(event,${act.id})"
        ondragover="DragReorder.over(event,${act.id})"
        ondragleave="DragReorder.leave(event)"
        ondrop="DragReorder.drop(event,${act.id})"
        ondragend="DragReorder.end()"
        style="cursor:grab">
        <td style="text-align:left">${nameCell}</td>
        <td>${timeCell('from', 5)}</td>
        <td>${timeCell('to', 5)}</td>
        <td style="white-space:nowrap">${Utils.pickerBtn(dH + 'h', 'dur-hour', dH, v => Actions.setLengthH(act.id, v), 'length-badge')} ${Utils.pickerBtn(String(dM).padStart(2,'0') + 'm', 'dur-min', dM, v => Actions.setLengthM(act.id, v), 'length-badge')}</td>
        <td><div class="stepper-wrap">${Utils.stepper(act.freq, `Actions.stepField(${act.id},'freq',1)`, `Actions.stepField(${act.id},'freq',-1)`, 'day', v => Actions.setField(act.id,'freq',v))} <span class="sub-label-dim" style="margin-left:4px">days</span></div></td>
        <td><button class="cal-trigger" onclick="event.stopPropagation(); Calendar.open(${act.id},'start','${act.start}',this)">${startFmt}</button></td>
        <td><input type="checkbox" style="width:16px;" ${act.forever?'checked':''} onchange="Actions.updateAct(${act.id},'forever',this.checked)"></td>
        <td><button class="cal-trigger" ${act.forever?'disabled':''} style="${act.forever?'opacity:0.35;':''}" onclick="event.stopPropagation(); Calendar.open(${act.id},'end','${endDate}',this)">${endFmt}</button></td>
        <td>${act.forever ? '<span class="length-badge">∞</span>' : Utils.pickerBtn(act.dur + 'd', 'span', act.dur, v => Actions.setSpan(act.id, v), 'length-badge')}</td>
        <td><button style="color:var(--danger); background:none; border:none; cursor:pointer;" onclick="Actions.remove(${act.id})">✖</button></td>
    </tr>`;
}
