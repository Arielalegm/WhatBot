export function getCurrentDateTime(): string {
    const now = new Date();
    // Convertir explícitamente a zona horaria de Cuba
    return now.toLocaleString('es-ES', {
        timeZone: 'America/Havana',
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
    // Obtener timestamp UTC actual
    const utcNow = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        now.getUTCHours(),
        now.getUTCMinutes(),
        now.getUTCSeconds()
    ));
    
    // Convertir a hora de Cuba
    const cubaDate = new Date(utcNow.toLocaleString('en-US', { timeZone: 'America/Havana' }));
    return cubaDate;
}

export function createReminderDate(date: Date): Date {
    // Convertir a UTC
    const utcDate = new Date(Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        date.getUTCHours(),
        date.getUTCMinutes(),
        date.getUTCSeconds()
    ));
    
    return new Date(utcDate.toLocaleString('en-US', { timeZone: 'America/Havana' }));
}
