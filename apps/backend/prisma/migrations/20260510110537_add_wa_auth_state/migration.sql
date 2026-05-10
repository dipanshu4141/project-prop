-- CreateTable
CREATE TABLE "WaAuthState" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaAuthState_pkey" PRIMARY KEY ("id")
);
