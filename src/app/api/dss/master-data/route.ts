import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function GET() {
  try {
    const farms = await prisma.farm.findMany({
      select: { id: true, name: true }
    });
    const slaughterhouses = await prisma.slaughterhouse.findMany({
      select: { id: true, name: true }
    });
    const cattle = await prisma.cattle.findMany({
      include: {
        farm: true,
        batches: true
      },
      orderBy: { createdAt: 'desc' }
    });
    const batches = await prisma.halalBatch.findMany({
      include: {
        cattle: true,
        slaughterhouse: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ farms, slaughterhouses, cattle, batches });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "CREATE_CATTLE") {
      const { earTag, breed, farmId } = body;
      if (!earTag || !farmId) return NextResponse.json({ error: "EarTag dan Farm harus diisi" }, { status: 400 });
      
      const exists = await prisma.cattle.findUnique({ where: { earTag } });
      if (exists) return NextResponse.json({ error: "EarTag Sapi sudah terdaftar!" }, { status: 400 });

      const newCattle = await prisma.cattle.create({
        data: {
          earTag,
          breed,
          farmId,
          birthDate: new Date(),
        }
      });
      return NextResponse.json({ success: true, cattle: newCattle });
    }

    if (action === "CREATE_BATCH") {
      const { cattleId, slaughterhouseId } = body;
      if (!cattleId || !slaughterhouseId) return NextResponse.json({ error: "Sapi dan RPH harus dipilih" }, { status: 400 });
      
      const newBatch = await prisma.halalBatch.create({
        data: {
          cattleId,
          slaughterhouseId,
          productionDate: new Date()
        }
      });
      return NextResponse.json({ success: true, batch: newBatch });
    }

    return NextResponse.json({ error: "Action tidak valid" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
