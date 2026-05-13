const ACTIVITY_ICONS = {
    Sleep:    '🌙',
    Work:     '💼',
    Commute:  '🚌',
    Exercise: '🏋️',
    Family:   '👨‍👩‍👧',
    Custom:   '✏️',
};

function getActivityIcon(type) {
    return ACTIVITY_ICONS[type] ?? '📌';
}
