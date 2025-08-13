import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

export async function generateUploadUrl({
    bucketName,
    instructorId,
    courseId,
    filename,
    contentType,
}: {
    bucketName: string;
    instructorId: number;
    courseId: number;
    filename: string;
    contentType: string;
}) {
    const key = `${instructorId}/courses/${courseId}/${uuidv4()}-${filename}`;
    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        ContentType: contentType,
    });
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 15 * 60 });
    return { uploadUrl, key };
}

export async function generateDownloadUrl({ bucketName, key }: { bucketName: string; key: string; }) {
    const cmd = new GetObjectCommand({ Bucket: bucketName, Key: key });
    const url = await getSignedUrl(s3, cmd, { expiresIn: 5 * 60 });
    return url;
}
