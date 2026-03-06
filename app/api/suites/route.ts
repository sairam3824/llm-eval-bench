export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const db = getDb();

  // Also load built-in suites from files
  const builtinSuites = loadBuiltinSuites();

  const dbSuites = db.prepare('SELECT * FROM suites ORDER BY created_at DESC').all() as Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    tests: string;
    created_at: string;
    updated_at: string;
  }>;

  const allSuites = [
    ...builtinSuites,
    ...dbSuites.map(s => ({ ...s, tests: JSON.parse(s.tests), builtin: false })),
  ];

  return NextResponse.json(allSuites);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();

  const { name, description, category, tests } = body;
  if (!name || !tests || !Array.isArray(tests)) {
    return NextResponse.json({ error: 'name and tests[] are required' }, { status: 400 });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO suites (id, name, description, category, tests)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, name, description || '', category || 'custom', JSON.stringify(tests));

  return NextResponse.json({ id, name, description, category, tests }, { status: 201 });
}

function loadBuiltinSuites() {
  const suitesDir = path.join(process.cwd(), 'suites');
  if (!fs.existsSync(suitesDir)) return [];

  const files = fs.readdirSync(suitesDir).filter(f => f.endsWith('.json'));
  return files.map(file => {
    try {
      const content = JSON.parse(fs.readFileSync(path.join(suitesDir, file), 'utf-8'));
      return { ...content, id: `builtin-${file.replace('.json', '')}`, builtin: true };
    } catch {
      return null;
    }
  }).filter(Boolean);
}
