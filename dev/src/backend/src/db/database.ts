// File: dev/src/backend/src/db/database.ts
import path from "path";
import { DataSource } from "typeorm";
import { config } from "../config/config";



export const AppDataSource = new DataSource({
    type: "postgres",
    host: config.dbHost,
    port: 5432,
    username: config.dbUser,
    password: config.dbPassword,
    database: config.dbName,
    logging: true,
    synchronize: config.dbSynchronise,
    entities: [path.join(__dirname, "models/*.ts")]
})
