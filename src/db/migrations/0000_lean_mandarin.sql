CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`first_name` text(255),
	`last_name` text(255),
	`email` text(255) NOT NULL,
	`password_hash` text,
	`role` text DEFAULT 'user' NOT NULL,
	`email_verified` integer,
	`sign_up_ip_address` text(100),
	`google_account_id` text(255),
	`avatar` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);