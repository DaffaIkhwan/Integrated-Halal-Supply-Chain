import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db/client';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET — list questionnaire responses with filters
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // pembobotan | risiko | aktual
    const cpId = searchParams.get('cpId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';

    const where: Record<string, unknown> = {};
    if (type) where.questionnaireType = type;
    if (cpId) where.cpId = cpId;
    if (search) {
      where.OR = [
        { respondentName: { contains: search, mode: 'insensitive' } },
        { respondentOrg: { contains: search, mode: 'insensitive' } },
        { respondentEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    const bypassEmailFilter = searchParams.get('bypassEmailFilter') === 'true';

    // RBAC: Restrict non-admin users to their own data
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role || '';
    const isPrivileged = userRole === 'ADMIN' || userRole.startsWith('PAKAR');

    if (!isPrivileged && !bypassEmailFilter) {
      where.respondentEmail = session.user.email || 'unauthenticated';
    }

    const [responses, total] = await Promise.all([
      prisma.questionnaireResponse.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.questionnaireResponse.count({ where }),
    ]);

    // Ensure we send valid JSON response
    return NextResponse.json(
      {
        responses,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=10, stale-while-revalidate=30',
        },
      }
    );
  } catch (error: any) {
    console.error('GET QuestionnaireResponse Error:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || String(error) },
      { status: 500 }
    );
  }
}

// POST — save a new questionnaire response
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();
    const {
      questionnaireType,
      cpId,
      respondentName,
      respondentRole,
      respondentOrg,
      respondentEmail,
      respondentInfo,
      answers,
      notes,
      files,
    } = body;

    if (!questionnaireType || !respondentName) {
      return NextResponse.json(
        { error: 'questionnaireType and respondentName are required' },
        { status: 400 }
      );
    }

    const finalEmail = session?.user?.email || respondentEmail || null;

    const response = await prisma.questionnaireResponse.create({
      data: {
        questionnaireType,
        cpId: cpId || null,
        respondentName,
        respondentRole: respondentRole || null,
        respondentOrg: respondentOrg || null,
        respondentEmail: finalEmail,
        respondentInfo: respondentInfo || {},
        answers: answers || {},
        notes: notes || {},
        files: files || [],
      },
    });

    return NextResponse.json({ success: true, id: response.id });
  } catch (error) {
    console.error('POST QuestionnaireResponse Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
