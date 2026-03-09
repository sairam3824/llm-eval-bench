export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

import fs from 'fs';
import path from 'path';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  // Handle built-in suites
  if (id.startsWith('builtin-')) {
    const suiteName = id.replace('builtin-', '') + '.json';
    const suitePath = path.join(process.cwd(), 'suites', suiteName);

    if (fs.existsSync(suitePath)) {
      try {
        const content = JSON.parse(fs.readFileSync(suitePath, 'utf-8'));
        return NextResponse.json({ ...content, id, builtin: true });
      } catch {
        return NextResponse.json({ error: 'Failed to parse built-in suite' }, { status: 500 });
      }
    }
  }

  const db = getDb();
  const suite = db.prepare('SELECT * FROM suites WHERE id = ?').get(id) as {
    tests: string;
    [key: string]: unknown;
  } | undefined;

  if (!suite) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ...suite, tests: JSON.parse(suite.tests), builtin: false });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  db.prepare('DELETE FROM suites WHERE id = ?').run(params.id);
  return NextResponse.json({ success: true });
}
