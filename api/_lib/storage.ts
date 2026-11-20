import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Neon Object Storage (S3-compatible), private bucket. The browser only ever
// sees short-lived presigned URLs.
let client: S3Client | null = null;

function s3(): S3Client {
  if (!client) {
    client = new S3Client({
      region: process.env.NEON_S3_REGION,
      endpoint: process.env.NEON_S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.NEON_S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.NEON_S3_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
      // Without this, presigned PUTs embed a checksum of an empty body and reject real uploads.
      requestChecksumCalculation: 'WHEN_REQUIRED',
    });
  }
  return client;
}

const bucket = () => process.env.NEON_S3_BUCKET ?? 'poster-sources';

/** Upload URL locked to one key, content type and exact byte size. */
export function presignUpload(key: string, contentType: string, size: number, expiresIn = 600) {
  return getSignedUrl(
    s3(),
    new PutObjectCommand({ Bucket: bucket(), Key: key, ContentType: contentType, ContentLength: size }),
    { expiresIn, signableHeaders: new Set(['content-type', 'content-length']) },
  );
}

export function presignDownload(key: string, expiresIn = 1800) {
  return getSignedUrl(s3(), new GetObjectCommand({ Bucket: bucket(), Key: key }), { expiresIn });
}

export async function deleteObjects(keys: string[]) {
  for (let i = 0; i < keys.length; i += 1000) {
    const batch = keys.slice(i, i + 1000);
    if (batch.length === 0) continue;
    await s3().send(new DeleteObjectsCommand({
      Bucket: bucket(),
      Delete: { Objects: batch.map(Key => ({ Key })), Quiet: true },
    }));
  }
}
