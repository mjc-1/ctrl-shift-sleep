const Wizard = {
    _step: 0,
    _data: {},
    _pickerCb: null,
    _lastStep: null,
    _swipeAttached: false,
    _direction: null,
    _lastPreviewStage: -1,

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
            commuteToWorkH: 0,   commuteToWorkM: 30,
            commuteFromWorkH: 0, commuteFromWorkM: 30,
            days: 7,
            sleepNeedsSet: false,
            showDebtGraph: false,
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
                           autocomplete="off" autocorrect="off" autocapitalize="off"
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
                            <button class="wiz-preset" onclick="Wizard._pickShiftDaysType('variable')">It varies</button>
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
                            <button class="wiz-preset" onclick="Wizard._pickShiftHoursType('variable')">It varies</button>
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
                            <button class="wiz-preset" onclick="Wizard._pickBedtimeType('variable')">It varies</button>
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
                            <button class="wiz-preset" onclick="Wizard._pickOnsetType('variable')">It varies</button>
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
                            <button class="wiz-preset" onclick="Wizard._pickWakeType('variable')">It varies</button>
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
            title: 'How much sleep do you need per day/night?',
            subtitle: 'This sets your sleep targets in the analytics.',
            render(data) {
                const cols = [
                    { label: 'barely<br>functional', hKey: 'sleepBareH', mKey: 'sleepBareM' },
                    { label: 'getting<br>by',         hKey: 'sleepOkH',   mKey: 'sleepOkM'   },
                    { label: 'comfortable',           hKey: 'sleepGoodH', mKey: 'sleepGoodM' },
                ];
                const cells = cols.map(c => {
                    const wMins = (data[c.hKey] * 60 + data[c.mKey]) * 7;
                    const wH = Math.floor(wMins / 60), wM = wMins % 60;
                    const wkStr = `${wH}h${wM ? ' ' + wM + 'm' : ''} / week`;
                    return `
                    <div class="wiz-sleep-col">
                        <div class="wiz-sleep-col-label">${c.label}</div>
                        <div class="wiz-sleep-pickers">
                            <button class="wiz-val-btn" onclick="Wizard._pickNeedH(event,'${c.hKey}')">${data[c.hKey]}</button>
                            <span class="wiz-unit">h</span>
                            <button class="wiz-val-btn" onclick="Wizard._pickNeedM(event,'${c.mKey}')">${data[c.mKey]}</button>
                            <span class="wiz-unit">m</span>
                        </div>
                        <div class="wiz-sleep-weekly">${wkStr}</div>
                    </div>`;
                }).join('');
                return `<div class="wiz-sleep-cols">${cells}</div>`;
            },
            validate() {
                const d = Wizard._data;
                return { bareH: d.sleepBareH, bareM: d.sleepBareM, okH: d.sleepOkH, okM: d.sleepOkM, goodH: d.sleepGoodH, goodM: d.sleepGoodM };
            },
            save(val, data) {
                Object.assign(data, { sleepBareH: val.bareH, sleepBareM: val.bareM, sleepOkH: val.okH, sleepOkM: val.okM, sleepGoodH: val.goodH, sleepGoodM: val.goodM });
                data.sleepNeedsSet = true;
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

                const commuteInputs = data.extraActivities.includes('Commute') ? `
                    <div class="wiz-commute-inputs">
                        <div class="wiz-commute-row">
                            <span class="wiz-label" style="margin-bottom:0;">To work</span>
                            <div class="wiz-sleep-pickers">
                                <button class="wiz-val-btn" onclick="Wizard._pickCommuteH(event,'To')">${data.commuteToWorkH}</button>
                                <span class="wiz-unit">h</span>
                                <button class="wiz-val-btn" onclick="Wizard._pickCommuteM(event,'To')">${data.commuteToWorkM}</button>
                                <span class="wiz-unit">m</span>
                            </div>
                        </div>
                        <div class="wiz-commute-row">
                            <span class="wiz-label" style="margin-bottom:0;">From work</span>
                            <div class="wiz-sleep-pickers">
                                <button class="wiz-val-btn" onclick="Wizard._pickCommuteH(event,'From')">${data.commuteFromWorkH}</button>
                                <span class="wiz-unit">h</span>
                                <button class="wiz-val-btn" onclick="Wizard._pickCommuteM(event,'From')">${data.commuteFromWorkM}</button>
                                <span class="wiz-unit">m</span>
                            </div>
                        </div>
                    </div>
                ` : '';

                return `
                    <div class="wiz-presets">${btns}</div>
                    ${commuteInputs}
                    ${customRows}
                    <div style="margin-top:10px;">
                        <button class="wiz-preset" onclick="Wizard._addCustom()">✏️ Other</button>
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
            title: 'How far ahead?',
            subtitle: 'How many days would you like to plan?',
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
                           min="1" max="365" style="width:100px;" inputmode="none"
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

        // 10 — Evaluation
        {
            title: 'Your plan looks…',
            subtitle: '',
            isEvalStep: true,
            render(data) {
                data.showDebtGraph = true;
                const ev = Wizard._evalDescription(data);
                return `
                    <div class="wiz-eval-badge">${ev.badge}</div>
                    <p class="wiz-eval-text">${ev.text}</p>
                `;
            },
            validate() { return {}; },
            save(val, data) { data.showDebtGraph = true; },
        },

        // 11 — Suggestions
        {
            title: 'You might want to try…',
            subtitle: '',
            render(data) {
                const rows = Wizard._buildSuggestions(data)
                    .map(s => `<div class="wiz-suggestion">${s}</div>`).join('');
                return `<div class="wiz-suggestions">${rows}</div>`;
            },
            validate() { return {}; },
            save() {},
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
        const savedStep = localStorage.getItem('sleepapp_wizard_step');
        const savedData = localStorage.getItem('sleepapp_wizard_data');
        const restoring = savedStep !== null && savedData !== null;
        if (restoring) {
            try {
                this._step = parseInt(savedStep, 10) || 0;
                this._data = { ...this._defaultData(), ...JSON.parse(savedData) };
            } catch (e) {
                this._step = 0;
                this._data = this._defaultData();
            }
        } else {
            this._step = 0;
            this._data = this._defaultData();
        }
        const card = document.getElementById('wizard-card');
        if (card) card.innerHTML = '';
        const overlay = document.getElementById('wizard-overlay');
        overlay.style.display = 'flex';
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                overlay.classList.add('wiz-visible');
                this._renderContent(!restoring);
            });
        });
        if (!this._swipeAttached) {
            this._swipeAttached = true;
            let sx = 0, sy = 0, _ignoreSwipe = false;
            overlay.addEventListener('touchstart', e => {
                const previewArea = document.getElementById('wiz-preview-area');
                if (previewArea && previewArea.contains(e.target)) { _ignoreSwipe = true; return; }
                _ignoreSwipe = false;
                sx = e.touches[0].clientX;
                sy = e.touches[0].clientY;
            }, { passive: true });
            overlay.addEventListener('touchend', e => {
                if (_ignoreSwipe) { _ignoreSwipe = false; return; }
                const dx = e.changedTouches[0].clientX - sx;
                const dy = e.changedTouches[0].clientY - sy;
                if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
                const picker = document.getElementById('wiz-picker');
                if (picker && picker.style.display !== 'none') { this._closePicker(); return; }
                if (dx < 0) this._next();
                else        this._back();
            }, { passive: true });
        }
    },

    showFromLast() {
        const overlay = document.getElementById('wizard-overlay');
        this._step = (this._lastStep !== null && this._lastStep !== undefined)
            ? this._lastStep
            : this._steps.length - 1;
        overlay.style.display = 'flex';
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                overlay.classList.add('wiz-visible');
                this._renderContent(false);
            });
        });
    },

    hide() {
        this._closePicker();
        this._lastStep = this._step;
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

        // Build permanent card structure once
        const card = document.getElementById('wizard-card');
        if (!document.getElementById('wiz-logo-area')) {
            const logoStyle = base > 0 ? `style="animation-delay:${base}ms"` : '';
            card.innerHTML = `
                <div id="wiz-logo-area" class="wiz-logo-wrap" ${logoStyle}>
                    <img src="icons/logo.png" class="wiz-logo" alt="" loading="eager"
                         onerror="this.closest('#wiz-logo-area').style.display='none'">
                    <div class="wiz-app-name">control shift sleep</div>
                    <div id="wiz-dots-area" class="wiz-dots wiz-dots-logo"></div>
                </div>
                <div id="wiz-content"></div>
                <div id="wiz-preview-area" class="wiz-preview">
                    <canvas id="wiz-debt-canvas"    class="wiz-debt-canvas"    style="display:none;"></canvas>
                    <canvas id="wiz-preview-canvas" class="wiz-preview-canvas"></canvas>
                </div>
            `;
        }

        // Update dots in logo area
        const dotsArea = document.getElementById('wiz-dots-area');
        if (dotsArea) dotsArea.innerHTML = dots;

        // Show/hide preview area and debt canvas
        const previewArea = document.getElementById('wiz-preview-area');
        if (previewArea) previewArea.style.display = showPreview ? '' : 'none';
        const evalIdx = this._steps.findIndex(s => s.isEvalStep);
        const showDebt = evalIdx >= 0 && this._step >= evalIdx;
        const debtCanvas = document.getElementById('wiz-debt-canvas');
        if (debtCanvas) debtCanvas.style.display = showDebt ? 'block' : 'none';

        // Replace only the step content
        const contentEl = document.getElementById('wiz-content');
        contentEl.style.animation = '';
        contentEl.classList.remove('wiz-slide-in-right', 'wiz-slide-in-left');
        contentEl.innerHTML = `
            <h2 class="wiz-title"  style="${d(0)}">${step.title}</h2>
            ${hasSub ? `<p class="wiz-subtitle" style="${d(100)}">${step.subtitle}</p>` : ''}
            <div class="wiz-body"  style="${d(hasSub ? 260 : 140)}">${step.render(this._data)}</div>
        `;

        // Apply directional slide-in animation
        if (this._direction) {
            contentEl.classList.add(this._direction === 'back' ? 'wiz-slide-in-left' : 'wiz-slide-in-right');
            this._direction = null;
        }

        // Update desktop edge buttons
        const backBtn = document.getElementById('wiz-btn-back');
        const nextBtn = document.getElementById('wiz-btn-next');
        if (backBtn) { backBtn.style.opacity = isFirst ? '0.25' : '1'; backBtn.style.pointerEvents = isFirst ? 'none' : ''; }
        if (nextBtn) { nextBtn.style.opacity = '1'; nextBtn.style.pointerEvents = ''; }

        // Save progress
        try {
            localStorage.setItem('sleepapp_wizard_step', this._step);
            localStorage.setItem('sleepapp_wizard_data', JSON.stringify(this._data));
        } catch (e) {}

        requestAnimationFrame(() => this._drawPreview());

        setTimeout(() => {
            const first = document.querySelector('#wizard-card input:not([type=number])');
            if (first) first.focus();
        }, base + 430);
    },

    _rerenderBody() {
        const body = document.querySelector('#wiz-content .wiz-body');
        if (body) body.innerHTML = this._steps[this._step].render(this._data);
        requestAnimationFrame(() => this._drawPreview());
    },

    _drawPreview() {
        if (typeof WizardPreview === 'undefined') return;
        const d = this._data;

        // Stage chime — play a soft tone when a new visual element appears
        const stage =
            d.sleepNeedsSet                        ? 6 :
            d.onsetType                            ? 5 :
            (d.bedtimeType && d.wakeType)          ? 4 :
            d.bedtimeType                          ? 3 :
            (d.shiftDaysType && d.shiftHoursType)  ? 2 :
            d.shiftDaysType                        ? 1 : 0;
        if (stage > this._lastPreviewStage) {
            this._lastPreviewStage = stage;
            const freqs = [0, 440, 554, 659, 784, 880, 1047];
            if (typeof FireSound !== 'undefined' && freqs[stage])
                FireSound.chime(freqs[stage], 0.18, 0.03);
        }

        const canvas = document.getElementById('wiz-preview-canvas');
        if (canvas) WizardPreview.draw(canvas, d);

        const debtCanvas = document.getElementById('wiz-debt-canvas');
        if (debtCanvas && debtCanvas.style.display !== 'none') WizardPreview.drawDebt(debtCanvas, d);
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
        this._direction = 'next';
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
        this._direction = 'back';
        this._transition(() => { this._step = prev; this._renderContent(false); });
    },

    _skipStep() {
        this._closePicker();
        let next = this._step + 1;
        while (next < this._steps.length && this._steps[next].skip?.(this._data)) next++;
        this._direction = 'next';
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
            const outAnim = this._direction === 'back' ? 'wiz-slide-out-right' : 'wiz-slide-out-left';
            content.style.animation = `${outAnim} 0.18s ease forwards`;
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
        el.style.transform = '';
        el.style.width = '';
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

    _openGridPicker(event, items, cols, currentVal, onPick) {
        event.stopPropagation();
        this._pickerCb = onPick;
        const el = document.getElementById('wiz-picker');

        const rows = [];
        for (let i = 0; i < items.length; i += cols) rows.push(items.slice(i, i + cols));

        el.innerHTML = `<div class="wiz-pick-grid-2d">${
            rows.map(row => `<div class="wiz-pick-grid-row">${
                row.map(o => {
                    const active = String(o.val) === String(currentVal);
                    const v = typeof o.val === 'number' ? o.val : `'${o.val}'`;
                    return `<button class="wiz-pick-btn-2d${active ? ' active' : ''}" onclick="Wizard._pickVal(${v})">${o.label}</button>`;
                }).join('')
            }</div>`).join('')
        }</div>`;

        // Set explicit width so overflow:auto doesn't clip rows
        const BTN_W = 30, GAP = 3, BORDER_PAD = 16;
        const gridW = cols * BTN_W + (cols - 1) * GAP + BORDER_PAD;
        el.style.width = Math.min(gridW, window.innerWidth - 32) + 'px';

        el.style.display   = 'block';
        el.style.top       = '50%';
        el.style.left      = '50%';
        el.style.transform = 'translate(-50%, -50%)';

        requestAnimationFrame(() => {
            const active = el.querySelector('.wiz-pick-btn-2d.active');
            if (active) active.scrollIntoView({ block: 'center', behavior: 'instant' });
        });
    },

    _pickVal(val) {
        if (this._pickerCb) this._pickerCb(val);
        this._pickerCb = null;
        document.getElementById('wiz-picker').style.display = 'none';
    },

    _closePicker() {
        const el = document.getElementById('wiz-picker');
        if (el) { el.style.display = 'none'; el.style.transform = ''; }
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
            const [bh, bm] = data.bedtime.split(':').map(Number);
            return `
                <div class="wiz-sched-row" style="align-items:flex-end;">
                    <div class="wiz-sched-cell">
                        <label class="wiz-label">Bedtime</label>
                        <div style="display:flex; gap:4px; align-items:center;">
                            <button class="wiz-val-btn" onclick="Wizard._pickBedtimeH(event)">${bh}</button>
                            <span class="wiz-unit">:</span>
                            <button class="wiz-val-btn" onclick="Wizard._pickBedtimeM(event)">${String(bm).padStart(2,'0')}</button>
                        </div>
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
                        <div style="display:flex; gap:4px; align-items:center;">
                            <button class="wiz-val-btn" onclick="Wizard._pickBedOffH(event)">${data.bedtimeOffsetH}</button>
                            <span class="wiz-unit">h</span>
                            <button class="wiz-val-btn" onclick="Wizard._pickBedOffM(event)">${data.bedtimeOffsetM}</button>
                            <span class="wiz-unit">m</span>
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

    _pickBedtimeH(event) {
        const items = Array.from({ length: 24 }, (_, i) => ({ val: i, label: String(i) }));
        const [h, m] = this._data.bedtime.split(':').map(Number);
        this._openPicker(event, items, h, val => {
            this._data.bedtime = String(val).padStart(2,'0') + ':' + String(m).padStart(2,'0');
            this._rerenderBody();
        });
    },

    _pickBedtimeM(event) {
        const items = Array.from({ length: 12 }, (_, i) => ({ val: i * 5, label: String(i * 5).padStart(2,'0') }));
        const [h, m] = this._data.bedtime.split(':').map(Number);
        this._openPicker(event, items, m, val => {
            this._data.bedtime = String(h).padStart(2,'0') + ':' + String(val).padStart(2,'0');
            this._rerenderBody();
        });
    },

    _pickBedOffH(event) {
        const items = Array.from({ length: 9 }, (_, i) => ({ val: i, label: String(i) }));
        this._openPicker(event, items, this._data.bedtimeOffsetH, val => {
            this._data.bedtimeOffsetH = val; this._rerenderBody();
        });
    },

    _pickBedOffM(event) {
        const items = Array.from({ length: 12 }, (_, i) => ({ val: i * 5, label: String(i * 5).padStart(2,'0') }));
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
                    <div style="display:flex; gap:4px; align-items:center;">
                        <button class="wiz-val-btn" onclick="Wizard._pickOnsetH(event)">${data.onsetH}</button>
                        <span class="wiz-unit">h</span>
                        <button class="wiz-val-btn" onclick="Wizard._pickOnsetM(event)">${data.onsetM}</button>
                        <span class="wiz-unit">m</span>
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
        const items = Array.from({ length: 4 }, (_, i) => ({ val: i, label: String(i) }));
        this._openPicker(event, items, this._data.onsetH, val => {
            this._data.onsetH = val; this._rerenderBody();
        });
    },

    _pickOnsetM(event) {
        const items = Array.from({ length: 12 }, (_, i) => ({ val: i * 5, label: String(i * 5).padStart(2,'0') }));
        this._openPicker(event, items, this._data.onsetM, val => {
            this._data.onsetM = val; this._rerenderBody();
        });
    },

    // ── Wake time ─────────────────────────────────────────────────────────

    _wakeSubScreen(data) {
        const t    = data.wakeType;
        const back = `<button class="wiz-change-btn" onclick="Wizard._pickWakeType(null)">&#8592; Change answer</button>`;

        if (t === 'fixed') {
            const [wh, wm] = data.wakeTime.split(':').map(Number);
            return `
                <div class="wiz-sched-row" style="align-items:flex-end;">
                    <div class="wiz-sched-cell">
                        <label class="wiz-label">Wake time</label>
                        <div style="display:flex; gap:4px; align-items:center;">
                            <button class="wiz-val-btn" onclick="Wizard._pickWakeTimeH(event)">${wh}</button>
                            <span class="wiz-unit">:</span>
                            <button class="wiz-val-btn" onclick="Wizard._pickWakeTimeM(event)">${String(wm).padStart(2,'0')}</button>
                        </div>
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
                            <button class="wiz-val-btn" onclick="Wizard._pickWakeDurH(event)">${data.wakeDurationH}</button>
                            <span class="wiz-unit">h</span>
                            <button class="wiz-val-btn" onclick="Wizard._pickWakeDurM(event)">${data.wakeDurationM}</button>
                            <span class="wiz-unit">m</span>
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

    _pickWakeTimeH(event) {
        const items = Array.from({ length: 24 }, (_, i) => ({ val: i, label: String(i) }));
        const [h, m] = this._data.wakeTime.split(':').map(Number);
        this._openPicker(event, items, h, val => {
            this._data.wakeTime = String(val).padStart(2,'0') + ':' + String(m).padStart(2,'0');
            this._rerenderBody();
        });
    },

    _pickWakeTimeM(event) {
        const items = Array.from({ length: 12 }, (_, i) => ({ val: i * 5, label: String(i * 5).padStart(2,'0') }));
        const [h, m] = this._data.wakeTime.split(':').map(Number);
        this._openPicker(event, items, m, val => {
            this._data.wakeTime = String(h).padStart(2,'0') + ':' + String(val).padStart(2,'0');
            this._rerenderBody();
        });
    },

    _pickWakeDurH(event) {
        const items = Array.from({ length: 15 }, (_, i) => ({ val: i, label: String(i) }));
        this._openPicker(event, items, this._data.wakeDurationH, val => {
            this._data.wakeDurationH = val; this._rerenderBody();
        });
    },

    _pickWakeDurM(event) {
        const items = Array.from({ length: 12 }, (_, i) => ({ val: i * 5, label: String(i * 5).padStart(2,'0') }));
        this._openPicker(event, items, this._data.wakeDurationM, val => {
            this._data.wakeDurationM = val; this._rerenderBody();
        });
    },

    // ── Sleep needs ───────────────────────────────────────────────────────

    _pickNeedH(event, key) {
        event.stopPropagation();
        const items = Array.from({ length: 24 }, (_, h) => ({ val: h, label: String(h) }));
        this._openGridPicker(event, items, 6, this._data[key], val => {
            this._data[key] = val; this._rerenderBody();
        });
    },

    _pickNeedM(event, key) {
        event.stopPropagation();
        const items = Array.from({ length: 60 }, (_, m) => ({ val: m, label: String(m).padStart(2, '0') }));
        this._openGridPicker(event, items, 10, this._data[key], val => {
            this._data[key] = val; this._rerenderBody();
        });
    },

    // ── Activities ────────────────────────────────────────────────────────

    _toggleActivity(type) {
        const idx = this._data.extraActivities.indexOf(type);
        if (idx === -1) this._data.extraActivities.push(type);
        else            this._data.extraActivities.splice(idx, 1);
        if (type === 'Commute') {
            this._rerenderBody();
        } else {
            document.querySelectorAll('.wiz-preset[data-type]').forEach(b => {
                b.classList.toggle('active', this._data.extraActivities.includes(b.dataset.type));
            });
            requestAnimationFrame(() => this._drawPreview());
        }
    },

    _pickCommuteH(event, dir) {
        event.stopPropagation();
        const key = dir === 'To' ? 'commuteToWorkH' : 'commuteFromWorkH';
        const items = Array.from({ length: 5 }, (_, i) => ({ val: i, label: String(i) }));
        this._openPicker(event, items, this._data[key], val => {
            this._data[key] = val; this._rerenderBody();
        });
    },

    _pickCommuteM(event, dir) {
        event.stopPropagation();
        const key = dir === 'To' ? 'commuteToWorkM' : 'commuteFromWorkM';
        const items = Array.from({ length: 12 }, (_, i) => ({ val: i * 5, label: String(i * 5).padStart(2,'0') }));
        this._openPicker(event, items, this._data[key], val => {
            this._data[key] = val; this._rerenderBody();
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
        requestAnimationFrame(() => this._drawPreview());
    },

    // ── Evaluation helpers ────────────────────────────────────────────────

    _evalDescription(data) {
        const sleep = WizardPreview._buildSleep(data);
        if (!sleep || !data.sleepNeedsSet) {
            return { badge: '—', text: 'Complete the earlier steps to see your evaluation.' };
        }
        const onsetDur    = data.onsetType === 'fixed' ? (data.onsetH || 0) * 60 + (data.onsetM || 0) : 0;
        const rawSleep    = (sleep.to - sleep.from + 1440) % 1440;
        const actualSleep = Math.max(0, rawSleep - onsetDur);
        const targetSleep = (data.sleepGoodH || 8) * 60 + (data.sleepGoodM || 0);
        const daily       = targetSleep - actualSleep; // positive = in debt

        if (daily <= -30)  return { badge: 'Great!',         text: "You're getting more than enough sleep — a small surplus to draw on." };
        if (daily <= 5)    return { badge: 'Pretty good',    text: "You're just about hitting your sleep target most nights." };
        if (daily <= 25)   return { badge: 'Manageable',     text: "A small nightly shortfall that may add up across the week." };
        if (daily <= 50)   return { badge: 'Kinda tough',    text: "You'll accumulate a noticeable sleep debt — weekends may need to make up the difference." };
        if (daily <= 90)   return { badge: 'Tough',          text: "A significant nightly shortfall. Consider adjusting bedtime or work hours." };
        return               { badge: 'Unmanageable',     text: "This schedule doesn't leave enough time for adequate sleep. Something needs to change." };
    },

    _buildSuggestions(data) {
        const sleep = WizardPreview._buildSleep(data);
        if (!sleep) return ['Complete the earlier steps to see personalised suggestions.'];

        const onsetDur    = data.onsetType === 'fixed' ? (data.onsetH || 0) * 60 + (data.onsetM || 0) : 0;
        const rawSleep    = (sleep.to - sleep.from + 1440) % 1440;
        const actualSleep = Math.max(0, rawSleep - onsetDur);
        const targetSleep = (data.sleepGoodH || 8) * 60 + (data.sleepGoodM || 0);
        const daily       = targetSleep - actualSleep;

        if (daily <= 0) return ['✅ Your sleep schedule looks good. Keep regular sleep and wake times for best results.'];

        const suggestions = [];
        const bedH = Math.floor(sleep.from / 60);
        const bedM = sleep.from % 60;
        const earlyBed = (sleep.from - 45 + 1440) % 1440;
        const earlyStr = `${String(Math.floor(earlyBed/60)).padStart(2,'0')}:${String(earlyBed%60).padStart(2,'0')}`;

        // Find the day in the pattern with the earliest shift start (= most sleep pressure)
        const pattern = WizardPreview._buildDays(data);
        const workDays = pattern.filter(d => d.isWork && d.workFrom !== null);
        if (workDays.length > 0) {
            const earliest = workDays.reduce((a, b) => a.workFrom < b.workFrom ? a : b);
            const dayName  = earliest.label;
            const shiftH   = String(Math.floor(earliest.workFrom / 60)).padStart(2,'0');
            const shiftM   = String(earliest.workFrom % 60).padStart(2,'0');
            suggestions.push(`😴 Try going to bed around ${earlyStr} on ${dayName} nights — your ${shiftH}:${shiftM} shift means every minute counts`);
        } else {
            suggestions.push(`😴 Try going to bed around ${earlyStr} — even 45 minutes earlier helps`);
        }

        // Nap suggestion: find gap between wake and first work, or between work end and bedtime
        const wakeM = sleep.to;
        const napStart = (wakeM + 60) % 1440; // 1 hour after wake
        const napH = Math.floor(napStart / 60);
        const napM = napStart % 60;
        const napStr = `${String(napH).padStart(2,'0')}:${String(napM).padStart(2,'0')}`;

        if (workDays.length > 0) {
            const firstShift = workDays.reduce((a, b) => a.workFrom < b.workFrom ? a : b);
            const gapMins    = (firstShift.workFrom - wakeM + 1440) % 1440;
            if (gapMins >= 120) {
                suggestions.push(`🛋️ A 20–90 minute nap around ${napStr} before your shift could offset the shortfall`);
            } else {
                // Suggest evening nap between shift end and bedtime
                const workEndDay = workDays.reduce((a, b) => a.workTo > b.workTo ? a : b);
                const midGap = Math.floor(((workEndDay.workTo + sleep.from) % 1440 + (workEndDay.workTo < sleep.from ? 0 : 1440)) / 2) % 1440;
                const mgH = String(Math.floor(midGap/60)).padStart(2,'0');
                const mgM = String(midGap%60).padStart(2,'0');
                suggestions.push(`🛋️ A short nap (20–30 min) around ${mgH}:${mgM} after work may ease the shortfall`);
            }
        } else {
            suggestions.push(`🛋️ A 20–90 minute nap around ${napStr} can help when you're running a deficit`);
        }

        return suggestions;
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

        // Work activity
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
                const work    = State.activities.find(a => a.type === 'Work');
                const toMins   = d.commuteToWorkH   * 60 + d.commuteToWorkM;
                const fromMins = d.commuteFromWorkH * 60 + d.commuteFromWorkM;
                if (work) {
                    const wFrom = Utils.timeToMins(work.from);
                    const wTo   = Utils.timeToMins(work.to);
                    State.activities.push(
                        { id: Date.now(),     name: 'Commute to work',   color: '#f97316', type: 'Commute', start: State.viewStart.toISODate(), from: Utils.minsToTime((wFrom - toMins   + 1440) % 1440), to: work.from,                                     freq: 1, dur: 7, forever: true },
                        { id: Date.now() + 1, name: 'Commute from work', color: '#f97316', type: 'Commute', start: State.viewStart.toISODate(), from: work.to,                                             to: Utils.minsToTime((wTo   + fromMins + 1440) % 1440), freq: 1, dur: 7, forever: true }
                    );
                } else {
                    State.activities.push(
                        { id: Date.now(),     name: 'Commute to work',   color: '#f97316', type: 'Commute', start: State.viewStart.toISODate(), from: Utils.minsToTime((9*60  - toMins   + 1440) % 1440), to: '09:00', freq: 1, dur: 7, forever: true },
                        { id: Date.now() + 1, name: 'Commute from work', color: '#f97316', type: 'Commute', start: State.viewStart.toISODate(), from: '17:00', to: Utils.minsToTime((17*60 + fromMins        + 1440) % 1440), freq: 1, dur: 7, forever: true }
                    );
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
        this._renderContent(false);
    },

    _skip() {
        localStorage.setItem('sleepapp_wizard_done', '1');
        localStorage.removeItem('sleepapp_show_on_reload');
        const _reloadChk = document.getElementById('intro-on-reload');
        if (_reloadChk) _reloadChk.checked = false;
    },
};
