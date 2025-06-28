import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const id = params.id;
  const alert = await prisma.priceAlert.findUnique({ where: { id } });
  if (!alert || alert.userId !== session.user.id) {
    return NextResponse.json({ error: 'Yetkiniz yok' }, { status: 403 });
  }
  await prisma.priceAlert.delete({ where: { id } });
  return NextResponse.json({ success: true });
} 