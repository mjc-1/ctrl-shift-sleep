function _actCellName(act) {
    return act.type === 'Custom'
        ? `<input type="text" value="${act.name}" placeholder="Activity name" oninput="Actions.updateName(${act.id}, this.value)" style="min-width:80px;">`
        : `<div style="font-size:0.75rem; font-weight:bold; color:${act.color}; padding:2px 4px; white-space:nowrap;">${act.name}</div>`;
}

function _actCellTime(act, field, mStep) {
    return `<div class="stepper-wrap">` +
        Utils.stepper(act[field].split(':')[0], `Actions.stepTime(${act.id},'${field}','h',1)`,  `Actions.stepTime(${act.id},'${field}','h',-1)`,  'clock-hour', v => Actions.setTimeH(act.id, field, v)) +
        `<span style="color:#475569;margin:0 2px;">:</span>` +
        Utils.stepper(act[field].split(':')[1], `Actions.stepTime(${act.id},'${field}','m',${mStep})`, `Actions.stepTime(${act.id},'${field}','m',-${mStep})`, 'clock-min', v => Actions.setTimeM(act.id, field, v)) +
        `</div>`;
}

function _actCellLength(act) {
    const fromMins = Utils.timeToMins(act.from);
    const toMins   = Utils.timeToMins(act.to);
    let durMins = toMins - fromMins;
    if (durMins <= 0) durMins += 1440;
    const dH = Math.floor(durMins / 60), dM = durMins % 60;
    return `<span style="white-space:nowrap;">` +
        Utils.pickerBtn(dH + 'h', 'dur-hour', dH, v => Actions.setLengthH(act.id, v), 'length-badge') +
        ` ` +
        Utils.pickerBtn(String(dM).padStart(2,'0') + 'm', 'dur-min', dM, v => Actions.setLengthM(act.id, v), 'length-badge') +
        `</span>`;
}

function _actCellEvery(act) {
    return `<div class="stepper-wrap">${Utils.stepper(act.freq, `Actions.stepField(${act.id},'freq',1)`, `Actions.stepField(${act.id},'freq',-1)`, 'day', v => Actions.setField(act.id,'freq',v))}<span class="sub-label-dim" style="margin-left:4px">d</span></div>`;
}

function _actCellStart(act) {
    const startFmt = luxon.DateTime.fromISO(act.start).toFormat('ccc d MMM');
    return `<button class="cal-trigger" onclick="event.stopPropagation(); Calendar.open(${act.id},'start','${act.start}',this)">${startFmt}</button>`;
}

function _actCellForever(act) {
    return `<input type="checkbox" style="width:16px;" ${act.forever?'checked':''} onchange="Actions.updateAct(${act.id},'forever',this.checked)">`;
}

function _actCellEnd(act) {
    const startDt = luxon.DateTime.fromISO(act.start);
    const endDate = startDt.plus({days: act.dur}).toISODate();
    const endFmt  = act.forever ? '—' : luxon.DateTime.fromISO(endDate).toFormat('ccc d MMM');
    return `<button class="cal-trigger" ${act.forever?'disabled':''} style="${act.forever?'opacity:0.35;':''}" onclick="event.stopPropagation(); Calendar.open(${act.id},'end','${endDate}',this)">${endFmt}</button>`;
}

function _actCellSpan(act) {
    return act.forever
        ? '<span class="length-badge">∞</span>'
        : Utils.pickerBtn(act.dur + 'd', 'span', act.dur, v => Actions.setSpan(act.id, v), 'length-badge');
}

function _actCellRemove(act) {
    return `<button style="color:var(--danger); background:none; border:none; cursor:pointer;" onclick="Actions.remove(${act.id})">✖</button>`;
}
