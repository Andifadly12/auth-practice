/*
  Warnings:

  - You are about to drop the column `completed` on the `todos` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TodoStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TodoPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- AlterTable
ALTER TABLE "todos" DROP COLUMN "completed",
ADD COLUMN     "categoryId" UUID,
ADD COLUMN     "completed_at" TIMESTAMP(3),
ADD COLUMN     "due_at" TIMESTAMP(3),
ADD COLUMN     "priority" "TodoPriority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "reminder_at" TIMESTAMP(3),
ADD COLUMN     "status" "TodoStatus" NOT NULL DEFAULT 'TODO';

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "color" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "categories_user_id_idx" ON "categories"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_user_id_name_key" ON "categories"("user_id", "name");

-- CreateIndex
CREATE INDEX "todos_user_id_status_idx" ON "todos"("user_id", "status");

-- CreateIndex
CREATE INDEX "todos_user_id_due_at_idx" ON "todos"("user_id", "due_at");

-- AddForeignKey
ALTER TABLE "todos" ADD CONSTRAINT "todos_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
