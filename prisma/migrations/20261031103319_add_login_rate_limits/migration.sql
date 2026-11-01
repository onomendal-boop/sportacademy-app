-- CreateTable
CREATE TABLE `login_rate_limits` (
    `id` VARCHAR(191) NOT NULL,
    `key_hash` CHAR(64) NOT NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `window_started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `blocked_until` DATETIME(3) NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `login_rate_limits_key_hash_key`(`key_hash`),
    INDEX `login_rate_limits_expires_at_idx`(`expires_at`),
    INDEX `login_rate_limits_blocked_until_idx`(`blocked_until`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
