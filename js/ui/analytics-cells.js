const C_TOTAL = 'var(--c-total)';
const C_REM   = 'var(--c-rem)';

function renderDataValue(val, color, bold) {
    const cls  = bold ? 'metric-bold' : 'sr-val';
    const sign = val < 0 ? '-' : '';
    const a    = Math.round(Math.abs(val));
    const h    = Math.floor(a / 3600), m = Math.floor((a % 3600) / 60);
    return `<div class="data-subrow">
        <span class="${cls}" style="color:${color}">${sign}${h}</span><span class="sub-label-dim">h</span>
        <span class="${cls}" style="color:${color}">${m}</span><span class="sub-label-dim">m</span>
    </div>`;
}

function renderTargetValue(hField, mField, hPickerType) {
    return `<div class="target-subrow">
        ${Utils.stepper(State.targets[hField], `Actions.stepTarget('${hField}',1)`, `Actions.stepTarget('${hField}',-1)`, hPickerType, v => Actions.setTarget(hField, v))}
        <span class="sub-label-dim">h</span>
        ${Utils.stepper(State.targets[mField], `Actions.stepTarget('${mField}',5)`, `Actions.stepTarget('${mField}',-5)`, 'clock-min', v => Actions.setTarget(mField, v))}
        <span class="sub-label-dim">m</span>
    </div>`;
}
