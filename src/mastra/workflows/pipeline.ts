import { createStep, createWorkflow } from "@mastra/core/workflows";
import { Pipeline } from "@buildkite/buildkite-sdk";
import { spawn, exec } from "node:child_process";
import { z } from "zod";

async function getMetadata(key: string): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(`buildkite-agent meta-data get "${key}"`, { encoding: "utf8" }, (err, stdout) => {
            if (err) return reject(err);
            resolve(stdout.trim());
        });
    });
}

async function waitForStepResult(step: number, delay = 5000): Promise<string> {
    while (true) {
        try {
            const result = await getMetadata(`step${step}Result`);
            if (result) {
                return result;
            }
        } catch {
            // Retry.
        }
        await new Promise(r => setTimeout(r, delay));
    }
}

async function uploadStep(step: number, parent?: number): Promise<string> {
    const pipeline = new Pipeline();

    pipeline.addStep({
        id: `step${step}`,
        label: `:wave: Hi from step${step}!`,
        commands: [
            `echo 'Hi from step${step}!'`,

            // Set the "success" of this step.
            `sleep 10`,
            `buildkite-agent meta-data set "step${step}Result" "success"`,
        ],
        depends_on: parent ? `step${parent}` : undefined,
    });

    return new Promise((resolve, reject) => {
        const child = spawn("buildkite-agent", ["pipeline", "upload"], {
            stdio: ["pipe", "pipe", "pipe"],
        });

        let output = "";
        let error = "";

        child.stdout.on("data", chunk => (output += chunk.toString()));
        child.stderr.on("data", chunk => (error += chunk.toString()));
        child.on("close", code =>
            code === 0
                ? resolve(output.trim())
                : reject(new Error(error || `Exited with code ${code}`)),
        );

        child.stdin.write(pipeline.toYAML());
        child.stdin.end();
    });
}

const step1 = createStep({
    id: "step1",
    inputSchema: z.string(),
    outputSchema: z.string(),
    execute: async () => {
        await uploadStep(1);
        return await waitForStepResult(1);
    },
});

const step2 = createStep({
    id: "step2",
    inputSchema: z.string(),
    outputSchema: z.string(),
    execute: async () => {
        await uploadStep(2);
        const result = await waitForStepResult(2);

        if (result === "success") {
            uploadStep(4, 2);
        }

        return result;
    },
});

const step3 = createStep({
    id: "step3",
    inputSchema: z.string({}),
    outputSchema: z.string({}),
    execute: async () => {
        await uploadStep(3);
        return await waitForStepResult(3);
    },
});

export const pipeline = createWorkflow({
    id: "pipeline",
    inputSchema: z.string({}),
    outputSchema: z.string({}),
})
    .parallel([step1, step2, step3])
    .commit();
