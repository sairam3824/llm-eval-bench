export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const db = getDb();
  const models = db.prepare('SELECT * FROM models ORDER BY provider, name').all();
  return NextResponse.json(models);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();

  const { name, provider, model_id, description, context_window, input_price_per_1k, output_price_per_1k, color } = body;

  if (!name || !provider || !model_id) {
    return NextResponse.json({ error: 'name, provider, model_id are required' }, { status: 400 });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO models (id, name, provider, model_id, description, context_window, input_price_per_1k, output_price_per_1k, color)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, provider, model_id, description || '', context_window || 128000,
    input_price_per_1k || 0, output_price_per_1k || 0, color || '#6366F1');

  const model = db.prepare('SELECT * FROM models WHERE id = ?').get(id);
  return NextResponse.json(model, { status: 201 });
}
