export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const body = await req.json();
  const { id } = params;

  const fields = [];
  const values = [];

  if (body.name !== undefined) { fields.push('name = ?'); values.push(body.name); }
  if (body.provider !== undefined) { fields.push('provider = ?'); values.push(body.provider); }
  if (body.model_id !== undefined) { fields.push('model_id = ?'); values.push(body.model_id); }
  if (body.description !== undefined) { fields.push('description = ?'); values.push(body.description); }
  if (body.context_window !== undefined) { fields.push('context_window = ?'); values.push(body.context_window); }
  if (body.input_price_per_1k !== undefined) { fields.push('input_price_per_1k = ?'); values.push(body.input_price_per_1k); }
  if (body.output_price_per_1k !== undefined) { fields.push('output_price_per_1k = ?'); values.push(body.output_price_per_1k); }
  if (body.enabled !== undefined) { fields.push('enabled = ?'); values.push(body.enabled ? 1 : 0); }
  if (body.color !== undefined) { fields.push('color = ?'); values.push(body.color); }

  if (fields.length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  values.push(id);
  db.prepare(`UPDATE models SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  const model = db.prepare('SELECT * FROM models WHERE id = ?').get(id);
  if (!model) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(model);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  db.prepare('DELETE FROM models WHERE id = ?').run(params.id);
  return NextResponse.json({ success: true });
}
