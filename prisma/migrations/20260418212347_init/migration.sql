-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_items" (
    "id" TEXT NOT NULL,
    "policy_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "policy_id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transcript_entries" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "is_final" BOOLEAN NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "confidence" DOUBLE PRECISION,
    "start_ms" INTEGER,
    "end_ms" INTEGER,

    CONSTRAINT "transcript_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "frequency_snapshots" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "dominant_frequency_hz" DOUBLE PRECISION NOT NULL,
    "frequency_bins" JSONB NOT NULL,
    "sample_rate_hz" DOUBLE PRECISION NOT NULL,
    "fft_size" INTEGER NOT NULL,
    "bin_resolution_hz" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "frequency_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_states" (
    "session_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "checklist_states_pkey" PRIMARY KEY ("session_id","item_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "transcript_entries_session_id_idx" ON "transcript_entries"("session_id");

-- CreateIndex
CREATE INDEX "frequency_snapshots_session_id_idx" ON "frequency_snapshots"("session_id");

-- AddForeignKey
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "policies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transcript_entries" ADD CONSTRAINT "transcript_entries_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frequency_snapshots" ADD CONSTRAINT "frequency_snapshots_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_states" ADD CONSTRAINT "checklist_states_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
