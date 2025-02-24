PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_user` (
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
INSERT INTO `__new_user`("id", "created_at", "updated_at", "first_name", "last_name", "email", "password_hash", "role", "email_verified", "sign_up_ip_address", "google_account_id", "avatar") SELECT "id", "created_at", "updated_at", "first_name", "last_name", "email", "password_hash", "role", "email_verified", "sign_up_ip_address", "google_account_id", "avatar" FROM `user`;--> statement-breakpoint
DROP TABLE `user`;--> statement-breakpoint
ALTER TABLE `__new_user` RENAME TO `user`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);