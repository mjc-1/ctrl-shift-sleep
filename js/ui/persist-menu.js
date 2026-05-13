const PersistMenu = {
    _mode: null,

    open(mode, anchorEl) {
        const el = document.getElementById('persist-menu');
        if (el.style.display === 'block' && this._mode === mode) { this.close(); return; }
        this._mode = mode;
        UI.closeAppearanceMenu();
        UI.closeExportMenu();
        const slots = Actions.getSlots();
        const isSave = mode === 'save';
        let html = `<div class="pm-title">${isSave ? '💾 Save to...' : '📂 Load from...'}</div>`;

        if (slots.length === 0 && !isSave) {
            html += `<div class="pm-empty">No saves yet</div>`;
        }
        slots.forEach((name, i) => {
            html += `<button class="pm-slot" onclick="PersistMenu._select(${i})">${name}</button>`;
        });
        if (isSave) {
            html += `<button class="pm-new" onclick="PersistMenu._promptNew()">＋ New save</button>
                <div id="pm-new-area" style="display:none; padding:4px 0 2px;">
                    <input class="pm-input" id="pm-name-input" type="text" placeholder="Save name..."
                        onkeydown="if(event.key==='Enter')PersistMenu._confirmNew()">
                    <button class="pm-slot" onclick="PersistMenu._confirmNew()">Save</button>
                </div>`;
        }

        el.innerHTML = html;
        el.style.display = 'block';
        el.style.top = '-9999px'; el.style.left = '-9999px';
        const rect = anchorEl.getBoundingClientRect();
        const mW = el.offsetWidth, mH = el.offsetHeight;
        let top  = rect.bottom + 4;
        let left = rect.left;
        if (left + mW > window.innerWidth  - 8) left = window.innerWidth  - mW - 8;
        if (top  + mH > window.innerHeight - 8) top  = rect.top - mH - 4;
        el.style.top = top + 'px'; el.style.left = left + 'px';
        _skipPickerClose = true;
    },

    close() { document.getElementById('persist-menu').style.display = 'none'; },

    _select(idx) {
        const name = Actions.getSlots()[idx];
        if (this._mode === 'save') Actions._saveToSlot(name);
        else Actions._loadFromSlot(name);
        this.close();
    },

    _promptNew() {
        document.getElementById('pm-new-area').style.display = 'block';
        document.getElementById('pm-name-input').focus();
    },

    _confirmNew() {
        const name = document.getElementById('pm-name-input').value.trim();
        if (!name) return;
        Actions._saveToSlot(name);
        this.close();
    },
};
