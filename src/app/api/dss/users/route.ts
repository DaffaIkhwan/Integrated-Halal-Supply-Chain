import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { auth } from "@/lib/auth";
import { hash } from "bcryptjs";

export const dynamic = 'force-dynamic';

// GET — list all users (admin only)
export async function GET() {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        orgId: true,
        orgName: true,
        isBanned: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get all organizations for dropdowns
    const farms = await prisma.farm.findMany({ select: { id: true, name: true } });
    const slaughterhouses = await prisma.slaughterhouse.findMany({ select: { id: true, name: true } });
    const transporters = await prisma.transporter.findMany({ select: { id: true, name: true } });
    const processingPlants = await prisma.processingPlant.findMany({ select: { id: true, name: true } });
    const warehouses = await prisma.warehouse.findMany({ select: { id: true, name: true } });
    const distributors = await prisma.distributor.findMany({ select: { id: true, name: true } });
    const retailers = await prisma.retailOutlet.findMany({ select: { id: true, name: true } });

    return NextResponse.json({
      users,
      organizations: {
        CP1_FARM: farms,
        CP2_FEED: farms,
        CP3_TRANSPORT: transporters,
        CP4_SLAUGHTER: slaughterhouses,
        CP5_POST_SLAUGHTER: slaughterhouses,
        CP6_PROCESSING: processingPlants,
        CP7_STORAGE: warehouses,
        CP8_DISTRIBUTION: distributors,
        CP9_RETAIL: retailers,
        CP10_CONSUMER: retailers,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST — create new user (admin only)
export async function POST(req: Request) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, password, role, phone, orgId, orgName } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Nama, Email, Password, dan Role wajib diisi" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
    }

    const hashedPassword = await hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        phone: phone || null,
        orgId: orgId || null,
        orgName: orgName || null,
      },
    });

    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH — toggle ban/unban user (admin only)
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, isBanned } = body;

    if (!userId || typeof isBanned !== "boolean") {
      return NextResponse.json({ error: "userId dan isBanned wajib diisi" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isBanned },
      select: { id: true, name: true, isBanned: true },
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
