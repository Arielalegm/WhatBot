export function getCurrentDateTime(): string {
    // Crear fecha con la zona horaria correcta
    const now = new Date();
    // Ajustar a la zona horaria local
    const havanaTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Havana' }));
    
    return havanaTime.toLocaleString('es-ES', {
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
    return new Date(now.toLocaleString('en-US', { timeZone: 'America/Havana' }));
}

// Agregar esta nueva función para manejar los recordatorios
export function createReminderDate(date: Date): Date {
    const havanaTime = new Date(date.toLocaleString('en-US', { timeZone: 'America/Havana' }));
    return havanaTime;
}
