import { createStep, createWorkflow } from "@mastra/core/workflows";
import { Pipeline } from "@buildkite/buildkite-sdk";
import { execSync } from "node:child_process";
import { z } from "zod";

function addPipelineStep(step: number) {
    const pipeline = new Pipeline();

    pipeline.addStep({
        label: `:wave: Hi from step${step}!`,
        command: `echo 'Hi from step${step}!'`,
    });

    return execSync("buildkite-agent pipeline upload", {
        input: pipeline.toYAML(),
        encoding: "utf8",
    }).trim();
}

const step1 = createStep({
    id: "step1",
    inputSchema: z.string(),
    outputSchema: z.string(),
    execute: async () => {
        return addPipelineStep(1);
    },
});

const step2 = createStep({
    id: "step2",
    inputSchema: z.string(),
    outputSchema: z.string(),
    execute: async () => {
        return addPipelineStep(2);
    },
});

const step3 = createStep({
    id: "step3",
    inputSchema: z.string({}),
    outputSchema: z.string({}),
    execute: async () => {
        return addPipelineStep(3);
    },
});

export const pipeline = createWorkflow({
    id: "pipeline",
    inputSchema: z.string({}),
    outputSchema: z.string({}),
})
    .parallel([step1, step2, step3])
    .commit();
