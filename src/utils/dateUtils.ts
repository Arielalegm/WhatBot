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
    const havanaDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Havana' }));
    return havanaDate;
}

export function createReminderDate(date: Date): Date {
    // Asegurarnos de que la fecha se interprete en zona horaria de Cuba
    const timeString = date.toLocaleString('en-US', {
        timeZone: 'America/Havana',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false
    });
    
    return new Date(timeString);
}
