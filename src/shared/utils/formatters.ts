export const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-MR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);
};

export const formatTime = (timeString: string | null | undefined): string => {
    if (!timeString) return '';

    // Try to parse full ISO string first
    if (timeString.includes('T')) {
        const date = new Date(timeString);
        return new Intl.DateTimeFormat('ar-MR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).format(date);
    }

    // Assume timeString is HH:mm:ss or HH:mm
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));

    return new Intl.DateTimeFormat('ar-MR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).format(date);
};
