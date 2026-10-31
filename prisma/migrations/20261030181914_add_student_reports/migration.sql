-- AlterTable
ALTER TABLE `subscriptions` ADD COLUMN `package_id` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `transactions` ADD COLUMN `package_id` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `student_reports` (
    `id` VARCHAR(191) NOT NULL,
    `student_id` VARCHAR(191) NOT NULL,
    `coach_id` VARCHAR(191) NULL,
    `level` ENUM('AAA', 'A3', 'SWDC') NOT NULL,
    `period_label` VARCHAR(80) NOT NULL,
    `period_start` DATE NULL,
    `period_end` DATE NULL,
    `sessions_attended` INTEGER NULL,
    `total_sessions` INTEGER NULL,
    `coach_notes` TEXT NULL,
    `recommendation` ENUM('STAY', 'LEVEL_UP', 'EXTRA_PRACTICE') NOT NULL DEFAULT 'STAY',
    `status` ENUM('DRAFT', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
    `published_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `student_reports_level_idx`(`level`),
    INDEX `student_reports_status_idx`(`status`),
    INDEX `student_reports_coach_id_idx`(`coach_id`),
    INDEX `student_reports_period_label_idx`(`period_label`),
    UNIQUE INDEX `student_reports_student_id_period_label_key`(`student_id`, `period_label`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_report_items` (
    `id` VARCHAR(191) NOT NULL,
    `report_id` VARCHAR(191) NOT NULL,
    `competency` VARCHAR(120) NOT NULL,
    `score` INTEGER NOT NULL,
    `note` VARCHAR(300) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `student_report_items_report_id_idx`(`report_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `packages` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `description` TEXT NULL,
    `program` ENUM('AAA', 'A3', 'SWDC', 'PRIVATE') NOT NULL,
    `price` INTEGER NOT NULL,
    `duration_label` VARCHAR(80) NOT NULL,
    `duration_days` INTEGER NOT NULL,
    `total_sessions` INTEGER NULL,
    `default_training_venue_id` VARCHAR(191) NULL,
    `pool_name` VARCHAR(120) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `packages_program_idx`(`program`),
    INDEX `packages_is_active_idx`(`is_active`),
    INDEX `packages_default_training_venue_id_idx`(`default_training_venue_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `subscriptions_package_id_idx` ON `subscriptions`(`package_id`);

-- CreateIndex
CREATE INDEX `transactions_package_id_idx` ON `transactions`(`package_id`);

-- AddForeignKey
ALTER TABLE `student_reports` ADD CONSTRAINT `student_reports_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_reports` ADD CONSTRAINT `student_reports_coach_id_fkey` FOREIGN KEY (`coach_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_report_items` ADD CONSTRAINT `student_report_items_report_id_fkey` FOREIGN KEY (`report_id`) REFERENCES `student_reports`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `packages` ADD CONSTRAINT `packages_default_training_venue_id_fkey` FOREIGN KEY (`default_training_venue_id`) REFERENCES `pools`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_package_id_fkey` FOREIGN KEY (`package_id`) REFERENCES `packages`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_package_id_fkey` FOREIGN KEY (`package_id`) REFERENCES `packages`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
