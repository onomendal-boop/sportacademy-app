-- AlterTable
ALTER TABLE `users` ADD COLUMN `program_scope` ENUM('AAA', 'A3', 'SWDC') NULL;

-- CreateIndex
CREATE INDEX `users_program_scope_idx` ON `users`(`program_scope`);
