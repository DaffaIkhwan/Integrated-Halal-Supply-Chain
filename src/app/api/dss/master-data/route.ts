import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Helper: Admin guard
async function guardAdmin() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN") return null;
  return session;
}

// ─── GET: Fetch all entity data ───
export async function GET() {
  try {
    const [
      farms, slaughterhouses, transporters, processingPlants,
      warehouses, distributors, retailOutlets, cattle, batches,
    ] = await Promise.all([
      prisma.farm.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.slaughterhouse.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.transporter.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.processingPlant.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.warehouse.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.distributor.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.retailOutlet.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.cattle.findMany({ include: { farm: { select: { name: true } }, batches: true }, orderBy: { createdAt: "desc" } }),
      prisma.halalBatch.findMany({
        include: {
          cattle: { include: { farm: { select: { name: true } } } },
          slaughterhouse: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      farms, slaughterhouses, transporters, processingPlants,
      warehouses, distributors, retailOutlets, cattle, batches,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── POST: Create entity ───
export async function POST(req: Request) {
  try {
    const session = await guardAdmin();
    if (!session) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });

    const body = await req.json();
    const { entity, data } = body;

    if (!entity || !data) {
      return NextResponse.json({ error: "entity dan data wajib diisi" }, { status: 400 });
    }

    let result;

    switch (entity) {
      case "farm":
        if (!data.name) return NextResponse.json({ error: "Nama farm wajib diisi" }, { status: 400 });
        result = await prisma.farm.create({ data: { name: data.name, location: data.location || null, address: data.address || null } });
        break;

      case "slaughterhouse":
        if (!data.name) return NextResponse.json({ error: "Nama RPH wajib diisi" }, { status: 400 });
        result = await prisma.slaughterhouse.create({ data: { name: data.name, location: data.location || null, address: data.address || null } });
        break;

      case "transporter":
        if (!data.name) return NextResponse.json({ error: "Nama transporter wajib diisi" }, { status: 400 });
        result = await prisma.transporter.create({ data: { name: data.name, vehicleNumber: data.vehicleNumber || null, vehicleType: data.vehicleType || null, location: data.location || null } });
        break;

      case "processingPlant":
        if (!data.name) return NextResponse.json({ error: "Nama pabrik wajib diisi" }, { status: 400 });
        result = await prisma.processingPlant.create({ data: { name: data.name, location: data.location || null, productionType: data.productionType || null } });
        break;

      case "warehouse":
        if (!data.name) return NextResponse.json({ error: "Nama gudang wajib diisi" }, { status: 400 });
        result = await prisma.warehouse.create({ data: { name: data.name, location: data.location || null, storageType: data.storageType || null } });
        break;

      case "distributor":
        if (!data.name) return NextResponse.json({ error: "Nama distributor wajib diisi" }, { status: 400 });
        result = await prisma.distributor.create({ data: { name: data.name, location: data.location || null, coverageArea: data.coverageArea || null } });
        break;

      case "retailOutlet":
        if (!data.name) return NextResponse.json({ error: "Nama outlet wajib diisi" }, { status: 400 });
        result = await prisma.retailOutlet.create({ data: { name: data.name, location: data.location || null, outletType: data.outletType || null } });
        break;

      case "cattle":
        if (!data.earTag || !data.farmId) return NextResponse.json({ error: "EarTag dan Farm wajib diisi" }, { status: 400 });
        const existsCattle = await prisma.cattle.findUnique({ where: { earTag: data.earTag } });
        if (existsCattle) return NextResponse.json({ error: "EarTag sudah terdaftar" }, { status: 400 });
        result = await prisma.cattle.create({ data: { earTag: data.earTag, breed: data.breed || null, farmId: data.farmId, birthDate: data.birthDate ? new Date(data.birthDate) : null } });
        break;

      case "halalBatch":
        if (!data.cattleId || !data.slaughterhouseId) return NextResponse.json({ error: "Sapi dan RPH wajib diisi" }, { status: 400 });
        result = await prisma.halalBatch.create({ data: { cattleId: data.cattleId, slaughterhouseId: data.slaughterhouseId, butcherName: data.butcherName || null, productionDate: data.productionDate ? new Date(data.productionDate) : new Date() } });
        break;

      default:
        return NextResponse.json({ error: `Entity "${entity}" tidak valid` }, { status: 400 });
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── PATCH: Update entity ───
export async function PATCH(req: Request) {
  try {
    const session = await guardAdmin();
    if (!session) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });

    const body = await req.json();
    const { entity, id, data } = body;

    if (!entity || !id || !data) {
      return NextResponse.json({ error: "entity, id, dan data wajib diisi" }, { status: 400 });
    }

    let result;

    switch (entity) {
      case "farm":
        result = await prisma.farm.update({ where: { id }, data: { name: data.name, location: data.location, address: data.address } });
        break;
      case "slaughterhouse":
        result = await prisma.slaughterhouse.update({ where: { id }, data: { name: data.name, location: data.location, address: data.address } });
        break;
      case "transporter":
        result = await prisma.transporter.update({ where: { id }, data: { name: data.name, vehicleNumber: data.vehicleNumber, vehicleType: data.vehicleType, location: data.location } });
        break;
      case "processingPlant":
        result = await prisma.processingPlant.update({ where: { id }, data: { name: data.name, location: data.location, productionType: data.productionType } });
        break;
      case "warehouse":
        result = await prisma.warehouse.update({ where: { id }, data: { name: data.name, location: data.location, storageType: data.storageType } });
        break;
      case "distributor":
        result = await prisma.distributor.update({ where: { id }, data: { name: data.name, location: data.location, coverageArea: data.coverageArea } });
        break;
      case "retailOutlet":
        result = await prisma.retailOutlet.update({ where: { id }, data: { name: data.name, location: data.location, outletType: data.outletType } });
        break;
      case "cattle":
        result = await prisma.cattle.update({ where: { id }, data: { earTag: data.earTag, breed: data.breed, farmId: data.farmId, birthDate: data.birthDate ? new Date(data.birthDate) : undefined } });
        break;
      case "halalBatch":
        result = await prisma.halalBatch.update({ where: { id }, data: { cattleId: data.cattleId, slaughterhouseId: data.slaughterhouseId, butcherName: data.butcherName, productionDate: data.productionDate ? new Date(data.productionDate) : undefined } });
        break;
      default:
        return NextResponse.json({ error: `Entity "${entity}" tidak valid` }, { status: 400 });
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── DELETE: Remove entity ───
export async function DELETE(req: Request) {
  try {
    const session = await guardAdmin();
    if (!session) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });

    const body = await req.json();
    const { entity, id } = body;

    if (!entity || !id) {
      return NextResponse.json({ error: "entity dan id wajib diisi" }, { status: 400 });
    }

    switch (entity) {
      case "farm":
        await prisma.farm.delete({ where: { id } });
        break;
      case "slaughterhouse":
        await prisma.slaughterhouse.delete({ where: { id } });
        break;
      case "transporter":
        await prisma.transporter.delete({ where: { id } });
        break;
      case "processingPlant":
        await prisma.processingPlant.delete({ where: { id } });
        break;
      case "warehouse":
        await prisma.warehouse.delete({ where: { id } });
        break;
      case "distributor":
        await prisma.distributor.delete({ where: { id } });
        break;
      case "retailOutlet":
        await prisma.retailOutlet.delete({ where: { id } });
        break;
      case "cattle":
        await prisma.cattle.delete({ where: { id } });
        break;
      case "halalBatch":
        await prisma.halalBatch.delete({ where: { id } });
        break;
      default:
        return NextResponse.json({ error: `Entity "${entity}" tidak valid` }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === "P2003") {
      return NextResponse.json({ error: "Data tidak bisa dihapus karena masih digunakan oleh data lain." }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
