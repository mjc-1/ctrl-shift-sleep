const _MenusUI = {
    toggleOtherMenu: (e) => {
        e.stopPropagation();
        const m = document.getElementById('other-menu');
        m.style.display = m.style.display === 'block' ? 'none' : 'block';
    },
    closeOtherMenu: () => {
        document.getElementById('other-menu').style.display = 'none';
    },
};
