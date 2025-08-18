import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";
import { pipeline } from "./workflows/pipeline";

export const mastra = new Mastra({
    workflows: { pipeline },
    storage: new LibSQLStore({
        url: "file:../mastra.db",
    }),
    logger: new PinoLogger({
        name: "Mastra",
        level: "info",
    }),
});
