const _pkReg = {};
let _pkN = 0;
let _skipPickerClose = false;

const makeStepper = (val, upCmd, downCmd, pickerType, pickerFn) => {
    let clickAttr = '';
    if (pickerType && pickerFn) {
        const key = 'k' + (++_pkN);
        _pkReg[key] = pickerFn;
        clickAttr = `onclick="UI.openPicker(event,'${pickerType}',${+val},'${key}')" style="cursor:pointer"`;
    }
    return `<div class="custom-stepper">
        <div class="val-display" ${clickAttr}>${val}</div>
        <div class="spin-btns">
            <button class="spin-btn" onclick="${upCmd}">▲</button>
            <button class="spin-btn" onclick="${downCmd}">▼</button>
        </div>
    </div>`;
};

const makePickerBtn = (label, type, currentVal, pickerFn, cls) => {
    const key = 'k' + (++_pkN);
    _pkReg[key] = pickerFn;
    return `<button class="${cls || 'pick-btn'}" onclick="UI.openPicker(event,'${type}',${+currentVal},'${key}')">${label}</button>`;
};
