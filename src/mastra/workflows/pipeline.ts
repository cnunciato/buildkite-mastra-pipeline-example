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
            command: "echo 'Hi from step1!'",
        });

        await pipeline.upload();
        const result = await pipeline.complete();
        return result;
    },
});

const step2 = createStep({
    id: "step2",
    inputSchema: z.string().describe("The result of the previous step"),
    outputSchema: z.string().describe("The result of the this step"),
    execute: async () => {
        const pipeline = new Pipeline();

        pipeline.addStep({
            label: ":wave: Hi from step2",
            command: "echo 'Hi from step2!'",
        });

        await pipeline.upload();
        let result = await pipeline.complete();

        if (result === "success") {
            const pipeline = new Pipeline();

            pipeline.addStep({
                label: ":point_right: I'm a follow-up from step 2!",
                command: "echo 'I'm a follow-up from step 2!",
            });

            await pipeline.upload();
            result = await pipeline.complete();
        }

        return result;
    },
});

const step3 = createStep({
    id: "step3",
    inputSchema: z.string().describe("The result of the previous step"),
    outputSchema: z.string().describe("The result of the this step"),
    execute: async () => {
        const pipeline = new Pipeline();

        pipeline.addStep({
            label: ":wave: Hi from step3",
            command: "echo 'Hi from step3'",
        });

        await pipeline.upload();
        const result = await pipeline.complete();
        return result;
    },
});

export const pipeline = createWorkflow({
    id: "pipeline",
    inputSchema: z.string().describe("Some input"),
    outputSchema: z.array(z.string()).describe("All step results"),
})
    .parallel([step1, step2, step3])
    .commit();
