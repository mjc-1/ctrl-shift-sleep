const Wizard = {
    _step: 0,
    _data: {},
    _pickerCb: null,

    _defaultData() {
        return {
            name: '',
            shiftDaysType: null,
            shiftWeekDays: [],
            shiftCycles: [{ on: 4, off: 3 }],
            shiftHoursType: null,
            shiftHourPatterns: [{ from: '09:00', to: '17:00' }],
            shiftDetailEntries: [{ days: [], from: '09:00', to: '17:00' }],
            bedtimeType: null,
            bedtime: '22:00',
            bedtimeOffsetH: 1, bedtimeOffsetM: 30,
            onsetType: null,
            onsetH: 0, onsetM: 20,
            wakeType: null,
            wakeTime: '06:30',
            wakeDurationH: 8, wakeDurationM: 0,
            sleepBareH: 5,  sleepBareM: 0,
            sleepOkH:   7,  sleepOkM:   0,
            sleepGoodH: 8,  sleepGoodM: 30,
            extraActivities: [],
            customActivities: [],
            days: 14,
        };
    },

    // ── Step definitions ──────────────────────────────────────────────────

    _steps: [

        // 0 — Name
        {
            title: 'My name is…',
            subtitle: 'We\'ll use this to label your plan.',
            render(data) {
                return `
                    <label class="wiz-label">Your name</label>
                    <input class="wiz-input" id="wiz-name" type="text"
                           value="${data.name}" placeholder="e.g. Alex"
                           autocomplete="given-name"
                           onkeydown="if(event.key==='Enter'){event.preventDefault();Wizard._next();}">
                `;
            },
            validate() {
                const v = document.getElementById('wiz-name')?.value.trim();
                return v || null;
            },
            save(val, data) { data.name = val; },
        },

        // 1 — Shift days
        {
            title: 'My shift days are…',
            subtitle: '',
            render(data) {
                if (!data.shiftDaysType) {
                    return `
                        <div class="wiz-presets" style="flex-direction:column;">
                            <button class="wiz-preset" onclick="Wizard._pickShiftDaysType('weekly')">The same every week</button>
                            <button class="wiz-preset" onclick="Wizard._pickShiftDaysType('cycle')">On a regular cycle</button>
                            <button class="wiz-preset" onclick="Wizard._pickShiftDaysType('variable')">Variable</button>
                        </div>
                    `;
                }
                return Wizard._shiftDaysSubScreen(data);
            },
            validate() {
                const d = Wizard._data;
                if (!d.shiftDaysType) return null;
                if (d.shiftDaysType === 'weekly' && d.shiftWeekDays.length === 0) return null;
                return {};
            },
            save() {},
        },

        // 2 — Shift hours
        {
            title: 'My hours are…',
            subtitle: '',
            render(data) {
                if (!data.shiftHoursType) {
                    return `
                        <div class="wiz-presets" style="flex-direction:column;">
                            <button class="wiz-preset" onclick="Wizard._pickShiftHoursType('same')">The same every shift</button>
                            <button class="wiz-preset" onclick="Wizard._pickShiftHoursType('cycle')">On a regular cycle</button>
                            <button class="wiz-preset" onclick="Wizard._pickShiftHoursType('variable')">Variable</button>
                        </div>
                    `;
                }
                return Wizard._shiftHoursSubScreen(data);
            },
            validate() {
                const d = Wizard._data;
                if (!d.shiftHoursType) return null;
                if (d.shiftHoursType === 'same') {
                    const p = d.shiftHourPatterns[0];
                    return (p && p.from && p.to) ? {} : null;
                }
                return {};
            },
            save() {},
        },

        // 3 — Shift detail [shown only if days or hours is variable]
        {
            title: 'My shifts',
            subtitle: 'Add your usual shifts — you can adjust them later.',
            skip(data) {
                return !(data.shiftDaysType === 'variable' || data.shiftHoursType === 'variable');
            },
            render(data) {
                const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
                const rows = data.shiftDetailEntries.map((e, i) => {
                    const days = DAY_LABELS.map((lbl, d) => {
                        const active = e.days.includes(d);
                        return `<button class="wiz-preset wiz-day-btn${active ? ' active' : ''}" onclick="Wizard._toggleShiftDay(${i},${d})">${lbl}</button>`;
                    }).join('');
                    const canRemove = data.shiftDetailEntries.length > 1;
                    return `
                        <div class="wiz-shift-entry">
                            <div class="wiz-presets" style="gap:4px; margin-bottom:8px;">${days}</div>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <button class="wiz-val-btn" onclick="Wizard._pickDetailFrom(event,${i})">${e.from}</button>
                                <span class="wiz-time-sep">→</span>
                                <button class="wiz-val-btn" onclick="Wizard._pickDetailTo(event,${i})">${e.to}</button>
                                ${canRemove ? `<button class="wiz-remove-btn" onclick="Wizard._removeShiftEntry(${i})">✕</button>` : ''}
                            </div>
                        </div>
                    `;
                }).join('');
                return `
                    ${rows}
                    <button class="wiz-preset wiz-add-row" onclick="Wizard._addShiftEntry()">+ Add shift</button>
                `;
            },
            validate() { return {}; },
            save() {},
        },

        // 4 — Bedtime
        {
            title: 'I normally go to bed…',
            subtitle: '',
            render(data) {
                if (!data.bedtimeType) {
                    return `
                        <div class="wiz-presets" style="flex-direction:column;">
                            <button class="wiz-preset" onclick="Wizard._pickBedtimeType('fixed')">At the same time every day</button>
                            <button class="wiz-preset" onclick="Wizard._pickBedtimeType('after-shift')">The same length of time after every shift</button>
                            <button class="wiz-preset" onclick="Wizard._pickBedtimeType('variable')">Variably</button>
                        </div>
                    `;
                }
                return Wizard._bedtimeSubScreen(data);
            },
            validate() { return Wizard._data.bedtimeType ? {} : null; },
            save() {},
        },

        // 5 — Sleep onset
        {
            title: 'Falling asleep normally takes me…',
            subtitle: '',
            render(data) {
                if (!data.onsetType) {
                    return `
                        <div class="wiz-presets" style="flex-direction:column;">
                            <button class="wiz-preset" onclick="Wizard._pickOnsetType('fixed')">About the same length of time every time</button>
                            <button class="wiz-preset" onclick="Wizard._pickOnsetType('variable')">Variably</button>
                        </div>
                    `;
                }
                return Wizard._onsetSubScreen(data);
            },
            validate() { return Wizard._data.onsetType ? {} : null; },
            save() {},
        },

        // 6 — Wake time
        {
            title: 'I normally wake up…',
            subtitle: '',
            render(data) {
                if (!data.wakeType) {
                    return `
                        <div class="wiz-presets" style="flex-direction:column;">
                            <button class="wiz-preset" onclick="Wizard._pickWakeType('fixed')">At the same time every day</button>
                            <button class="wiz-preset" onclick="Wizard._pickWakeType('after-duration')">After the same number of hours sleep every time</button>
                            <button class="wiz-preset" onclick="Wizard._pickWakeType('variable')">Variably</button>
                        </div>
                    `;
                }
                return Wizard._wakeSubScreen(data);
            },
            validate() { return Wizard._data.wakeType ? {} : null; },
            save() {},
        },

        // 7 — Sleep needs
        {
            title: 'How much sleep do you need?',
            subtitle: 'This sets your sleep targets in the analytics.',
            render(data) {
                const cols = [
                    { label: 'barely\nfunctional', hKey: 'sleepBareH', mKey: 'sleepBareM' },
                    { label: 'getting\nby',         hKey: 'sleepOkH',   mKey: 'sleepOkM'   },
                    { label: 'comfortable',         hKey: 'sleepGoodH', mKey: 'sleepGoodM' },
                ];
                const cells = cols.map(c => `
                    <div class="wiz-sleep-col">
                        <div class="wiz-sleep-col-label">${c.label.replace('\n', '<br>')}</div>
                        <div class="wiz-sleep-pickers">
                            <button class="wiz-val-btn" onclick="Wizard._pickNeedH(event,'${c.hKey}')">${data[c.hKey]}h</button>
                            <button class="wiz-val-btn" onclick="Wizard._pickNeedM(event,'${c.mKey}')">${data[c.mKey]}m</button>
                        </div>
                    </div>`).join('');
                const wMins = (data.sleepGoodH * 60 + data.sleepGoodM) * 7;
                const wkH = Math.floor(wMins / 60), wkM = wMins % 60;
                return `
                    <div class="wiz-sleep-cols">${cells}</div>
                    <p class="wiz-weekly" id="wiz-weekly">Comfortable: ${wkH}h${wkM ? ' ' + wkM + 'm' : ''} per week.</p>
                `;
            },
            validate() {
                const d = Wizard._data;
                return { bareH: d.sleepBareH, bareM: d.sleepBareM, okH: d.sleepOkH, okM: d.sleepOkM, goodH: d.sleepGoodH, goodM: d.sleepGoodM };
            },
            save(val, data) {
                Object.assign(data, { sleepBareH: val.bareH, sleepBareM: val.bareM, sleepOkH: val.okH, sleepOkM: val.okM, sleepGoodH: val.goodH, sleepGoodM: val.goodM });
            },
        },

        // 8 — Activities
        {
            title: 'What else is important to you?',
            subtitle: 'Select anything you\'d like on your plan — you can always add more later.',
            render(data) {
                const opts = [
                    { type: 'Commute',  label: '🚌 Commute' },
                    { type: 'Exercise', label: '🏋️ Exercise' },
                    { type: 'Family',   label: '🫂 People time' },
                ];
                const btns = opts.map(o => {
                    const active = data.extraActivities.includes(o.type);
                    return `<button class="wiz-preset${active ? ' active' : ''}" data-type="${o.type}"
                                    onclick="Wizard._toggleActivity('${o.type}')">${o.label}</button>`;
                }).join('');
                const customRows = data.customActivities.map((name, i) => `
                    <div class="wiz-custom-row">
                        <input class="wiz-input wiz-custom-input" type="text" value="${name}"
                               placeholder="Activity name…"
                               oninput="Wizard._updateCustom(${i}, this.value)"
                               onkeydown="if(event.key==='Enter'){event.preventDefault();Wizard._addCustom();}">
                        <button class="wiz-remove-btn" onclick="Wizard._removeCustom(${i})">✕</button>
                    </div>`).join('');
                return `
                    <div class="wiz-presets">${btns}</div>
                    ${customRows}
                    <div style="margin-top:10px;">
                        <button class="wiz-preset" onclick="Wizard._addCustom()">✏️ Something else</button>
                    </div>
                `;
            },
            validate() {
                return { types: Wizard._data.extraActivities, customs: Wizard._data.customActivities.filter(Boolean) };
            },
            save(val, data) {
                data.extraActivities  = val.types;
                data.customActivities = val.customs;
            },
        },

        // 9 — Planning horizon
        {
            title: 'Planning horizon',
            subtitle: 'How many days ahead would you like to plan?',
            render(data) {
                const presets = [7, 14, 28, 90];
                const btns = presets.map(n =>
                    `<button class="wiz-preset${data.days === n ? ' active' : ''}" data-days="${n}"
                             onclick="Wizard._pickDays(${n})">${n} days</button>`
                ).join('');
                return `
                    <div class="wiz-presets">${btns}</div>
                    <label class="wiz-label" style="margin-top:16px; display:block;">Or enter a custom number</label>
                    <input class="wiz-input" id="wiz-days" type="number" value="${data.days}"
                           min="1" max="365" style="width:100px;"
                           oninput="Wizard._pickDays(parseInt(this.value)||0)"
                           onkeydown="if(event.key==='Enter'){event.preventDefault();Wizard._next();}">
                `;
            },
            validate() {
                const v = parseInt(document.getElementById('wiz-days')?.value, 10);
                return (v >= 1 && v <= 365) ? v : null;
            },
            save(val, data) { data.days = val; },
        },
    ],

    // ── Lifecycle ─────────────────────────────────────────────────────────

    maybeShow() {
        if (localStorage.getItem('sleepapp_show_on_reload')) { this.show(); return; }
        if (localStorage.getItem('sleepapp_wizard_done')) return;
        if (localStorage.getItem('sleepapp_name'))        return;
        if (localStorage.getItem('sleep-planner-slots'))  return;
        this.show();
    },

    show() {
        this._step = 0;
        this._data = this._defaultData();
        const overlay = document.getElementById('wizard-overlay');
        overlay.style.display = 'flex';
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                overlay.classList.add('wiz-visible');
                this._renderContent(true);
            });
        });
    },

    hide() {
        this._closePicker();
        const overlay = document.getElementById('wizard-overlay');
        overlay.classList.remove('wiz-visible');
        setTimeout(() => { overlay.style.display = 'none'; }, 320);
    },

    // ── Rendering ─────────────────────────────────────────────────────────

    _renderContent(initial) {
        this._closePicker();
        const step    = this._steps[this._step];
        const visible = this._steps.map((s, i) => i).filter(i => !this._steps[i].skip?.(this._data));
        const visIdx  = visible.indexOf(this._step);
        const isFirst = visIdx === 0;
        const isLast  = visIdx === visible.length - 1;
        const dots    = visible.map((_, vi) =>
            `<span class="wiz-dot${vi === visIdx ? ' active' : ''}"></span>`
        ).join('');
        const base   = initial ? 320 : 0;
        const d      = extra => `animation-delay:${base + extra}ms`;
        const hasSub = !!step.subtitle;

        const showPreview = this._step >= 1;
        document.getElementById('wizard-card').innerHTML = `
            <div id="wiz-content">
                <img src="icons/logo.png" class="wiz-logo" alt="" loading="eager" onerror="this.style.display='none'">
                <div class="wiz-dots"  style="${d(0)}">${dots}</div>
                <h2 class="wiz-title"  style="${d(120)}">${step.title}</h2>
                ${hasSub ? `<p class="wiz-subtitle" style="${d(220)}">${step.subtitle}</p>` : ''}
                <div class="wiz-body"  style="${d(hasSub ? 380 : 260)}">${step.render(this._data)}</div>
                ${showPreview ? `<div class="wiz-preview" style="${d(hasSub ? 460 : 340)}"><canvas id="wiz-preview-canvas" class="wiz-preview-canvas"></canvas></div>` : ''}
                <div class="wiz-nav"   style="${d(hasSub ? 560 : 440)}">
                    <button class="wiz-btn-sec" onclick="Wizard._back()"
                            ${isFirst ? 'style="visibility:hidden"' : ''}>&#8592; Back</button>
                    <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
                        <button class="wiz-btn-pri" onclick="Wizard._next()">
                            ${isLast ? 'Get started &#8594;' : 'Next &#8594;'}
                        </button>
                        <div style="display:flex; gap:14px;">
                            ${!isLast ? `<button class="wiz-btn-skip" onclick="Wizard._skipStep()">Skip this step</button>` : ''}
                            <button class="wiz-btn-skip" onclick="Wizard._skip()">Skip all</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        requestAnimationFrame(() => this._drawPreview());

        setTimeout(() => {
            const first = document.querySelector('#wizard-card input:not([type=number])') ||
                          document.querySelector('#wizard-card input');
            if (first) first.focus();
        }, base + 430);
    },

    _rerenderBody() {
        const body = document.querySelector('#wiz-content .wiz-body');
        if (body) body.innerHTML = this._steps[this._step].render(this._data);
        requestAnimationFrame(() => this._drawPreview());
    },

    _drawPreview() {
        const canvas = document.getElementById('wiz-preview-canvas');
        if (canvas && typeof WizardPreview !== 'undefined') WizardPreview.draw(canvas, this._data);
    },

    // ── Navigation ────────────────────────────────────────────────────────

    _next() {
        this._closePicker();
        const step = this._steps[this._step];
        const val  = step.validate();
        if (val === null) {
            const content = document.getElementById('wiz-content');
            if (content) {
                content.classList.remove('wiz-shake');
                void content.offsetWidth;
                content.classList.add('wiz-shake');
            }
            return;
        }
        step.save(val, this._data);
        let next = this._step + 1;
        while (next < this._steps.length && this._steps[next].skip?.(this._data)) next++;
        if (next < this._steps.length) {
            this._transition(() => { this._step = next; this._renderContent(false); });
        } else {
            this._transition(() => this._finish());
        }
    },

    _back() {
        this._closePicker();
        if (this._step === 0) return;
        let prev = this._step - 1;
        while (prev > 0 && this._steps[prev].skip?.(this._data)) prev--;
        this._transition(() => { this._step = prev; this._renderContent(false); });
    },

    _skipStep() {
        this._closePicker();
        let next = this._step + 1;
        while (next < this._steps.length && this._steps[next].skip?.(this._data)) next++;
        if (next < this._steps.length) {
            this._transition(() => { this._step = next; this._renderContent(false); });
        } else {
            this._transition(() => this._finish());
        }
    },

    _transition(callback) {
        this._closePicker();
        const content = document.getElementById('wiz-content');
        if (content) {
            content.style.animation = 'wiz-fade-out 0.18s ease forwards';
            setTimeout(callback, 180);
        } else {
            callback();
        }
    },

    // ── Picker ────────────────────────────────────────────────────────────

    _openPicker(event, items, currentVal, onPick) {
        event.stopPropagation();
        this._pickerCb = onPick;
        const btn  = event.currentTarget;
        const rect = btn.getBoundingClientRect();

        const el = document.getElementById('wiz-picker');
        el.innerHTML = `<div class="wiz-pick-wrap">${items.map(o => {
            const active = String(o.val) === String(currentVal);
            const v = typeof o.val === 'string' ? `'${o.val}'` : o.val;
            return `<button class="wiz-pick-btn${active ? ' active' : ''}" onclick="Wizard._pickVal(${v})">${o.label}</button>`;
        }).join('')}</div>`;

        el.style.display = 'block';
        el.style.top  = '0px';
        el.style.left = '0px';

        requestAnimationFrame(() => {
            const pw = el.offsetWidth;
            const ph = el.offsetHeight;
            let top  = rect.bottom + 6;
            let left = rect.left;
            if (left + pw > window.innerWidth)  left = Math.max(8, window.innerWidth  - pw - 8);
            if (top  + ph > window.innerHeight) top  = rect.top - ph - 6;
            el.style.top  = top  + 'px';
            el.style.left = left + 'px';
            requestAnimationFrame(() => {
                const active = el.querySelector('.wiz-pick-btn.active');
                if (active) active.scrollIntoView({ block: 'center', behavior: 'instant' });
            });
        });
    },

    _pickVal(val) {
        if (this._pickerCb) this._pickerCb(val);
        this._pickerCb = null;
        document.getElementById('wiz-picker').style.display = 'none';
    },

    _closePicker() {
        const el = document.getElementById('wiz-picker');
        if (el) el.style.display = 'none';
        this._pickerCb = null;
    },

    // ── Item helpers ──────────────────────────────────────────────────────

    _timeItems() {
        const items = [];
        for (let h = 0; h < 24; h++) {
            for (const m of [0, 15, 30, 45]) {
                const hh = String(h).padStart(2, '0');
                const mm = String(m).padStart(2, '0');
                items.push({ val: `${hh}:${mm}`, label: `${hh}:${mm}` });
            }
        }
        return items;
    },

    _freqLabel(freq) {
        return freq === 1 ? 'every day' : `every ${freq} days`;
    },

    // ── Shift days ────────────────────────────────────────────────────────

    _shiftDaysSubScreen(data) {
        const t    = data.shiftDaysType;
        const back = `<button class="wiz-change-btn" onclick="Wizard._pickShiftDaysType(null)">&#8592; Change answer</button>`;
        const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        if (t === 'weekly') {
            const days = DAY_LABELS.map((lbl, i) => {
                const active = data.shiftWeekDays.includes(i);
                return `<button class="wiz-preset${active ? ' active' : ''}" data-day="${i}" onclick="Wizard._toggleWeekDay(${i})">${lbl}</button>`;
            }).join('');
            return `<div class="wiz-presets">${days}</div>${back}`;
        }

        if (t === 'cycle') {
            const rows = data.shiftCycles.map((c, i) => {
                const canRemove = data.shiftCycles.length > 1;
                return `
                    <div class="wiz-sched-row" style="align-items:center;">
                        <button class="wiz-val-btn" onclick="Wizard._pickCycleOn(event,${i})">${c.on}</button>
                        <span class="wiz-time-sep">on,</span>
                        <button class="wiz-val-btn" onclick="Wizard._pickCycleOff(event,${i})">${c.off}</button>
                        <span class="wiz-time-sep">off</span>
                        ${canRemove ? `<button class="wiz-remove-btn" onclick="Wizard._removeCycle(${i})">✕</button>` : ''}
                    </div>
                `;
            }).join('');
            return `${rows}<button class="wiz-preset wiz-add-row" onclick="Wizard._addCycle()">+ Add cycle</button>${back}`;
        }

        if (t === 'variable') {
            return `<p class="wiz-work-msg">You can set up specific days in the Activities section once you're in the planner.</p>${back}`;
        }

        return '';
    },

    _pickShiftDaysType(type) {
        this._data.shiftDaysType = type;
        if (type === 'variable') { this._next(); } else { this._rerenderBody(); }
    },

    _toggleWeekDay(idx) {
        const days = this._data.shiftWeekDays;
        const pos  = days.indexOf(idx);
        if (pos === -1) days.push(idx); else days.splice(pos, 1);
        this._rerenderBody();
    },

    _addCycle() {
        this._data.shiftCycles.push({ on: 4, off: 3 });
        this._rerenderBody();
    },

    _removeCycle(idx) {
        if (this._data.shiftCycles.length > 1) { this._data.shiftCycles.splice(idx, 1); this._rerenderBody(); }
    },

    _pickCycleOn(event, idx) {
        const items = Array.from({ length: 28 }, (_, i) => ({ val: i + 1, label: String(i + 1) }));
        this._openPicker(event, items, this._data.shiftCycles[idx].on, val => {
            this._data.shiftCycles[idx].on = val; this._rerenderBody();
        });
    },

    _pickCycleOff(event, idx) {
        const items = Array.from({ length: 28 }, (_, i) => ({ val: i + 1, label: String(i + 1) }));
        this._openPicker(event, items, this._data.shiftCycles[idx].off, val => {
            this._data.shiftCycles[idx].off = val; this._rerenderBody();
        });
    },

    // ── Shift hours ───────────────────────────────────────────────────────

    _shiftHoursSubScreen(data) {
        const t    = data.shiftHoursType;
        const back = `<button class="wiz-change-btn" onclick="Wizard._pickShiftHoursType(null)">&#8592; Change answer</button>`;

        if (t === 'same') {
            const showAdd = data.shiftDaysType === 'cycle';
            const rows = data.shiftHourPatterns.map((p, i) => {
                const canRemove = data.shiftHourPatterns.length > 1;
                const lbl = v => i === 0
                    ? `<label class="wiz-label">${v}</label>`
                    : `<label class="wiz-label" style="visibility:hidden">x</label>`;
                const sepStyle = i === 0 ? '' : 'margin-top:22px;';
                return `
                    <div class="wiz-sched-row">
                        <div class="wiz-sched-cell">
                            ${lbl('Start')}
                            <button class="wiz-val-btn" onclick="Wizard._pickShiftFrom(event,${i})">${p.from}</button>
                        </div>
                        <span class="wiz-time-sep" style="${sepStyle}">→</span>
                        <div class="wiz-sched-cell">
                            ${lbl('End')}
                            <button class="wiz-val-btn" onclick="Wizard._pickShiftTo(event,${i})">${p.to}</button>
                        </div>
                        ${canRemove
                            ? `<button class="wiz-remove-btn" style="${i === 0 ? 'margin-top:22px;' : ''}" onclick="Wizard._removeHourPattern(${i})">✕</button>`
                            : `<span style="width:36px;flex-shrink:0;"></span>`}
                    </div>
                `;
            }).join('');
            return `
                ${rows}
                ${showAdd ? `<button class="wiz-preset wiz-add-row" onclick="Wizard._addHourPattern()">+ Add pattern</button>` : ''}
                ${back}
            `;
        }

        if (t === 'cycle') {
            return `<p class="wiz-work-msg">Different hours for each part of your cycle — you can set this up in the Activities section once you're in the planner.</p>${back}`;
        }

        return '';
    },

    _pickShiftHoursType(type) {
        this._data.shiftHoursType = type;
        if (type === 'variable') { this._next(); } else { this._rerenderBody(); }
    },

    _pickShiftFrom(event, idx) {
        this._openPicker(event, this._timeItems(), this._data.shiftHourPatterns[idx].from, val => {
            this._data.shiftHourPatterns[idx].from = val; this._rerenderBody();
        });
    },

    _pickShiftTo(event, idx) {
        this._openPicker(event, this._timeItems(), this._data.shiftHourPatterns[idx].to, val => {
            this._data.shiftHourPatterns[idx].to = val; this._rerenderBody();
        });
    },

    _addHourPattern() {
        this._data.shiftHourPatterns.push({ from: '09:00', to: '17:00' });
        this._rerenderBody();
    },

    _removeHourPattern(idx) {
        if (this._data.shiftHourPatterns.length > 1) {
            this._data.shiftHourPatterns.splice(idx, 1); this._rerenderBody();
        }
    },

    // ── Shift detail ──────────────────────────────────────────────────────

    _toggleShiftDay(entryIdx, dayIdx) {
        const days = this._data.shiftDetailEntries[entryIdx].days;
        const pos  = days.indexOf(dayIdx);
        if (pos === -1) days.push(dayIdx); else days.splice(pos, 1);
        this._rerenderBody();
    },

    _addShiftEntry() {
        this._data.shiftDetailEntries.push({ days: [], from: '09:00', to: '17:00' });
        this._rerenderBody();
    },

    _removeShiftEntry(idx) {
        if (this._data.shiftDetailEntries.length > 1) {
            this._data.shiftDetailEntries.splice(idx, 1); this._rerenderBody();
        }
    },

    _pickDetailFrom(event, idx) {
        this._openPicker(event, this._timeItems(), this._data.shiftDetailEntries[idx].from, val => {
            this._data.shiftDetailEntries[idx].from = val; this._rerenderBody();
        });
    },

    _pickDetailTo(event, idx) {
        this._openPicker(event, this._timeItems(), this._data.shiftDetailEntries[idx].to, val => {
            this._data.shiftDetailEntries[idx].to = val; this._rerenderBody();
        });
    },

    // ── Bedtime ───────────────────────────────────────────────────────────

    _bedtimeSubScreen(data) {
        const t    = data.bedtimeType;
        const back = `<button class="wiz-change-btn" onclick="Wizard._pickBedtimeType(null)">&#8592; Change answer</button>`;

        if (t === 'fixed') {
            return `
                <div class="wiz-sched-row" style="align-items:flex-end;">
                    <div class="wiz-sched-cell">
                        <label class="wiz-label">Bedtime</label>
                        <button class="wiz-val-btn" onclick="Wizard._pickBedtime(event)">${data.bedtime}</button>
                    </div>
                </div>
                ${back}
            `;
        }

        if (t === 'after-shift') {
            return `
                <div class="wiz-sched-row" style="align-items:flex-end;">
                    <div class="wiz-sched-cell">
                        <label class="wiz-label">After shift ends</label>
                        <div style="display:flex; gap:4px;">
                            <button class="wiz-val-btn" onclick="Wizard._pickBedOffH(event)">${data.bedtimeOffsetH}h</button>
                            <button class="wiz-val-btn" onclick="Wizard._pickBedOffM(event)">${data.bedtimeOffsetM}m</button>
                        </div>
                    </div>
                </div>
                ${back}
            `;
        }

        return '';
    },

    _pickBedtimeType(type) {
        this._data.bedtimeType = type;
        if (type === 'variable') { this._next(); } else { this._rerenderBody(); }
    },

    _pickBedtime(event) {
        this._openPicker(event, this._timeItems(), this._data.bedtime, val => {
            this._data.bedtime = val; this._rerenderBody();
        });
    },

    _pickBedOffH(event) {
        const items = Array.from({ length: 9 }, (_, i) => ({ val: i, label: `${i}h` }));
        this._openPicker(event, items, this._data.bedtimeOffsetH, val => {
            this._data.bedtimeOffsetH = val; this._rerenderBody();
        });
    },

    _pickBedOffM(event) {
        const items = Array.from({ length: 12 }, (_, i) => ({ val: i * 5, label: `${i * 5}m` }));
        this._openPicker(event, items, this._data.bedtimeOffsetM, val => {
            this._data.bedtimeOffsetM = val; this._rerenderBody();
        });
    },

    // ── Sleep onset ───────────────────────────────────────────────────────

    _onsetSubScreen(data) {
        const back = `<button class="wiz-change-btn" onclick="Wizard._pickOnsetType(null)">&#8592; Change answer</button>`;
        return `
            <div class="wiz-sched-row" style="align-items:flex-end;">
                <div class="wiz-sched-cell">
                    <label class="wiz-label">Time to fall asleep</label>
                    <div style="display:flex; gap:4px;">
                        <button class="wiz-val-btn" onclick="Wizard._pickOnsetH(event)">${data.onsetH}h</button>
                        <button class="wiz-val-btn" onclick="Wizard._pickOnsetM(event)">${data.onsetM}m</button>
                    </div>
                </div>
            </div>
            ${back}
        `;
    },

    _pickOnsetType(type) {
        this._data.onsetType = type;
        if (type === 'variable') { this._next(); } else { this._rerenderBody(); }
    },

    _pickOnsetH(event) {
        const items = Array.from({ length: 4 }, (_, i) => ({ val: i, label: `${i}h` }));
        this._openPicker(event, items, this._data.onsetH, val => {
            this._data.onsetH = val; this._rerenderBody();
        });
    },

    _pickOnsetM(event) {
        const items = Array.from({ length: 12 }, (_, i) => ({ val: i * 5, label: `${i * 5}m` }));
        this._openPicker(event, items, this._data.onsetM, val => {
            this._data.onsetM = val; this._rerenderBody();
        });
    },

    // ── Wake time ─────────────────────────────────────────────────────────

    _wakeSubScreen(data) {
        const t    = data.wakeType;
        const back = `<button class="wiz-change-btn" onclick="Wizard._pickWakeType(null)">&#8592; Change answer</button>`;

        if (t === 'fixed') {
            return `
                <div class="wiz-sched-row" style="align-items:flex-end;">
                    <div class="wiz-sched-cell">
                        <label class="wiz-label">Wake time</label>
                        <button class="wiz-val-btn" onclick="Wizard._pickWakeTime(event)">${data.wakeTime}</button>
                    </div>
                </div>
                ${back}
            `;
        }

        if (t === 'after-duration') {
            return `
                <div class="wiz-sched-row" style="align-items:flex-end;">
                    <div class="wiz-sched-cell">
                        <label class="wiz-label">Sleep duration</label>
                        <div style="display:flex; gap:4px; align-items:center;">
                            <button class="wiz-val-btn" onclick="Wizard._pickWakeDurH(event)">${data.wakeDurationH}h</button>
                            <button class="wiz-val-btn" onclick="Wizard._pickWakeDurM(event)">${data.wakeDurationM}m</button>
                        </div>
                    </div>
                </div>
                ${back}
            `;
        }

        return '';
    },

    _pickWakeType(type) {
        this._data.wakeType = type;
        if (type === 'variable') { this._next(); } else { this._rerenderBody(); }
    },

    _pickWakeTime(event) {
        this._openPicker(event, this._timeItems(), this._data.wakeTime, val => {
            this._data.wakeTime = val; this._rerenderBody();
        });
    },

    _pickWakeDurH(event) {
        const items = Array.from({ length: 15 }, (_, i) => ({ val: i, label: `${i}h` }));
        this._openPicker(event, items, this._data.wakeDurationH, val => {
            this._data.wakeDurationH = val; this._rerenderBody();
        });
    },

    _pickWakeDurM(event) {
        const items = Array.from({ length: 12 }, (_, i) => ({ val: i * 5, label: `${i * 5}m` }));
        this._openPicker(event, items, this._data.wakeDurationM, val => {
            this._data.wakeDurationM = val; this._rerenderBody();
        });
    },

    // ── Sleep needs ───────────────────────────────────────────────────────

    _pickNeedH(event, key) {
        const items = Array.from({ length: 25 }, (_, h) => ({ val: h, label: `${h}h` }));
        this._openPicker(event, items, this._data[key], val => {
            this._data[key] = val; this._rerenderBody();
        });
    },

    _pickNeedM(event, key) {
        const items = Array.from({ length: 12 }, (_, i) => ({ val: i * 5, label: `${i * 5}m` }));
        this._openPicker(event, items, this._data[key], val => {
            this._data[key] = val; this._rerenderBody();
        });
    },

    // ── Activities ────────────────────────────────────────────────────────

    _toggleActivity(type) {
        const idx = this._data.extraActivities.indexOf(type);
        if (idx === -1) this._data.extraActivities.push(type);
        else            this._data.extraActivities.splice(idx, 1);
        document.querySelectorAll('.wiz-preset[data-type]').forEach(b => {
            b.classList.toggle('active', this._data.extraActivities.includes(b.dataset.type));
        });
    },

    _addCustom() {
        this._data.customActivities.push('');
        this._rerenderBody();
        const inputs = document.querySelectorAll('.wiz-custom-input');
        if (inputs.length) inputs[inputs.length - 1].focus();
    },

    _removeCustom(i) {
        this._data.customActivities.splice(i, 1);
        this._rerenderBody();
    },

    _updateCustom(i, val) {
        this._data.customActivities[i] = val;
    },

    // ── Planning horizon ──────────────────────────────────────────────────

    _pickDays(n) {
        this._data.days = n;
        const inp = document.getElementById('wiz-days');
        if (inp && parseInt(inp.value) !== n) inp.value = n > 0 ? n : '';
        document.querySelectorAll('.wiz-preset[data-days]').forEach(b => {
            b.classList.toggle('active', parseInt(b.dataset.days) === n);
        });
    },

    // ── Finish ────────────────────────────────────────────────────────────

    _finish() {
        const d = this._data;
        History.push();

        // Name
        localStorage.setItem('sleepapp_name', d.name);
        const nameEl = document.getElementById('plan-name');
        if (nameEl) nameEl.value = d.name;

        // Compute sleep from/to
        let sleepFrom = '22:00';
        if (d.bedtimeType === 'fixed') {
            sleepFrom = d.bedtime;
        } else if (d.bedtimeType === 'after-shift' && d.shiftHourPatterns[0]?.to) {
            const endMins = Utils.timeToMins(d.shiftHourPatterns[0].to);
            sleepFrom = Utils.minsToTime((endMins + d.bedtimeOffsetH * 60 + d.bedtimeOffsetM) % 1440);
        }

        let sleepTo = '06:30';
        if (d.wakeType === 'fixed') {
            sleepTo = d.wakeTime;
        } else if (d.wakeType === 'after-duration') {
            const bedMins    = Utils.timeToMins(sleepFrom);
            const onsetMins  = d.onsetType === 'fixed' ? d.onsetH * 60 + d.onsetM : 0;
            sleepTo = Utils.minsToTime((bedMins + onsetMins + d.wakeDurationH * 60 + d.wakeDurationM) % 1440);
        }

        const sleep = State.activities.find(a => a.type === 'Sleep');
        if (sleep) {
            sleep.from = sleepFrom; sleep.to = sleepTo;
        } else {
            State.activities.push({ id: Date.now(), name: 'Sleep', color: '#818cf8', type: 'Sleep', from: sleepFrom, to: sleepTo, freq: 1, start: State.viewStart.toISODate(), dur: 365, forever: true });
        }

        // Sleep needs
        State.targets.totalH = d.sleepGoodH;
        State.targets.totalM = d.sleepGoodM;
        State.targets.perVal = 1;

        // Work activity — apply hours from wizard data
        const workFrom = d.shiftHoursType === 'same' && d.shiftHourPatterns[0]
            ? d.shiftHourPatterns[0].from
            : d.shiftDetailEntries[0]?.from;
        const workTo = d.shiftHoursType === 'same' && d.shiftHourPatterns[0]
            ? d.shiftHourPatterns[0].to
            : d.shiftDetailEntries[0]?.to;
        if (workFrom && workTo && d.shiftDaysType !== null && d.shiftHoursType !== null) {
            const work = State.activities.find(a => a.type === 'Work');
            if (work) { work.from = workFrom; work.to = workTo; }
        }

        // Extra activities
        const _defs = {
            Exercise: { name: 'Exercise',    color: '#22d3ee', from: '07:00', to: '08:00' },
            Family:   { name: 'People time', color: '#ec4899', from: '17:00', to: '18:30' },
        };
        d.extraActivities.forEach(type => {
            if (type === 'Commute') {
                const work = State.activities.find(a => a.type === 'Work');
                if (work) {
                    const wFrom = Utils.timeToMins(work.from), wTo = Utils.timeToMins(work.to);
                    State.activities.push(
                        { id: Date.now(),     name: 'Commute', color: '#f97316', type: 'Commute', start: State.viewStart.toISODate(), from: Utils.minsToTime(wFrom - 30), to: work.from,            freq: 1, dur: 7, forever: true },
                        { id: Date.now() + 1, name: 'Commute', color: '#f97316', type: 'Commute', start: State.viewStart.toISODate(), from: work.to, to: Utils.minsToTime(wTo + 30),               freq: 1, dur: 7, forever: true }
                    );
                } else {
                    State.activities.push({ id: Date.now(), name: 'Commute', color: '#f97316', type: 'Commute', start: State.viewStart.toISODate(), from: '08:30', to: '09:00', freq: 1, dur: 7, forever: true });
                }
            } else {
                const def = _defs[type];
                if (def) State.activities.push({ id: Date.now() + Math.random(), type, freq: 1, dur: 7, start: State.viewStart.toISODate(), forever: true, ...def });
            }
        });

        // Custom activities
        d.customActivities.filter(Boolean).forEach(name => {
            State.activities.push({ id: Date.now() + Math.random(), name, type: 'Custom', color: '#10b981', from: '19:00', to: '20:00', freq: 1, dur: 7, start: State.viewStart.toISODate(), forever: true });
        });

        // Planning horizon
        State.totalDays = d.days;

        localStorage.setItem('sleepapp_wizard_done', '1');
        localStorage.removeItem('sleepapp_show_on_reload');
        const _reloadChk = document.getElementById('intro-on-reload');
        if (_reloadChk) _reloadChk.checked = false;
        UI.sync();
        ChartEngine.refreshZoom();
        this.hide();
    },

    _skip() {
        localStorage.setItem('sleepapp_wizard_done', '1');
        localStorage.removeItem('sleepapp_show_on_reload');
        const _reloadChk = document.getElementById('intro-on-reload');
        if (_reloadChk) _reloadChk.checked = false;
        this.hide();
    },
};
