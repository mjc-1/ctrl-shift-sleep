function initChart() {
    const ctx = document.getElementById('sleepChart').getContext('2d');
    ChartEngine.instance = new Chart(ctx, {
        type: 'line',
        data: { datasets: [] },
        plugins: chartPlugins,
        options: {
            responsive: true, maintainAspectRatio: false, animation: false,
            layout: { padding: { top: 50, bottom: 0 } },
            scales: {
                x: { type: 'time', time: { unit: 'hour', displayFormats: { hour: 'HH:mm' } }, ticks: { color: '#64748b', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
                y: { min: 0, max: 6, display: true, ticks: { display: false }, grid: { color: 'rgba(255,255,255,0.08)', drawBorder: false } }
            },
            plugins: { legend: { display: false } }
        }
    });
}
