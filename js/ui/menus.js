const _MenusUI = {
    toggleOtherMenu: (e) => {
        e.stopPropagation();
        const m = document.getElementById('other-menu');
        m.style.display = m.style.display === 'block' ? 'none' : 'block';
    },
    closeOtherMenu: () => {
        document.getElementById('other-menu').style.display = 'none';
    },
    openNameModal() {
        const modal = document.getElementById('name-modal');
        if (!modal) return;
        const inp = document.getElementById('name-modal-input');
        if (inp) inp.value = document.getElementById('plan-name')?.value || '';
        modal.style.display = 'flex';
        setTimeout(() => { if (inp) inp.focus(); }, 60);
    },
    confirmNameModal() {
        const val = document.getElementById('name-modal-input')?.value ?? '';
        const planEl = document.getElementById('plan-name');
        if (planEl) planEl.value = val;
        localStorage.setItem('sleepapp_name', val);
        const modal = document.getElementById('name-modal');
        if (modal) modal.style.display = 'none';
    },
};
