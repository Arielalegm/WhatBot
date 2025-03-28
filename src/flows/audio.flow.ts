import { addKeyword, EVENTS } from '@builderbot/bot'
import { unlink } from 'fs/promises'
import { chat } from '../scripts/gemini'
import { commands, defaultSystemPrompt } from '../config/llmConfig'
import { WebService } from '../services/webSearch'
import { AudioTranscriptionService } from '../services/audioTranscription'
import { reminderService } from '../app'

const webService = new WebService();
const audioService = new AudioTranscriptionService();

export const audioFlow = addKeyword(EVENTS.VOICE_NOTE)
    .addAction(async (ctx, ctxFn) => {
        const userId = ctx.from;
        await ctxFn.flowDynamic('🎧 Procesando el audio...');
        
        const localPath = await ctxFn.provider.saveFile(ctx, { path: './assets' });
        
        setTimeout(async () => {
            try {
                await unlink(localPath);
                console.log(`Audio eliminado: ${localPath}`);
            } catch (error) {
                console.error('Error al eliminar audio:', error);
            }
        }, 60000);

        const transcription = await audioService.transcribeAudio(localPath);
        const transcriptionLower = transcription.toLowerCase();
        
        // Procesar recordatorios primero
        if (transcriptionLower.includes('recuérdame') || transcriptionLower.includes('recuérdamelo')) {
            const reminderText = transcription
                .replace(/recuérdame/gi, '')
                .replace(/recuérdamelo/gi, '')
                .trim();

            const { date, formattedText } = await reminderService.parseNaturalLanguage(reminderText, userId);

            if (!date) {
                return await ctxFn.flowDynamic([
                    `🗣️ *Transcripción:*\n${transcription}\n\n` +
                    `📝 *Respuesta:*\nNo pude entender la fecha y hora del recordatorio. Por favor, sé más específico.`
                ]);
            }

            const response = await reminderService.scheduleReminder(date, formattedText, userId, ctxFn);
            return await ctxFn.flowDynamic([
                `🗣️ *Transcripción:*\n${transcription}\n\n📝 *Respuesta:*\n${response}`
            ]);
        }

        // Continuar con el resto de la lógica existente
        if (transcriptionLower.startsWith(commands.search)) {
            const query = transcription.slice(commands.search.length).trim();
            if (query) {
                await ctxFn.flowDynamic('🔍 Buscando información...');
                const result = await webService.searchGoogle(query, userId);
                return await ctxFn.flowDynamic([
                    `🗣️ *Transcripción:*\n${transcription}\n\n📝 *Respuesta:*\n${result}`
                ]);
            }
            return await ctxFn.flowDynamic([
                `🗣️ *Transcripción:*\n${transcription}\n\n📝 *Respuesta:*\nUso: busca en internet <tu búsqueda>`
            ]);
        }

        const response = await chat(defaultSystemPrompt, transcription, userId);
        await ctxFn.flowDynamic([
            `🗣️ *Transcripción:*\n${transcription}\n\n📝 *Respuesta:*\n${response}`
        ]);
    });
