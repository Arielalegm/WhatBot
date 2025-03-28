import { addKeyword, EVENTS } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import { MemoryDB as Database } from '@builderbot/bot'
import { askAboutImage, messageHistory, chat } from '../scripts/gemini'
import { commands, prompts } from '../config/llmConfig'
import { WebService } from '../services/webSearch'
import { reminderService } from '../app'
import { welcomeFlow } from './welcome.flow'
import { getCurrentDateTime } from '../utils/dateUtils'

const webService = new WebService();

export const mainFlow = addKeyword<Provider, Database>(EVENTS.WELCOME)
    .addAction(async (ctx, ctxFn) => {
        const bodyText: string = ctx.body.toLowerCase();
        const userId = ctx.from;

        // Comandos de control - estos siempre deben funcionar
        // Comando chat-off
        if (bodyText.startsWith(commands.chatOff)) {
            const targetUserId = bodyText.slice(commands.chatOff.length).trim() || userId;
            if (!targetUserId.match(/^[0-9]+$/)) {
                return await ctxFn.flowDynamic('Uso: /chat-off <número> o /chat-off');
            }
            messageHistory.setChatEnabled(targetUserId, false);
            return await ctxFn.flowDynamic(
                targetUserId === userId ? 
                'Chat desactivado. Ya no responderé a tus mensajes.' :
                `Chat desactivado para el número ${targetUserId}.`
            );
        }

        // Comando chat-on
        if (bodyText.startsWith(commands.chatOn)) {
            const targetUserId = bodyText.slice(commands.chatOn.length).trim() || userId;
            if (!targetUserId.match(/^[0-9]+$/)) {
                return await ctxFn.flowDynamic('Uso: /chat-on <número> o /chat-on');
            }
            messageHistory.setChatEnabled(targetUserId, true);
            return await ctxFn.flowDynamic(
                targetUserId === userId ? 
                'Chat activado. He vuelto a estar disponible.' :
                `Chat activado para el número ${targetUserId}.`
            );
        }

        // Verificar si el chat está habilitado DESPUÉS de los comandos de control
        if (!messageHistory.isChatEnabled(userId)) {
            return; // No responder si el chat está desactivado
        }

        // Comandos de imágenes
        if (bodyText.startsWith('imagen ')) {
            const question = ctx.body.slice(7).trim();
            const response = await askAboutImage(userId, question);
            return await ctxFn.flowDynamic(response);
        }

        // Comando de búsqueda
        if (bodyText.startsWith(commands.search)) {
            const query = ctx.body.slice(commands.search.length).trim();
            if (!query) return await ctxFn.flowDynamic('Uso: busca en internet <tu búsqueda>');
            await ctxFn.flowDynamic('🔍 Buscando información...');
            const result = await webService.searchGoogle(query, userId);
            return await ctxFn.flowDynamic(result);
        }

        // Comando de noticias
        if (bodyText.startsWith(commands.news)) {
            const news = await webService.getNews();
            return await ctxFn.flowDynamic(news);
        }

        // Comando del clima
        if (bodyText.startsWith(commands.weather)) {
            const city = ctx.body.slice(commands.weather.length).trim();
            if (!city) return await ctxFn.flowDynamic('Uso: /clima <ciudad>');
            const weather = await webService.getWeather(city);
            return await ctxFn.flowDynamic(weather);
        }

        // Comando de hora
        if (bodyText.startsWith(commands.time)) {
            const time = await webService.getTimeInCuba();
            return await ctxFn.flowDynamic(time);
        }

        // Comando tt (retardo)
        if (bodyText.startsWith(commands.tt)) {
            setTimeout(async () => {
                await ctxFn.flowDynamic("retardo 15 segundos");
            }, 15000);
            return;
        }

        // Comando de system prompt
        if (bodyText.startsWith(commands.systemPrompt)) {
            const parts = ctx.body.slice(commands.systemPrompt.length).trim().split(' ');
            const targetUserId = parts[0]?.match(/^[0-9]+$/) ? parts.shift() : userId;
            const newPrompt = parts.join(' ').trim();

            if (!newPrompt) {
                return await ctxFn.flowDynamic([
                    'Uso: /prompt <nuevo prompt del sistema>',
                    'o: /prompt <número> <nuevo prompt del sistema>'
                ]);
            }

            messageHistory.setSystemPrompt(targetUserId, newPrompt);
            return await ctxFn.flowDynamic(
                targetUserId === userId ? 
                'Prompt del sistema actualizado.' :
                `Prompt del sistema actualizado para el número ${targetUserId}.`
            );
        }

        // Comando reset
        const resetCommand = commands.reset.find(cmd => bodyText.startsWith(cmd));
        if (resetCommand) {
            const targetUserId = bodyText.slice(resetCommand.length).trim();
            if (targetUserId.match(/^[0-9]+$/)) {
                messageHistory.resetUserChat(targetUserId);
                return await ctxFn.flowDynamic(`Chat reiniciado para el número ${targetUserId}. El prompt del sistema se mantiene.`);
            }
            messageHistory.resetUserChat(userId);
            return await ctxFn.flowDynamic('Chat reiniciado. El prompt del sistema se mantiene. ¿En qué puedo ayudarte?');
        }

        // Comando /recordatorios
        if (bodyText === commands.recordatorios) {
            const response = reminderService.getActiveReminders(userId);
            return await ctxFn.flowDynamic(response);
        }

        // Comando de recordatorio
        if (bodyText.includes('recuérdame') || bodyText.includes('recuérdamelo')) {
            let reminderText = ctx.body;
            
            // Eliminar la palabra recuérdame/recuérdamelo del texto
            reminderText = reminderText
                .replace(/recuérdame/gi, '')
                .replace(/recuérdamelo/gi, '')
                .trim();
            
            if (!reminderText) {
                return await ctxFn.flowDynamic(
                    'Describe tu recordatorio en lenguaje natural.\n' +
                    'Ejemplos:\n' +
                    'por favor recuérdame mañana a las 3pm llamar a mamá\n' +
                    'necesito que me recuérdamelo el próximo viernes a las 2pm ir al dentista'
                );
            }

            const { date, formattedText } = await reminderService.parseNaturalLanguage(reminderText, userId);

            if (!date) {
                return await ctxFn.flowDynamic('No pude entender la fecha y hora del recordatorio. Por favor, sé más específico.');
            }

            const response = await reminderService.scheduleReminder(date, formattedText, userId, ctxFn);
            return await ctxFn.flowDynamic(response);
        }

        // Comando /delete-r
        if (bodyText === commands.deleteReminder) {
            const listResponse = reminderService.getActiveReminders(userId);
            await ctxFn.flowDynamic([
                listResponse,
                "Para eliminar un recordatorio, responde con /<número> del recordatorio que deseas eliminar.\nPor ejemplo: /2"
            ]);
            messageHistory.setLastMessage(userId, commands.deleteReminder);
            return;
        }

        // Procesar respuesta para eliminar recordatorio
        if (messageHistory.getLastMessage(userId) === commands.deleteReminder && /^\/\d+$/.test(bodyText)) {
            const index = parseInt(bodyText.slice(1)) - 1; // Removemos el '/' y convertimos a índice base 0
            const response = reminderService.deleteReminder(userId, index);
            messageHistory.clearLastMessage(userId);
            return await ctxFn.flowDynamic(response);
        }



        // Preguntas sobre imágenes
        if (commands.imageQuestions.some(indicator => bodyText.includes(indicator))) {
            const response = await askAboutImage(userId, ctx.body);
            return await ctxFn.flowDynamic(response);
        }

        // Respuesta normal del chat
        const currentDateTime = getCurrentDateTime();
        const systemPrompt = `${messageHistory.getSystemPrompt(userId) || prompts.defaultAssistant}\nFecha y hora actual en Cuba: ${currentDateTime}`;
        const response = await chat(systemPrompt, ctx.body, userId);
        await ctxFn.flowDynamic(response);
    });
