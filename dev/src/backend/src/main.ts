// File: dev/src/backend/src/main.ts
import express from "express"
import { initHandlers } from "./handlers/handler"
import { AppDataSource } from "./db/database"
import { swaggerDocs } from "./handlers/swagger/swagger"
import cors from "cors"

const app = async () => {
    const app = express()
    const port = 3001
    app.use(cors())
    app.use(express.json())
    initHandlers(app)
    try {
        await AppDataSource.initialize()
    } catch (error) {
        if (error instanceof Error) {
            console.error(error.message)
        }
    }

    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`)
        console.log(`Docs available at http://localhost:${port}/docs`)
        swaggerDocs(app, port);
    })
}

app();