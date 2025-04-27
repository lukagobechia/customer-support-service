import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, BadRequestException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';

@Injectable()
export class AwsS3Service {
  private bucketName = process.env.AWS_BUCKET_NAME;
  private s3storage: S3Client;

  constructor() {
    const accessKeyId = process.env.AWS_ACCESS_KEY;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const region = process.env.AWS_REGION;

    if (!this.bucketName || !accessKeyId || !secretAccessKey || !region) {
      throw new Error('AWS S3 credentials or bucket name are missing');
    }

    this.s3storage = new S3Client({
      credentials: { accessKeyId, secretAccessKey },
      region,
    });
  }

  async uploadImage(file: Express.Multer.File, ticketId: string) {
    if (!file) throw new BadRequestException('File is required');
    try {
      const fileId = uuid();
      const fileExtension = file.originalname.split('.').pop();
      const filePath = `chat-images/${ticketId}/${fileId}.${fileExtension}`;

      const uploadParams = {
        Key: filePath,
        Bucket: this.bucketName,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      await this.s3storage.send(new PutObjectCommand(uploadParams));

      // Generate a signed URL for image access
      const signedUrl = await this.getSignedUrl(filePath);

      return { filePath, signedUrl };
    } catch (error) {
      console.error('S3 Upload Error:', error);
      throw new BadRequestException('Error uploading file');
    }
  }

  async getSignedUrl(filePath: string) {
    if (!filePath) throw new BadRequestException('File path is required');

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
      });
      const signedUrl = await getSignedUrl(this.s3storage, command, {
        expiresIn: 3600,
      });
      return signedUrl; // 3 hour expiration
    } catch (error) {
      console.error('S3 Signed URL Error:', error);
      throw new BadRequestException('Error generating signed URL');
    }
  }
}
