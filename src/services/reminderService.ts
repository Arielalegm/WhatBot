import { chat } from '../scripts/gemini';
import { getCurrentDateTime, getCurrentDate, createReminderDate } from '../utils/dateUtils';

interface Reminder {
    date: Date;
    message: string;
    userId: string;
}

export class ReminderService {
    private currentYear = getCurrentDate().getFullYear();
    private activeReminders: Reminder[] = [];

    parseDateTime(dateStr: string, timeStr: string): Date | null {
        try {
            const [day, month] = dateStr.split('-').map(num => parseInt(num));
            const [time, period] = timeStr.match(/(\d+:\d+)(am|pm)/i)?.slice(1) || [];
            const [baseHours, minutes] = time.split(':').map(num => parseInt(num));
            
            let hours = baseHours;
            if (period.toLowerCase() === 'pm' && hours !== 12) {
                hours += 12;
            }
            if (period.toLowerCase() === 'am' && hours === 12) {
                hours = 0;
            }

            // Crear fecha directamente en UTC-4
            const reminderDate = new Date(this.currentYear, month - 1, day, hours, minutes);
            const utcMinus4Date = new Date(reminderDate.getTime() - (4 * 60 * 60 * 1000));
            return utcMinus4Date;
        } catch (error) {
            return null;
        }
    }

    async scheduleReminder(date: Date, message: string, userId: string, ctxFn: any): Promise<string> {
        const now = getCurrentDate();
        
        // Añadir un margen de 2 segundos para evitar falsos negativos
        const marginMs = 2000; 
        const nowTs = now.getTime() - marginMs;
        const dateTs = date.getTime();
        
        if (dateTs < nowTs) {
            console.log('Debug timestamps:');
            console.log('Recordatorio:', dateTs);
            console.log('Actual:', nowTs);
            console.log('Diferencia (min):', (dateTs - nowTs) / 60000);
            return "La fecha y hora especificadas ya pasaron.";
        }

        const reminder: Reminder = { date, message, userId };
        this.activeReminders.push(reminder);

        const timeUntilReminder = dateTs - nowTs;
        
        setTimeout(async () => {
            await ctxFn.flowDynamic(`⏰ Recordatorio:\n${message}`);
            this.activeReminders = this.activeReminders.filter(r => r !== reminder);
        }, timeUntilReminder);

        const formattedDate = date.toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

        return `✅ Recordatorio programado para: ${formattedDate}\nMensaje: ${message}`;
    }

    getActiveReminders(userId: string): string {
        const userReminders = this.activeReminders
            .filter(r => r.userId === userId)
            .sort((a, b) => a.date.getTime() - b.date.getTime());
        
        if (userReminders.length === 0) {
            return "No tienes recordatorios activos.";
        }

        const reminderList = userReminders.map((r, index) => {
            const formattedDate = r.date.toLocaleString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
            return `${index + 1}. 📅 ${formattedDate}\n   📝 ${r.message}`;
        }).join('\n\n');

        return `🗒️ Tus recordatorios activos:\n\n${reminderList}`;
    }

    async parseNaturalLanguage(text: string, userId: string): Promise<{ date: Date | null, formattedText: string }> {
        const currentDateTime = getCurrentDateTime();
        
        // Manejar "dentro de X minutos"
        const minutesMatch = text.match(/dentro\s+de\s+(\d+)\s+minutos?/i);
        if (minutesMatch) {
            const minutes = parseInt(minutesMatch[1]);
            const now = getCurrentDate();
            const futureDate = new Date(now.getTime() + minutes * 60000);
            const formattedText = text.replace(/dentro\s+de\s+\d+\s+minutos?/i, '').trim();
            return {
                date: futureDate,
                formattedText
            };
        }

        const prompt = `Como asistente experto en procesamiento de fechas, analiza el siguiente texto:
        "${text}"
        
        Hora actual en Cuba: ${currentDateTime}
        
        1. Extrae la fecha y hora mencionadas
        2. Devuelve la respuesta en EXACTAMENTE este formato:
        DD-MM HH:MMam/pm|mensaje reformulado
        
        Por ejemplo:
        "recordarme mañana a las 3pm llamar a mamá" → "25-03 03:00pm|llamar a mamá"
        "necesito ir al dentista el próximo viernes 2pm" → "29-03 02:00pm|ir al dentista"
        
        Si no puedes determinar la fecha/hora, responde "INVALID"`;

        const response = await chat(prompt, text, userId);
        
        if (response === "INVALID") {
            return { date: null, formattedText: "" };
        }

        const [dateTimeStr, message] = response.split("|");
        const [dateStr, timeStr] = dateTimeStr.trim().split(" ");
        
        const date = this.parseDateTime(dateStr, timeStr);
        
        return { 
            date,
            formattedText: message.trim()
        };
    }

    deleteReminder(userId: string, index: number): string {
        const userReminders = this.activeReminders
            .filter(r => r.userId === userId)
            .sort((a, b) => a.date.getTime() - b.date.getTime());
        
        if (userReminders.length === 0) {
            return "No tienes recordatorios activos para eliminar.";
        }

        if (index < 0 || index >= userReminders.length) {
            return "Número de recordatorio inválido.";
        }

        const reminderToDelete = userReminders[index];
        this.activeReminders = this.activeReminders.filter(r => r !== reminderToDelete);
        
        return `✅ Recordatorio eliminado:\n📅 ${reminderToDelete.date.toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        })}\n📝 ${reminderToDelete.message}`;
    }
}
