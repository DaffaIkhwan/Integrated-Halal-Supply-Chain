import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const id = "8c58af7c-ade1-41c6-a9fb-57fac9eeeefd";
  try {
    const response = await prisma.questionnaireResponse.findUnique({
      where: { id },
    });
    console.log("SUCCESS:", JSON.stringify(response, null, 2));
  } catch (error) {
    console.error("ERROR:", error);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
