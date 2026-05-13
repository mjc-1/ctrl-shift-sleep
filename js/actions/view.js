const _ViewActions = {
    adjustDays: (delta) => {
        State.totalDays = Math.max(1, State.totalDays + delta);
        UI.sync();
    },
};
