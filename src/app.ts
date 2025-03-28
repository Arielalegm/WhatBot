import { createBot, createProvider, createFlow } from '@builderbot/bot'
import { MemoryDB as Database } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import "dotenv/config"

import { welcomeFlow } from './flows/welcome.flow'
import { mainFlow } from './flows/main.flow'
import { imageFlow } from './flows/image.flow'
import { audioFlow } from './flows/audio.flow'
import { ReminderService } from './services/reminderService'

// Crear instancia compartida del ReminderService
export const reminderService = new ReminderService()

const PORT = process.env.PORT ?? 3009

const main = async () => {
    const adapterFlow = createFlow([welcomeFlow, mainFlow, imageFlow, audioFlow])
    const adapterProvider = createProvider(Provider)
    const adapterDB = new Database()

    const { handleCtx, httpServer } = await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })
    
    httpServer(+PORT)
}

main()
