-- Заявки, подготовленные редакцией за участника: ждут подтверждения команды по личной ссылке.
ALTER TYPE "SubmissionStatus" ADD VALUE 'INVITED' BEFORE 'PENDING';

ALTER TABLE "Submission" ALTER COLUMN "tgUserId" DROP NOT NULL,
ADD COLUMN     "inviteToken" TEXT;

CREATE UNIQUE INDEX "Submission_inviteToken_key" ON "Submission"("inviteToken");
