export function getCurrentDateTime(): string {
    const now = new Date();
    return now.toLocaleString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
    });
}

export function getCurrentDate(): Date {
    return new Date();
}
