CREATE TABLE `products` (
	`store_id` text NOT NULL,
	`id` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`price_cents` integer NOT NULL,
	`image_url` text NOT NULL,
	`category` text NOT NULL,
	`available` integer DEFAULT 1 NOT NULL,
	PRIMARY KEY(`store_id`, `id`),
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`idempotency_key` text NOT NULL,
	`request_hash` text NOT NULL,
	`customer_name` text NOT NULL,
	`delivery_address` text NOT NULL,
	`fulfillment` text NOT NULL,
	`items_json` text NOT NULL,
	`total_cents` integer NOT NULL,
	`delivery_fee_cents` integer NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `orders_store_time_idx` ON `orders` (`store_id`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `orders_idempotency_idx` ON `orders` (`store_id`,`idempotency_key`);--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`hits` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `stores` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`whatsapp_number` text DEFAULT '' NOT NULL,
	`is_demo` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stores_slug_unique` ON `stores` (`slug`);--> statement-breakpoint
CREATE INDEX `stores_owner_idx` ON `stores` (`owner_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`display_name` text NOT NULL,
	`password_hash` text,
	`is_demo` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);