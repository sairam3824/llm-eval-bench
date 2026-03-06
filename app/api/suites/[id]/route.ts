export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const suite = db.prepare('SELECT * FROM suites WHERE id = ?').get(params.id) as {
    tests: string;
    [key: string]: unknown;
  } | undefined;
  if (!suite) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ...suite, tests: JSON.parse(suite.tests) });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  db.prepare('DELETE FROM suites WHERE id = ?').run(params.id);
  return NextResponse.json({ success: true });
}
