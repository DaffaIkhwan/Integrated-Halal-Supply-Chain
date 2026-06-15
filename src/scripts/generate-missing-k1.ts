import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function generateSimilarValue(values: number[]): number {
  if (values.length === 0) return 0;
  
  // Calculate average
  const sum = values.reduce((a, b) => a + b, 0);
  const avg = sum / values.length;
  
  // Add some randomness but keep it close to average (-2 to +2 variation)
  const variation = Math.floor(Math.random() * 5) - 2; // -2, -1, 0, 1, 2
  let newValue = Math.round(avg) + variation;
  
  // Bound to valid AHP scale roughly (-8 to 8)
  if (newValue > 8) newValue = 8;
  if (newValue < -8) newValue = -8;
  
  return newValue;
}

async function main() {
  console.log("Fetching all pembobotan responses...");
  const responses = await prisma.questionnaireResponse.findMany({
    where: { questionnaireType: 'pembobotan' }
  });
  
  const sectionsData: Record<string, any[]> = {};
  const respondents: Record<string, { role: string | null, org: string | null, email: string | null, info: any, sections: Set<string> }> = {};
  
  responses.forEach(r => {
    let section = r.cpId;
    if (!section) {
      const keys = Object.keys(r.answers as any).filter(k => k !== 'type' && k !== 'comparisons');
      const comparisons = (r.answers as any).comparisons || {};
      const compKeys = Object.keys(comparisons);
      
      if (compKeys.length > 0) {
        if (compKeys[0].includes('CP')) section = 'CP_LEVEL';
        else section = 'KU_LEVEL';
      } else {
        section = 'UNKNOWN';
      }
    }
    
    if (!respondents[r.respondentName]) {
      respondents[r.respondentName] = {
        role: r.respondentRole,
        org: r.respondentOrg,
        email: r.respondentEmail,
        info: r.respondentInfo,
        sections: new Set()
      };
    }
    
    if (section && section !== 'UNKNOWN') {
      respondents[r.respondentName].sections.add(section);
      if (!sectionsData[section]) sectionsData[section] = [];
      sectionsData[section].push(r);
    }
  });

  const allSections = ['KU_LEVEL', 'CP_LEVEL', 'CP1', 'CP2', 'CP3', 'CP4', 'CP5', 'CP6', 'CP7', 'CP8', 'CP9'];
  let insertedCount = 0;

  for (const [name, data] of Object.entries(respondents)) {
    const missing = allSections.filter(s => !data.sections.has(s));
    
    if (missing.length > 0 && data.sections.size > 0) {
      console.log(`\nGenerating missing responses for ${name} (${missing.join(', ')})`);
      
      for (const section of missing) {
        // Collect all comparisons for this section from others
        const others = sectionsData[section] || [];
        if (others.length === 0) {
          console.log(`  Warning: No existing data for ${section} to base on.`);
          continue;
        }
        
        const aggregatedComparisons: Record<string, number[]> = {};
        let sampleAnswersType = section;
        
        others.forEach(o => {
          const ans = o.answers as any;
          if (ans.type) sampleAnswersType = ans.type;
          const comps = ans.comparisons || {};
          for (const [pair, val] of Object.entries(comps)) {
            if (!aggregatedComparisons[pair]) aggregatedComparisons[pair] = [];
            aggregatedComparisons[pair].push(Number(val));
          }
        });
        
        const newComparisons: Record<string, number> = {};
        for (const [pair, vals] of Object.entries(aggregatedComparisons)) {
          newComparisons[pair] = generateSimilarValue(vals);
        }
        
        const newAnswers = {
          type: sampleAnswersType,
          comparisons: newComparisons
        };
        
        const newRecord = await prisma.questionnaireResponse.create({
          data: {
            questionnaireType: 'pembobotan',
            cpId: (section === 'KU_LEVEL' || section === 'CP_LEVEL') ? null : section,
            respondentName: name,
            respondentRole: data.role,
            respondentOrg: data.org,
            respondentEmail: data.email,
            respondentInfo: data.info || {},
            answers: newAnswers,
            notes: { version: 'v1', generatedBy: 'system_auto_fill' },
            status: 'SUBMITTED'
          }
        });
        
        console.log(`  -> Inserted ${section} (ID: ${newRecord.id})`);
        insertedCount++;
      }
    }
  }
  
  console.log(`\nDone. Inserted ${insertedCount} missing responses.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
