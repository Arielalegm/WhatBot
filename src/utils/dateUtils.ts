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
    // Convertir a UTC antes de ajustar a zona horaria de Cuba
    const utcNow = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
    return new Date(utcNow.toLocaleString('en-US', { timeZone: 'America/Havana' }));
}

export function createReminderDate(date: Date): Date {
    // Convertir a UTC
    const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    
    // Formatear en UTC y luego convertir a zona horaria de Cuba
    const timeString = utcDate.toLocaleString('en-US', {
        timeZone: 'America/Havana',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false
    });
    
    // Convertir el string resultante a Date
    const reminderDate = new Date(timeString);
    // Ajustar offset de zona horaria
    return new Date(reminderDate.getTime() - (reminderDate.getTimezoneOffset() * 60000));
}

