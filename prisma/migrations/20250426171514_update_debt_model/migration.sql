-- AlterTable
ALTER TABLE "Debt" ADD COLUMN     "creditor" TEXT,
ADD COLUMN     "interestFrequency" TEXT DEFAULT 'monthly',
ADD COLUMN     "interestRate" DOUBLE PRECISION,
ADD COLUMN     "linkedTransactions" TEXT;
