const State = {
    viewStart: luxon.DateTime.now().startOf('day'),
    totalDays: 7,
    onsetH: 0,
    onsetM: 20,
    targets: {
        totalH: 8, totalM: 0,
        remH: 1, remM: 40,
        perVal: 1
    },
    activities: [
        { id: 2, name: 'Sleep', type: 'Sleep', color: '#818cf8', start: luxon.DateTime.now().toISODate(), from: '23:00', to: '07:00', freq: 1, dur: 7, forever: true  },
        { id: 1, name: 'Work shift',  type: 'Work',  color: '#fbbf24', start: luxon.DateTime.now().toISODate(), from: '09:00', to: '17:00', freq: 1, dur: 5, forever: true }
    ]
};
