import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const responses = await prisma.questionnaireResponse.findMany({
    where: { questionnaireType: 'pembobotan' }
  });
  
  const respondentCounts: Record<string, number> = {};
  const respondentData: Record<string, { role: string | null; org: string | null; email: string | null; sections: string[] }> = {};
  
  responses.forEach(r => {
    if (!respondentCounts[r.respondentName]) {
      respondentCounts[r.respondentName] = 0;
      respondentData[r.respondentName] = {
        role: r.respondentRole,
        org: r.respondentOrg,
        email: r.respondentEmail,
        sections: []
      };
    }
    respondentCounts[r.respondentName]++;
    
    // determine section
    let section = r.cpId;
    if (!section) {
      const keys = Object.keys(r.answers as any);
      if (keys.length > 0) {
        if (keys[0].includes('CP')) section = 'CP_LEVEL';
        else section = 'KU_LEVEL';
      } else {
        section = 'UNKNOWN_NULL';
      }
    }
    
    if (section) respondentData[r.respondentName].sections.push(section);
  });

  console.log("=== Respondents with < 11 responses ===");
  const allSections = ['KU_LEVEL', 'CP_LEVEL', 'CP1', 'CP2', 'CP3', 'CP4', 'CP5', 'CP6', 'CP7', 'CP8', 'CP9'];
  
  for (const [name, data] of Object.entries(respondentData)) {
    const count = data.sections.length;
    if (count < 11) {
      const missing = allSections.filter(s => !data.sections.includes(s));
      console.log(`\nName: ${name} (${data.role} - ${data.org})`);
      console.log(`Email: ${data.email}`);
      console.log(`Count: ${count}/11`);
      console.log(`Completed: ${data.sections.join(', ')}`);
      console.log(`Missing: ${missing.join(', ')}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
