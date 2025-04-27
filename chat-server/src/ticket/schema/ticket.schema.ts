import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Schema({ timestamps: true })
export class Ticket {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  })
  customer: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  assignee: string;

  @Prop({ type: String, trim: true })
  issue: string;

  @Prop({
    type: String,
    enum: ['open', 'in-progress', 'resolved', 'closed'],
    default: 'open',
  })
  status: string;

  @Prop({ type: String, enum: ['low', 'medium', 'high'], default: 'medium' })
  priority: string;

  @Prop({
    type: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          auto: true,
        },
        sender: {
          type: String,
          required: true,
        },
        message: {
          type: String,
        },
        imageUrl: {
          type: String,
          default: null,
        },
        filePath: {
          type: String,
          default: null,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    default: [],
  })
  messages: {
    sender: string;
    message?: string;
    imageUrl?: string;
    filePath?: string;
    timestamp: Date;
  }[];
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);
