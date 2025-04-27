import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AwsS3Service } from './aws-s3.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('aws')
export class AwsS3Controller {
  constructor(private readonly awsS3Service: AwsS3Service) {}

  @Post('upload')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('ticketId') ticketId: string,
  ) {
    if (!ticketId) {
      throw new BadRequestException('Ticket ID is required');
    }
    return this.awsS3Service.uploadImage(file, ticketId);
  }

  @Get('refresh-url')
  async refreshSignedUrl(@Query('filePath') filePath: string) {
    if (!filePath) throw new BadRequestException('File path is required');

    return { signedUrl: await this.awsS3Service.getSignedUrl(filePath) };
  }
}
