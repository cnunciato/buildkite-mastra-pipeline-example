import { Pipeline as BuildkitePipeline, CommandStep, PipelineStep } from "@buildkite/buildkite-sdk";
import short from "short-uuid";
import { spawn, exec } from "node:child_process";

export class Pipeline extends BuildkitePipeline {
    private id: string;
    private key: string;

    constructor() {
        super();

        this.id = short.generate();
        this.key = `pipeline-${this.id}-result`;
    }

    addStep(step: CommandStep) {
        console.log(`--- Adding step for pipeline ${this.id}`);
        const commands = Array.isArray(step.commands) ? step.commands : [step.command];

        commands.push(
            `sleep ${Math.ceil(Math.random() * 10)}`,
            `buildkite-agent meta-data set "${this.key}" "success"`,
        );

        super.addStep({
            label: step.label,
            command: commands.join(" && "),
        });

        return this;
    }

    async upload() {
        console.log(`--- Uploading pipeline ${this.id}`);
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

            child.stdin.write(this.toYAML());
            child.stdin.end();
        });
    }

    async complete(): Promise<"success" | "error"> {
        console.log(`--- Waiting for pipeline ${this.id}`);

        while (true) {
            try {
                const result = await this.getMetadata();
                return result === "success" ? "success" : "error";
            } catch {
                // Retry.
            }
            await new Promise(r => setTimeout(r, 2000));
        }
    }

    private async getMetadata(): Promise<string> {
        return new Promise((resolve, reject) => {
            exec(
                `buildkite-agent meta-data get "${this.key}"`,
                { encoding: "utf8" },
                (err, stdout) => {
                    if (err) return reject(err);
                    resolve(stdout.trim());
                },
            );
        });
    }
}
