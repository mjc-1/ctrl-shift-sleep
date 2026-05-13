const CACHE = 'sleep-planner-v3';
const ASSETS = [
    './', './index.html',
    './css/variables.css', './css/base.css', './css/table.css', './css/stepper.css',
    './css/analytics.css', './css/chart.css', './css/controls.css',
    './js/state.js', './js/history.js', './js/main.js',
    './js/utils/format.js', './js/utils/time.js', './js/utils/stepper.js', './js/utils/index.js',
    './js/actions/activities.js', './js/actions/time.js', './js/actions/fields.js',
    './js/actions/targets.js', './js/actions/persist.js', './js/actions/view.js',
    './js/actions/export.js', './js/actions/index.js',
    './js/ui/drag-reorder.js', './js/ui/picker.js', './js/ui/menus.js',
    './js/ui/persist-menu.js', './js/ui/activity-row.js', './js/ui/analytics-cells.js',
    './js/ui/analytics.js', './js/ui/sync.js', './js/ui/calendar.js',
    './js/ui/themes.js', './js/ui/wizard.js', './js/ui/wizard-preview.js', './js/ui/index.js',
    './js/chart/activity-icons.js', './js/chart/plugins.js', './js/chart/init.js',
    './js/chart/hypnogram.js', './js/chart/render.js', './js/chart/zoom.js', './js/chart/index.js',
    './icons/icon.svg',
];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE)
            .then(c => c.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', e => {
    const url = e.request.url;
    // External CDN/image resources: network-first
    if (url.includes('cdn.jsdelivr.net') || url.includes('unsplash.com') || url.includes('picsum.photos')) {
        e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
        return;
    }
    // Everything else: cache-first
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
