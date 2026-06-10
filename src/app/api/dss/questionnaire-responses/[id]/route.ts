import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db/client';
import { auth } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const body = await req.json();
    const { answers } = body;

    if (!answers) {
      return NextResponse.json({ error: 'Answers payload is required.' }, { status: 400 });
    }

    const existingResponse = await prisma.questionnaireResponse.findUnique({
      where: { id }
    });

    if (!existingResponse) {
      return NextResponse.json({ error: 'Response not found.' }, { status: 404 });
    }

    const updatedResponse = await prisma.questionnaireResponse.update({
      where: { id },
      data: {
        answers
      }
    });

    return NextResponse.json({ success: true, data: updatedResponse });
  } catch (error: any) {
    console.error('PUT QuestionnaireResponse Error:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || String(error) },
      { status: 500 }
    );
  }
}
