/**
 * Deduplicate CriteriaWeight rows and verify data integrity
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Count total
  const total = await prisma.criteriaWeight.count();
  console.log(`Total CriteriaWeight rows: ${total}`);

  // Find duplicates
  const all = await prisma.criteriaWeight.findMany({
    orderBy: [{ criticalPointId: 'asc' }, { criteriaCode: 'asc' }, { createdAt: 'asc' }],
  });

  const seen = new Map<string, string>(); // key → first id
  const toDelete: string[] = [];

  for (const cw of all) {
    const key = `${cw.criticalPointId}_${cw.criteriaCode}`;
    if (seen.has(key)) {
      toDelete.push(cw.id);
    } else {
      seen.set(key, cw.id);
    }
  }

  console.log(`Duplicates found: ${toDelete.length}`);

  if (toDelete.length > 0) {
    await prisma.criteriaWeight.deleteMany({
      where: { id: { in: toDelete } },
    });
    console.log(`✅ Deleted ${toDelete.length} duplicate rows.`);
  }

  // Verify
  const afterCount = await prisma.criteriaWeight.count();
  console.log(`After dedup: ${afterCount} rows`);

  // Show per CP
  const cps = await prisma.criticalPoint.findMany({
    include: { criteriaWeights: { orderBy: { criteriaCode: 'asc' } } },
    orderBy: { id: 'asc' },
  });
  for (const cp of cps) {
    console.log(`  ${cp.id}: ${cp.criteriaWeights.length} criteria (gw=${cp.globalWeight.toFixed(4)})`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
