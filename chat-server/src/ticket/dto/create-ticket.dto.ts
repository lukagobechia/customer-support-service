import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import mongoose from 'mongoose';

export class CreateTicketDto {
  @IsString()
  @IsOptional()
  assignee: mongoose.Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  issue: string;

  @IsEnum(['open', 'in-progress', 'resolved', 'closed'])
  @IsOptional()
  status: string;

  @IsEnum(['low', 'medium', 'high'])
  @IsOptional()
  priority: string;

  @IsOptional()
  messages: {
    sender: string;
    message: string;
    timestamp: Date;
  }[];
}
