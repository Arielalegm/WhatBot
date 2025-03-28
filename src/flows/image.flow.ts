import { addKeyword, EVENTS } from '@builderbot/bot'
import { unlink } from 'fs/promises'
import { image2text, messageHistory } from '../scripts/gemini'

export const imageFlow = addKeyword(EVENTS.MEDIA)
    .addAction(async (ctx, ctxFn) => {
        const userId = ctx.from;
        const messageText = ctx.body || "Por favor, describe esta imagen en español de manera detallada y natural.";

        const localPath = await ctxFn.provider.saveFile(ctx, { path: './assets' });
        
        setTimeout(async () => {
            try {
                await unlink(localPath);
                messageHistory.removeLastImage(userId);
                console.log(`Imagen eliminada: ${localPath}`);
            } catch (error) {
                console.error('Error al eliminar imagen:', error);
            }
        }, 300000);

        const response = await image2text(messageText, localPath, userId);
        await ctxFn.flowDynamic([
            response,
            "Puedes hacerme preguntas específicas sobre esta imagen durante los próximos 5 minutos."
        ]);
    });
