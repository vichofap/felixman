CREATE TABLE `products` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `sku` text NOT NULL,
  `category` text NOT NULL,
  `brand` text NOT NULL,
  `compatibility` text NOT NULL,
  `stock` integer DEFAULT 0 NOT NULL,
  `min_stock` integer DEFAULT 3 NOT NULL,
  `cost` real NOT NULL,
  `price` real NOT NULL,
  `created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_sku_unique` ON `products` (`sku`);
--> statement-breakpoint
CREATE TABLE `orders` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `customer_name` text NOT NULL,
  `customer_phone` text NOT NULL,
  `delivery_area` text NOT NULL,
  `status` text DEFAULT 'pending' NOT NULL,
  `total` real NOT NULL,
  `created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `order_items` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `order_id` integer NOT NULL,
  `product_id` integer NOT NULL,
  `quantity` integer NOT NULL,
  `unit_price` real NOT NULL,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_order_items_order_id` ON `order_items` (`order_id`);
--> statement-breakpoint
CREATE INDEX `idx_order_items_product_id` ON `order_items` (`product_id`);
--> statement-breakpoint
PRAGMA optimize;
