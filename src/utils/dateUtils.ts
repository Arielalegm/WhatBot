export function getCurrentDateTime(): string {
    const now = new Date();
    // Ajustar a UTC-4
    const utcMinus4 = new Date(now.getTime() - (4 * 60 * 60 * 1000));
    
    return utcMinus4.toLocaleString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
}

export function getCurrentDate(): Date {
    const now = new Date();
    // Ajustar a UTC-4
    return new Date(now.getTime() - (3 * 60 * 60 * 1000));
}

export function createReminderDate(date: Date): Date {
    // Asegurarnos que la fecha esté en UTC-4
    return new Date(date.getTime() - (3 * 60 * 60 * 1000));
}
