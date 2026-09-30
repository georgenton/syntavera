ALTER TABLE "Verification" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "Verification" ALTER COLUMN "id" TYPE TEXT USING "id"::text;
ALTER TABLE "Verification" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
