import { createStep, createWorkflow } from "@mastra/core/workflows";
import { Pipeline } from "@buildkite/buildkite-sdk";
import { execSync, spawn } from "node:child_process";
import { z } from "zod";

async function addPipelineStep(step: number): Promise<string> {
    const pipeline = new Pipeline();

    pipeline.addStep({
        label: `:wave: Hi from step${step}!`,
        command: `echo 'Hi from step${step}!'`,
    });

    return new Promise((resolve, reject) => {
        const child = spawn("buildkite-agent", ["pipeline", "upload"], {
            stdio: ["pipe", "inherit", "inherit"], // stdin piped, stdout/stderr inherited
        });

        child.on("error", reject);
        child.on("close", code => {
            if (code === 0) resolve(`step${step} uploaded`);
            else reject(new Error(`buildkite-agent exited with code ${code}`));
        });

        child.stdin.end(pipeline.toYAML());
    });
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
    // Run these steps in parallel.
    .parallel([step1, step2, step3])
    .commit();
