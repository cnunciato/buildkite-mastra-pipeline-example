import { mastra } from "../mastra";

try {
    const run = await mastra.getWorkflow("pipeline").createRunAsync();
    const result = await run.start({
        inputData: "Some input",
    });

    console.log("--- Getting result");
    console.log({ result });

    process.exit(0);
} catch (error) {
    console.error(error);
    process.exit(1);
}
