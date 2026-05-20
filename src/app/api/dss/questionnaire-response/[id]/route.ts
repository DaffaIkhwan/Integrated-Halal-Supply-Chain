import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db/client';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET – fetch a single questionnaire response by its ID (including files)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing id query parameter' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const bypassEmailFilter = searchParams.get('bypassEmailFilter') === 'true';

    // RBAC: non‑admin users can only fetch their own responses unless bypassEmailFilter is set
    const where: any = { id };
    if (!session || (session.user?.role !== 'ADMIN' && !session.user?.role?.startsWith('PAKAR') && !bypassEmailFilter)) {
      const email = session?.user?.email;
      if (email) where.respondentEmail = email;
    }

    const response = await prisma.questionnaireResponse.findFirst({
      where,
    });

    if (!response) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 });
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('GET single questionnaire response error:', error);
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
