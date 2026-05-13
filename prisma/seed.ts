/**
 * Master Seed Script for Halal Supply Chain DSS
 * 
 * Orchestrates the full seeding process:
 * 1. Seed Criteria & Critical Points metadata
 * 2. Parse and seed pairwise comparison matrices from Excel
 * 3. Recalculate all Fuzzy AHP weights using FSE
 * 4. Seed mock operational data (Farm, Cattle, Batches, CP Records)
 * 
 * Run: npx prisma db seed
 */

import { execSync } from 'child_process';
import path from 'path';

function runScript(scriptName: string) {
    console.log(`\n======================================================`);
    console.log(`🚀 RUNNING: ${scriptName}`);
    console.log(`======================================================`);
    
    const scriptPath = path.join(process.cwd(), 'src', 'scripts', scriptName);
    
    try {
        // Use tsx to execute typescript scripts directly
        execSync(`npx tsx ${scriptPath}`, { stdio: 'inherit' });
        console.log(`✅ SUCCESS: ${scriptName}\n`);
    } catch (error) {
        console.error(`❌ FAILED: ${scriptName}`);
        console.error(error);
        process.exit(1);
    }
}

async function main() {
    console.log('\n🌟 STARTING MASTER DATABASE SEEDING 🌟\n');

    // Step 1: Initialize metadata (Critical Points, Criteria Weight definitions)
    runScript('seed-criteria.ts');

    // Step 2: Extract matrices from Excel (AHP Expert Input)
    runScript('seed-pairwise.ts');

    // Step 3: Compute Fuzzy AHP weights and save to DB
    runScript('recalculate-weights.ts');

    // Step 4: Inject mock operational data to test traceability and risk calculations
    runScript('seed-operations.ts');

    console.log('🎉 ALL SEEDING PROCESSES COMPLETED SUCCESSFULLY! 🎉\n');
}

main().catch(console.error);
