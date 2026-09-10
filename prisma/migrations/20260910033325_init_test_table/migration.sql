-- CreateTable
CREATE TABLE `Test` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id1` VARCHAR(255) NOT NULL,
    `id2` VARCHAR(255) NOT NULL,
    `userID` VARCHAR(255) NOT NULL,

    UNIQUE INDEX `Test_id1_id2_key`(`id1`, `id2`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
