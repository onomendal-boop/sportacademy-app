-- CreateTable
CREATE TABLE `notification_reads` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `notification_key` VARCHAR(180) NOT NULL,
    `read_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notification_reads_user_id_read_at_idx`(`user_id`, `read_at`),
    UNIQUE INDEX `notification_reads_user_id_notification_key_key`(`user_id`, `notification_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `notification_reads` ADD CONSTRAINT `notification_reads_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
