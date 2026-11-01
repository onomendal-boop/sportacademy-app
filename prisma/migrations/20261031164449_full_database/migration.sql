-- AlterTable
ALTER TABLE `articles` MODIFY `featured_image_url` LONGTEXT NULL;

-- CreateTable
CREATE TABLE `lead_activities` (
    `id` VARCHAR(191) NOT NULL,
    `lead_id` VARCHAR(191) NOT NULL,
    `actor_id` VARCHAR(191) NULL,
    `type` ENUM('NOTE', 'STATUS', 'ASSIGNMENT', 'SYSTEM') NOT NULL DEFAULT 'NOTE',
    `title` VARCHAR(160) NOT NULL,
    `description` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `lead_activities_lead_id_created_at_idx`(`lead_id`, `created_at`),
    INDEX `lead_activities_actor_id_idx`(`actor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_settings` (
    `id` VARCHAR(50) NOT NULL DEFAULT 'default',
    `general` JSON NOT NULL,
    `financial` JSON NOT NULL,
    `notification` JSON NOT NULL,
    `site_content` JSON NOT NULL,
    `updated_by_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_templates` (
    `id` VARCHAR(100) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `channel` ENUM('WHATSAPP', 'EMAIL') NOT NULL,
    `event_key` VARCHAR(80) NOT NULL,
    `subject` TEXT NULL,
    `message` LONGTEXT NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `notification_templates_channel_is_active_idx`(`channel`, `is_active`),
    INDEX `notification_templates_event_key_idx`(`event_key`),
    INDEX `notification_templates_sort_order_idx`(`sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `database_backups` (
    `id` VARCHAR(191) NOT NULL,
    `file_name` VARCHAR(180) NOT NULL,
    `format` VARCHAR(20) NOT NULL DEFAULT 'JSON',
    `size_bytes` INTEGER NOT NULL,
    `content` LONGTEXT NOT NULL,
    `created_by_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `database_backups_file_name_key`(`file_name`),
    INDEX `database_backups_created_at_idx`(`created_at`),
    INDEX `database_backups_created_by_id_idx`(`created_by_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `program_contents` (
    `id` VARCHAR(191) NOT NULL,
    `program` ENUM('AAA', 'A3', 'SWDC', 'PRIVATE') NOT NULL,
    `tagline` VARCHAR(120) NOT NULL,
    `description` TEXT NOT NULL,
    `audience_label` VARCHAR(120) NOT NULL,
    `schedule_label` VARCHAR(120) NOT NULL,
    `features` JSON NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `program_contents_program_key`(`program`),
    INDEX `program_contents_is_active_sort_order_idx`(`is_active`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `testimonials` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `role_label` VARCHAR(140) NOT NULL,
    `quote` TEXT NOT NULL,
    `rating` INTEGER NOT NULL DEFAULT 5,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `testimonials_is_active_sort_order_idx`(`is_active`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `faq_items` (
    `id` VARCHAR(191) NOT NULL,
    `question` VARCHAR(240) NOT NULL,
    `answer` TEXT NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `faq_items_question_key`(`question`),
    INDEX `faq_items_is_active_sort_order_idx`(`is_active`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `leads_assigned_to_id_idx` ON `leads`(`assigned_to_id`);

-- AddForeignKey
ALTER TABLE `articles` ADD CONSTRAINT `articles_author_id_fkey` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_assigned_to_id_fkey` FOREIGN KEY (`assigned_to_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lead_activities` ADD CONSTRAINT `lead_activities_lead_id_fkey` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lead_activities` ADD CONSTRAINT `lead_activities_actor_id_fkey` FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `system_settings` ADD CONSTRAINT `system_settings_updated_by_id_fkey` FOREIGN KEY (`updated_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `database_backups` ADD CONSTRAINT `database_backups_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
