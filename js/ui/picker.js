const _PickerUI = {
    openPicker: (event, type, currentVal, key) => {
        _skipPickerClose = true;
        const picker = document.getElementById('num-picker');
        let rows = [];
        if (type === 'clock-hour') {
            rows = [Array.from({length:12},(_,i)=>i), Array.from({length:12},(_,i)=>i+12)];
        } else if (type === 'clock-min') {
            rows = Array.from({length:6}, (_,r) => Array.from({length:10}, (_,i) => r*10+i));
        } else if (type === 'day') {
            const nums = Array.from({length:31},(_,i)=>i+1);
            while (nums.length) rows.push(nums.splice(0,7));
        } else if (type === 'total-hour') {
            const nums = Array.from({length: 24 * State.targets.perVal + 1}, (_,i) => i);
            while (nums.length) rows.push(nums.splice(0,12));
        } else if (type === 'rem-hour') {
            const nums = Array.from({length: State.targets.totalH + 1}, (_,i) => i);
            while (nums.length) rows.push(nums.splice(0,12));
        } else if (type === 'dur-hour') {
            rows = [Array.from({length:12},(_,i)=>i), Array.from({length:12},(_,i)=>i+12)];
        } else if (type === 'dur-min') {
            rows = [Array.from({length:12},(_,i)=>i*5)];
        } else if (type === 'span') {
            const nums = Array.from({length:60},(_,i)=>i+1);
            while (nums.length) rows.push(nums.splice(0,10));
        }
        const pad = (type === 'clock-hour' || type === 'clock-min');
        picker.innerHTML = `<div class="pick-grid">${rows.map(row =>
            `<div class="pick-row">${row.map(v =>
                `<button class="pick-btn${v===currentVal?' sel':''}" onclick="UI.selectFromPicker(${v},'${key}')">${pad ? String(v).padStart(2,'0') : v}</button>`
            ).join('')}</div>`
        ).join('')}</div>`;
        picker.style.display = 'block';
        picker.style.top = '-9999px'; picker.style.left = '-9999px';
        const pW = picker.offsetWidth, pH = picker.offsetHeight;
        const rect = event.currentTarget.getBoundingClientRect();
        let top = rect.bottom + 4, left = rect.left;
        if (left + pW > window.innerWidth  - 8) left = window.innerWidth  - pW - 8;
        if (top  + pH > window.innerHeight - 8) top  = rect.top - pH - 4;
        picker.style.top = top + 'px'; picker.style.left = left + 'px';
    },
    selectFromPicker: (val, key) => {
        document.getElementById('num-picker').style.display = 'none';
        if (_pkReg[key]) _pkReg[key](val);
    },
};
