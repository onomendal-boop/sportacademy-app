-- CreateTable
CREATE TABLE `students` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `age` INTEGER NOT NULL,
    `parent_contact` VARCHAR(30) NOT NULL,
    `health_history` TEXT NULL,
    `level` ENUM('AAA', 'A3', 'SWDC') NOT NULL DEFAULT 'AAA',
    `status` ENUM('ACTIVE', 'PENDING', 'COMPLETED', 'INACTIVE') NOT NULL DEFAULT 'PENDING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `students_name_idx`(`name`),
    INDEX `students_level_idx`(`level`),
    INDEX `students_status_idx`(`status`),
    INDEX `students_level_status_idx`(`level`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `schedules` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(120) NOT NULL,
    `program` ENUM('AAA', 'A3', 'SWDC', 'PRIVATE') NOT NULL,
    `day_of_week` ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY') NOT NULL,
    `start_time` VARCHAR(5) NOT NULL,
    `end_time` VARCHAR(5) NOT NULL,
    `capacity` INTEGER NOT NULL DEFAULT 10,
    `pool_name` VARCHAR(120) NOT NULL,
    `lane` VARCHAR(80) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `notes` TEXT NULL,
    `effective_start_date` DATE NULL,
    `effective_end_date` DATE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `schedules_program_day_of_week_idx`(`program`, `day_of_week`),
    INDEX `schedules_day_of_week_start_time_idx`(`day_of_week`, `start_time`),
    INDEX `schedules_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `slots` (
    `id` VARCHAR(191) NOT NULL,
    `schedule_id` VARCHAR(191) NOT NULL,
    `starts_at` DATETIME(3) NOT NULL,
    `ends_at` DATETIME(3) NOT NULL,
    `capacity` INTEGER NOT NULL,
    `booked_count` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('OPEN', 'FULL', 'CLOSED', 'CANCELLED') NOT NULL DEFAULT 'OPEN',
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `slots_starts_at_idx`(`starts_at`),
    INDEX `slots_status_idx`(`status`),
    INDEX `slots_schedule_id_starts_at_idx`(`schedule_id`, `starts_at`),
    UNIQUE INDEX `slots_schedule_id_starts_at_key`(`schedule_id`, `starts_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `coach_assignments` (
    `id` VARCHAR(191) NOT NULL,
    `schedule_id` VARCHAR(191) NOT NULL,
    `slot_id` VARCHAR(191) NULL,
    `coach_id` VARCHAR(191) NOT NULL,
    `role` ENUM('LEAD', 'ASSISTANT', 'SUBSTITUTE') NOT NULL DEFAULT 'LEAD',
    `status` ENUM('ASSIGNED', 'CONFIRMED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'ASSIGNED',
    `assigned_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `coach_assignments_coach_id_idx`(`coach_id`),
    INDEX `coach_assignments_schedule_id_idx`(`schedule_id`),
    INDEX `coach_assignments_slot_id_idx`(`slot_id`),
    INDEX `coach_assignments_status_idx`(`status`),
    UNIQUE INDEX `coach_assignments_schedule_id_slot_id_coach_id_key`(`schedule_id`, `slot_id`, `coach_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscriptions` (
    `id` VARCHAR(191) NOT NULL,
    `student_id` VARCHAR(191) NOT NULL,
    `package_name` VARCHAR(120) NOT NULL,
    `program` ENUM('AAA', 'A3', 'SWDC', 'PRIVATE') NOT NULL,
    `price` INTEGER NOT NULL,
    `pool_name` VARCHAR(120) NULL,
    `starts_at` DATE NOT NULL,
    `expires_at` DATE NOT NULL,
    `total_sessions` INTEGER NULL,
    `remaining_sessions` INTEGER NULL,
    `status` ENUM('ACTIVE', 'PENDING', 'EXPIRED', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    `auto_renew` BOOLEAN NOT NULL DEFAULT false,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `subscriptions_student_id_idx`(`student_id`),
    INDEX `subscriptions_program_idx`(`program`),
    INDEX `subscriptions_status_idx`(`status`),
    INDEX `subscriptions_expires_at_idx`(`expires_at`),
    INDEX `subscriptions_status_expires_at_idx`(`status`, `expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transactions` (
    `id` VARCHAR(191) NOT NULL,
    `invoice_number` VARCHAR(40) NOT NULL,
    `student_id` VARCHAR(191) NULL,
    `subscription_id` VARCHAR(191) NULL,
    `type` ENUM('SUBSCRIPTION_PAYMENT', 'PRIVATE_VOUCHER', 'REGISTRATION', 'OTHER') NOT NULL DEFAULT 'SUBSCRIPTION_PAYMENT',
    `description` VARCHAR(160) NOT NULL,
    `program` ENUM('AAA', 'A3', 'SWDC', 'PRIVATE') NULL,
    `pool_name` VARCHAR(120) NULL,
    `amount` INTEGER NOT NULL,
    `payment_method` ENUM('CASH', 'TRANSFER', 'QRIS') NOT NULL,
    `status` ENUM('PAID', 'PENDING', 'FAILED', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `reference_number` VARCHAR(100) NULL,
    `paid_at` DATETIME(3) NULL,
    `recorded_by_id` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `transactions_invoice_number_key`(`invoice_number`),
    INDEX `transactions_student_id_idx`(`student_id`),
    INDEX `transactions_subscription_id_idx`(`subscription_id`),
    INDEX `transactions_paid_at_idx`(`paid_at`),
    INDEX `transactions_status_idx`(`status`),
    INDEX `transactions_payment_method_idx`(`payment_method`),
    INDEX `transactions_program_idx`(`program`),
    INDEX `transactions_pool_name_idx`(`pool_name`),
    INDEX `transactions_status_paid_at_idx`(`status`, `paid_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `promotions` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(140) NOT NULL,
    `description` TEXT NULL,
    `type` ENUM('FLASH_SALE', 'REFERRAL', 'VOUCHER', 'SEASONAL', 'PARTNER') NOT NULL,
    `code` VARCHAR(60) NULL,
    `batch_id` VARCHAR(60) NULL,
    `discount_type` ENUM('PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SESSION') NOT NULL,
    `discount_value` INTEGER NOT NULL,
    `min_purchase_amount` INTEGER NULL,
    `max_discount_amount` INTEGER NULL,
    `program` ENUM('AAA', 'A3', 'SWDC', 'PRIVATE') NULL,
    `pool_name` VARCHAR(120) NULL,
    `starts_at` DATETIME(3) NOT NULL,
    `ends_at` DATETIME(3) NOT NULL,
    `usage_limit` INTEGER NULL,
    `per_user_limit` INTEGER NOT NULL DEFAULT 1,
    `redeemed_count` INTEGER NOT NULL DEFAULT 0,
    `referrer_benefit` VARCHAR(160) NULL,
    `referee_benefit` VARCHAR(160) NULL,
    `status` ENUM('DRAFT', 'SCHEDULED', 'ACTIVE', 'INACTIVE', 'EXPIRED', 'REDEEMED') NOT NULL DEFAULT 'DRAFT',
    `terms` TEXT NULL,
    `created_by_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `promotions_code_key`(`code`),
    INDEX `promotions_type_idx`(`type`),
    INDEX `promotions_status_idx`(`status`),
    INDEX `promotions_starts_at_ends_at_idx`(`starts_at`, `ends_at`),
    INDEX `promotions_batch_id_idx`(`batch_id`),
    INDEX `promotions_program_idx`(`program`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `articles` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(180) NOT NULL,
    `slug` VARCHAR(200) NOT NULL,
    `excerpt` TEXT NOT NULL,
    `content` LONGTEXT NOT NULL,
    `category` VARCHAR(80) NOT NULL,
    `tags` JSON NULL,
    `featured_image_url` VARCHAR(500) NULL,
    `featured_image_alt` VARCHAR(180) NULL,
    `seo_title` VARCHAR(180) NULL,
    `seo_description` VARCHAR(320) NULL,
    `author_id` VARCHAR(191) NULL,
    `author_name` VARCHAR(100) NOT NULL,
    `status` ENUM('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `scheduled_at` DATETIME(3) NULL,
    `published_at` DATETIME(3) NULL,
    `view_count` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `articles_slug_key`(`slug`),
    INDEX `articles_status_idx`(`status`),
    INDEX `articles_category_idx`(`category`),
    INDEX `articles_published_at_idx`(`published_at`),
    INDEX `articles_status_published_at_idx`(`status`, `published_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leads` (
    `id` VARCHAR(191) NOT NULL,
    `student_name` VARCHAR(100) NOT NULL,
    `student_age` INTEGER NULL,
    `parent_name` VARCHAR(100) NOT NULL,
    `parent_phone` VARCHAR(30) NOT NULL,
    `parent_email` VARCHAR(160) NULL,
    `program` ENUM('AAA', 'A3', 'SWDC', 'PRIVATE') NULL,
    `pool_preference` VARCHAR(120) NULL,
    `source` ENUM('WEBSITE', 'LANDING_PAGE', 'INSTAGRAM', 'WHATSAPP', 'REFERRAL', 'WALK_IN', 'EVENT', 'OTHER') NOT NULL DEFAULT 'WEBSITE',
    `referral_code` VARCHAR(60) NULL,
    `message` TEXT NULL,
    `status` ENUM('NEW', 'CONTACTED', 'WAITING_RESPONSE', 'TRIAL_SCHEDULED', 'TRIAL_COMPLETED', 'REGISTERED', 'NOT_INTERESTED', 'UNREACHABLE') NOT NULL DEFAULT 'NEW',
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL DEFAULT 'MEDIUM',
    `assigned_to_id` VARCHAR(191) NULL,
    `last_contacted_at` DATETIME(3) NULL,
    `next_follow_up_at` DATETIME(3) NULL,
    `trial_scheduled_at` DATETIME(3) NULL,
    `converted_student_id` VARCHAR(191) NULL,
    `internal_notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `leads_parent_phone_idx`(`parent_phone`),
    INDEX `leads_status_idx`(`status`),
    INDEX `leads_source_idx`(`source`),
    INDEX `leads_program_idx`(`program`),
    INDEX `leads_next_follow_up_at_idx`(`next_follow_up_at`),
    INDEX `leads_status_next_follow_up_at_idx`(`status`, `next_follow_up_at`),
    INDEX `leads_converted_student_id_idx`(`converted_student_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `slots` ADD CONSTRAINT `slots_schedule_id_fkey` FOREIGN KEY (`schedule_id`) REFERENCES `schedules`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `coach_assignments` ADD CONSTRAINT `coach_assignments_schedule_id_fkey` FOREIGN KEY (`schedule_id`) REFERENCES `schedules`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `coach_assignments` ADD CONSTRAINT `coach_assignments_slot_id_fkey` FOREIGN KEY (`slot_id`) REFERENCES `slots`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_subscription_id_fkey` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_converted_student_id_fkey` FOREIGN KEY (`converted_student_id`) REFERENCES `students`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
