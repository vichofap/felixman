import { asc } from 'drizzle-orm';
import { getDb } from '@/db';
import { products } from '@/db/schema';

export async function GET() {
  try { return Response.json(await getDb().select().from(products).orderBy(asc(products.name))); }
  catch { return Response.json([]); }
}

export async function POST(request: Request) {
  const input = await request.json() as Record<string, unknown>;
  const values = { name: String(input.name ?? '').trim(), sku: String(input.sku ?? '').trim(), category: String(input.category ?? '').trim(), brand: String(input.brand ?? '').trim(), compatibility: String(input.compatibility ?? '').trim(), stock: Number(input.stock), minStock: Number(input.minStock), cost: Number(input.cost), price: Number(input.price) };
  if (!values.name || !values.sku || !values.category || !values.brand || !values.compatibility || !Number.isFinite(values.stock) || !Number.isFinite(values.cost) || !Number.isFinite(values.price)) return Response.json({ error: 'Datos incompletos' }, { status: 400 });
  const [created] = await getDb().insert(products).values(values).returning();
  return Response.json(created, { status: 201 });
}
