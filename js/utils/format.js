const fmtHM = (secs) => {
    const sign = secs < 0 ? '-' : '';
    const abs = Math.round(Math.abs(secs));
    const h = Math.floor(abs / 3600);
    const m = Math.floor((abs % 3600) / 60);
    return `${sign}${h}h ${m}m`;
};
