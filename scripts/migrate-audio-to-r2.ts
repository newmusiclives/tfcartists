/**
 * Migrate Audio to R2
 *
 * Uploads all audio files from public/audio/ to Cloudflare R2,
 * then updates database records (SponsorAd, VoiceTrack, etc.)
 * to point to the new R2 URLs.
 *
 * Usage: npx tsx scripts/migrate-audio-to-r2.ts [--dry-run]
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const DRY_RUN = process.argv.includes("--dry-run");
const prisma = new PrismaClient();

function getR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    console.error("Missing R2 credentials. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY");
    process.exit(1);
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function getContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case ".wav": return "audio/wav";
    case ".mp3": return "audio/mpeg";
    case ".ogg": return "audio/ogg";
    case ".png": return "image/png";
    case ".jpg": case ".jpeg": return "image/jpeg";
    case ".webp": return "image/webp";
    default: return "application/octet-stream";
  }
}

async function uploadDir(
  client: S3Client,
  bucket: string,
  localDir: string,
  r2Prefix: string
): Promise<Map<string, string>> {
  const urlMap = new Map<string, string>();
  const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "") || "";

  if (!fs.existsSync(localDir)) {
    console.log(`  Skip ${localDir} (not found)`);
    return urlMap;
  }

  const files = getAllFiles(localDir);
  console.log(`  Found ${files.length} files in ${localDir}`);

  let uploaded = 0;
  for (const filePath of files) {
    const relativePath = path.relative(localDir, filePath);
    const key = `${r2Prefix}/${relativePath}`.replace(/\\/g, "/");
    const localUrl = `/${r2Prefix}/${relativePath}`.replace(/\\/g, "/");

    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would upload: ${key}`);
    } else {
      const buffer = fs.readFileSync(filePath);
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: buffer,
          ContentType: getContentType(filePath),
        })
      );
      uploaded++;
      if (uploaded % 10 === 0) console.log(`  Uploaded ${uploaded}/${files.length}...`);
    }

    const r2Url = publicUrl ? `${publicUrl}/${key}` : key;
    urlMap.set(localUrl, r2Url);
  }

  console.log(`  ${DRY_RUN ? "Would upload" : "Uploaded"} ${files.length} files`);
  return urlMap;
}

function getAllFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

async function updateDatabaseUrls(urlMap: Map<string, string>) {
  console.log("\nUpdating database records...");

  // Update SponsorAd audioFilePath
  const ads = await prisma.sponsorAd.findMany({
    where: { audioFilePath: { not: null } },
    select: { id: true, audioFilePath: true },
  });
  let adCount = 0;
  for (const ad of ads) {
    if (ad.audioFilePath && urlMap.has(ad.audioFilePath)) {
      if (!DRY_RUN) {
        await prisma.sponsorAd.update({
          where: { id: ad.id },
          data: { audioFilePath: urlMap.get(ad.audioFilePath)! },
        });
      }
      adCount++;
    }
  }
  console.log(`  SponsorAd: ${adCount} records ${DRY_RUN ? "would be" : ""} updated`);

  // Update VoiceTrack audioFilePath
  const voiceTracks = await prisma.voiceTrack.findMany({
    where: { audioFilePath: { not: null } },
    select: { id: true, audioFilePath: true },
  });
  let vtCount = 0;
  for (const vt of voiceTracks) {
    if (vt.audioFilePath && urlMap.has(vt.audioFilePath)) {
      if (!DRY_RUN) {
        await prisma.voiceTrack.update({
          where: { id: vt.id },
          data: { audioFilePath: urlMap.get(vt.audioFilePath)! },
        });
      }
      vtCount++;
    }
  }
  console.log(`  VoiceTrack: ${vtCount} records ${DRY_RUN ? "would be" : ""} updated`);

  // Update GenericVoiceTrack audioFilePath
  const generics = await prisma.genericVoiceTrack.findMany({
    where: { audioFilePath: { not: null } },
    select: { id: true, audioFilePath: true },
  });
  let gCount = 0;
  for (const g of generics) {
    if (g.audioFilePath && urlMap.has(g.audioFilePath)) {
      if (!DRY_RUN) {
        await prisma.genericVoiceTrack.update({
          where: { id: g.id },
          data: { audioFilePath: urlMap.get(g.audioFilePath)! },
        });
      }
      gCount++;
    }
  }
  console.log(`  GenericVoiceTrack: ${gCount} records ${DRY_RUN ? "would be" : ""} updated`);

  // Update ProducedImaging audioFilePath
  const imaging = await prisma.producedImaging.findMany({
    where: { audioFilePath: { not: null } },
    select: { id: true, audioFilePath: true },
  });
  let iCount = 0;
  for (const img of imaging) {
    if (img.audioFilePath && urlMap.has(img.audioFilePath)) {
      if (!DRY_RUN) {
        await prisma.producedImaging.update({
          where: { id: img.id },
          data: { audioFilePath: urlMap.get(img.audioFilePath)! },
        });
      }
      iCount++;
    }
  }
  console.log(`  ProducedImaging: ${iCount} records ${DRY_RUN ? "would be" : ""} updated`);

  // Update MusicBed filePath
  const beds = await prisma.musicBed.findMany({
    where: { filePath: { not: null } },
    select: { id: true, filePath: true },
  });
  let bCount = 0;
  for (const bed of beds) {
    if (bed.filePath && urlMap.has(bed.filePath)) {
      if (!DRY_RUN) {
        await prisma.musicBed.update({
          where: { id: bed.id },
          data: { filePath: urlMap.get(bed.filePath)! },
        });
      }
      bCount++;
    }
  }
  console.log(`  MusicBed: ${bCount} records ${DRY_RUN ? "would be" : ""} updated`);

  // Update FeatureContent audioFilePath
  const features = await prisma.featureContent.findMany({
    where: { audioFilePath: { not: null } },
    select: { id: true, audioFilePath: true },
  });
  let fCount = 0;
  for (const f of features) {
    if (f.audioFilePath && urlMap.has(f.audioFilePath)) {
      if (!DRY_RUN) {
        await prisma.featureContent.update({
          where: { id: f.id },
          data: { audioFilePath: urlMap.get(f.audioFilePath)! },
        });
      }
      fCount++;
    }
  }
  console.log(`  FeatureContent: ${fCount} records ${DRY_RUN ? "would be" : ""} updated`);

  // Update Song fileUrl
  const songRecords = await prisma.song.findMany({
    where: { fileUrl: { not: null } },
    select: { id: true, fileUrl: true },
  });
  let songCount = 0;
  for (const song of songRecords) {
    if (song.fileUrl && urlMap.has(song.fileUrl)) {
      if (!DRY_RUN) {
        await prisma.song.update({
          where: { id: song.id },
          data: { fileUrl: urlMap.get(song.fileUrl)! },
        });
      }
      songCount++;
    }
  }
  console.log(`  Song: ${songCount} records ${DRY_RUN ? "would be" : ""} updated`);
}

/**
 * Migrate Song records that have local/relative fileUrl paths.
 * Uploads each file to R2 under songs/ prefix and updates the DB record.
 * Skips songs that already have http URLs (already on R2) or have no file.
 */
async function migrateSongFileUrls(client: S3Client, bucket: string) {
  console.log("\nMigrating Song fileUrl records...");
  const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "") || "";

  const songs = await prisma.song.findMany({
    where: { fileUrl: { not: null } },
    select: { id: true, title: true, artistName: true, fileUrl: true },
  });

  let migrated = 0;
  let skipped = 0;
  let missing = 0;

  for (const song of songs) {
    if (!song.fileUrl) {
      skipped++;
      continue;
    }

    // Already an R2/HTTP URL — skip
    if (song.fileUrl.startsWith("http")) {
      skipped++;
      continue;
    }

    // Local path (e.g., /audio/songs/file.mp3 or /songs/file.mp3)
    const localPath = song.fileUrl.startsWith("/")
      ? path.join(process.cwd(), "public", song.fileUrl)
      : path.join(process.cwd(), "public", song.fileUrl);

    if (!fs.existsSync(localPath)) {
      console.log(`  Skip "${song.title}" by ${song.artistName} — local file not found: ${localPath}`);
      missing++;
      continue;
    }

    // Upload to R2 under songs/ prefix, preserving filename
    const filename = path.basename(localPath);
    const key = `songs/${filename}`;

    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would upload: ${key} (${song.title})`);
    } else {
      const buffer = fs.readFileSync(localPath);
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: buffer,
          ContentType: getContentType(localPath),
        })
      );

      const r2Url = publicUrl ? `${publicUrl}/${key}` : key;
      await prisma.song.update({
        where: { id: song.id },
        data: { fileUrl: r2Url },
      });
    }

    migrated++;
    if (migrated % 10 === 0) console.log(`  Progress: ${migrated} songs uploaded...`);
  }

  console.log(`  Songs: ${migrated} ${DRY_RUN ? "would be" : ""} migrated, ${skipped} skipped (already R2/no URL), ${missing} missing files`);
}

async function main() {
  console.log(`\n🚀 Migrate Audio to Cloudflare R2 ${DRY_RUN ? "(DRY RUN)" : ""}\n`);

  const client = getR2Client();
  const bucket = process.env.R2_BUCKET_NAME || "truefans-assets";
  const publicDir = path.join(process.cwd(), "public");

  // Upload audio directory
  console.log("Uploading audio files...");
  const audioMap = await uploadDir(client, bucket, path.join(publicDir, "audio"), "audio");

  // Upload songs directory (if songs are stored locally under public/songs/)
  console.log("\nUploading songs directory...");
  const songsMap = await uploadDir(client, bucket, path.join(publicDir, "songs"), "songs");

  // Upload team images
  console.log("\nUploading team images...");
  const teamMap = await uploadDir(client, bucket, path.join(publicDir, "team"), "team");

  // Upload DJ images
  console.log("\nUploading DJ images...");
  const djMap = await uploadDir(client, bucket, path.join(publicDir, "djs"), "djs");

  // Merge all URL mappings
  const allUrls = new Map([...audioMap, ...songsMap, ...teamMap, ...djMap]);

  // Update database records
  await updateDatabaseUrls(allUrls);

  // Migrate Song records with local fileUrl paths not covered by directory upload
  await migrateSongFileUrls(client, bucket);

  console.log(`\n✅ Migration ${DRY_RUN ? "dry run" : ""} complete!`);
  console.log(`   Total files: ${allUrls.size}`);

  if (!DRY_RUN) {
    console.log("\n📝 Next steps:");
    console.log("   1. Verify audio plays correctly from R2 URLs");
    console.log("   2. Set R2_PUBLIC_URL in your .env for custom domain");
    console.log("   3. The prebuild/postbuild scripts are no longer needed");
    console.log("      but are kept as fallback until you confirm R2 works.");
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
