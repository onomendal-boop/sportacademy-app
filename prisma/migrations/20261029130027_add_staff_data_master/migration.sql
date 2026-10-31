-- CreateTable
CREATE TABLE `staff` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NULL,
    `name` VARCHAR(100) NOT NULL,
    `position` VARCHAR(80) NOT NULL,
    `department` VARCHAR(80) NULL,
    `email` VARCHAR(160) NULL,
    `phone` VARCHAR(30) NOT NULL,
    `profile_image` VARCHAR(500) NULL,
    `status` ENUM('ACTIVE', 'ON_LEAVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `joined_at` DATE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `staff_user_id_key`(`user_id`),
    UNIQUE INDEX `staff_email_key`(`email`),
    INDEX `staff_status_idx`(`status`),
    INDEX `staff_position_idx`(`position`),
    INDEX `staff_department_idx`(`department`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `staff` ADD CONSTRAINT `staff_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
