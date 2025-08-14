-- AlterTable
ALTER TABLE "public"."Course" ADD COLUMN     "muxLiveId" TEXT,
ADD COLUMN     "muxPlaybackId" TEXT,
ADD COLUMN     "muxStatus" TEXT,
ADD COLUMN     "muxStreamKey" TEXT;
