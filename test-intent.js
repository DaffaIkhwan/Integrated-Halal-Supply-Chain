import { classifyIntent } from './src/lib/ml/intent-classifier.js';

async function test() {
    console.log("Testing Intent Classifier...");
    const res = await classifyIntent("Apa itu BPJPH?");
    console.log("Result:", res);
}

test();
