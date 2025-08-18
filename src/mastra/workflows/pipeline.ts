import { createStep, createWorkflow } from "@mastra/core/workflows";
import { Pipeline } from "@buildkite/buildkite-sdk";
import { execSync, spawn } from "node:child_process";
import { z } from "zod";

// function addPipelineStep(step: number) {
//     const pipeline = new Pipeline();

//     pipeline.addStep({
//         label: `:wave: Hi from step${step}!`,
//         command: `echo 'Hi from step${step}!'`,
//     });

//     return execSync("buildkite-agent pipeline upload", {
//         input: pipeline.toYAML(),
//         encoding: "utf8",
//     }).trim();
// }

async function addPipelineStep(step: number): Promise<string> {
    const pipeline = new Pipeline();

    pipeline.addStep({
        label: `:wave: Hi from step${step}!`,
        command: `echo 'Hi from step${step}!'`,
    });

    return new Promise((resolve, reject) => {
        const child = spawn("buildkite-agent", ["pipeline", "upload"], {
            stdio: ["pipe", "pipe", "pipe"], // stdin, stdout, stderr
        });

        let output = "";
        let error = "";

        child.stdout.on("data", chunk => {
            output += chunk.toString();
        });

        child.stderr.on("data", chunk => {
            error += chunk.toString();
        });

        child.on("close", code => {
            if (code === 0) {
                resolve(output.trim());
            } else {
                reject(new Error(error || `Exited with code ${code}`));
            }
        });

        // send pipeline YAML to stdin
        child.stdin.write(pipeline.toYAML());
        child.stdin.end();
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
