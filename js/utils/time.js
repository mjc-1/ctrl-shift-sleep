const timeToMins = (t) => parseInt(t.split(':')[0]) * 60 + parseInt(t.split(':')[1]);

const minsToTime = (m) => {
    m = ((m % 1440) + 1440) % 1440;
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};
