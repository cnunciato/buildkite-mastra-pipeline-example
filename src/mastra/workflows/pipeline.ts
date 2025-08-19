import { createStep, createWorkflow } from "@mastra/core/workflows";
import { Pipeline } from "./mock";
import { z } from "zod";

const step1 = createStep({
    id: "step1",
    inputSchema: z.string(),
    outputSchema: z.string(),
    execute: async () => {
        const pipeline = new Pipeline();

        pipeline.addStep({
            label: ":wave: Hi from step1",
            command: `echo 'Hi from step1!'`,
        });

        await pipeline.upload();
        const result = await pipeline.complete();
        return result;
    },
});

const step2 = createStep({
    id: "step2",
    inputSchema: z.string(),
    outputSchema: z.string(),
    execute: async () => {
        const pipeline = new Pipeline();

        pipeline.addStep({
            label: ":wave: Hi from step2",
            command: `echo 'Hi from step2!'`,
        });

        await pipeline.upload();
        const result = await pipeline.complete();

        if (result === "success") {
            const pipeline = new Pipeline();

            pipeline.addStep({
                label: ":point_right: I'm a follow-up from step 2!",
                command: `echo 'I'm a follow-up from step 2!'`,
            });

            await pipeline.upload();
            await pipeline.complete();
        }

        return result;
    },
});

const step3 = createStep({
    id: "step3",
    inputSchema: z.string({}),
    outputSchema: z.string({}),
    execute: async () => {
        const pipeline = new Pipeline();

        pipeline.addStep({
            label: ":wave: Hi from step3",
            command: `echo 'Hi from step3'`,
        });

        await pipeline.upload();
        const result = await pipeline.complete();
        return result;
    },
});

export const pipeline = createWorkflow({
    id: "pipeline",
    inputSchema: z.string({}),
    outputSchema: z.string({}),
})
    .parallel([step1, step2, step3])
    .commit();
