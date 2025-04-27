import { Module } from '@nestjs/common';
import { ChatGateway } from './chatGateway.gateway';
import { TicketModule } from 'src/ticket/ticket.module';
import { AwsS3Module } from 'src/aws-s3/aws-s3.module';
@Module({
  imports: [TicketModule, AwsS3Module],
  providers: [ChatGateway],
})
export class ChatGatewayModule {}
