import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }), name: text('name').notNull(), sku: text('sku').notNull().unique(),
  category: text('category').notNull(), brand: text('brand').notNull(), compatibility: text('compatibility').notNull(),
  stock: integer('stock').notNull().default(0), minStock: integer('min_stock').notNull().default(3), cost: real('cost').notNull(),
  price: real('price').notNull(), createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }), customerName: text('customer_name').notNull(), customerPhone: text('customer_phone').notNull(),
  deliveryArea: text('delivery_area').notNull(), status: text('status').notNull().default('pending'), total: real('total').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const orderItems = sqliteTable('order_items', {
  id: integer('id').primaryKey({ autoIncrement: true }), orderId: integer('order_id').notNull().references(() => orders.id),
  productId: integer('product_id').notNull().references(() => products.id), quantity: integer('quantity').notNull(), unitPrice: real('unit_price').notNull(),
});
