import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AwsS3Service } from 'src/aws-s3/aws-s3.service';
import { TicketService } from 'src/ticket/ticket.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway {
  constructor(
    private readonly ticketService: TicketService,
    private readonly awsS3Service: AwsS3Service,
  ) {}

  @WebSocketServer() server: Server;
  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() messageBody,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { ticketId, sender, message, imageUrl, filePath } = messageBody;

      // Validate required fields
      if (!ticketId || !sender) {
        client.emit('error', { message: 'Invalid message format' });
        return;
      }

      // Ensure at least one of `message` or `imageUrl` is provided
      if (!message && !imageUrl) {
        client.emit('error', {
          message: 'Either a message or an image must be sent',
        });
        return;
      }

      // Call service to add message
      const updateTicket = await this.ticketService.addMessage(
        ticketId,
        sender,
        message,
        imageUrl,
        filePath,
      );

      // If ticket not found
      if (!updateTicket) {
        client.emit('error', { message: 'Ticket not found' });
        return;
      }

      // Emit message to ticket room and to the sender
      this.server.to(ticketId).emit('receiveMessage', updateTicket);
      client.emit('messageSent', { success: true, ticket: updateTicket });
    } catch (error) {
      console.error('Error handling message:', error);
      client.emit('error', { message: 'Error processing message' });
    }
  }

  @SubscribeMessage('joinTicket')
  handleJoinTicket(
    @MessageBody() ticketId: string,
    @ConnectedSocket() client: Socket,
  ) {
    if (!ticketId) {
      client.emit('error', { message: 'Invalid ticket ID' });
      return;
    }

    client.join(ticketId);
    client.emit('joinedTicket', { message: `Joined ticket ${ticketId}` });
  }

  @SubscribeMessage('leaveTicket')
  handleLeaveRoom(
    @MessageBody() ticketId: string,
    @ConnectedSocket() socket: Socket,
  ) {
    if (!ticketId) {
      return socket.emit('errorMessage', { error: 'Ticket ID is required' });
    }

    socket.leave(ticketId);
    socket.emit('roomLeft', { ticketId });
  }

  @SubscribeMessage('userTyping')
  handleUserTyping(
    @MessageBody() data: { ticketId: string; user: string },
    @ConnectedSocket() socket: Socket,
  ) {
    this.server.to(data.ticketId).emit('userTyping', { user: data.user });
  }

  @SubscribeMessage('userStoppedTyping')
  handleUserStoppedTyping(
    @MessageBody() data: { ticketId: string; user: string },
    @ConnectedSocket() socket: Socket,
  ) {
    this.server
      .to(data.ticketId)
      .emit('userStoppedTyping', { user: data.user });
  }
  @SubscribeMessage('userOnline')
  handleUserOnline(
    @MessageBody() username: string,
    @ConnectedSocket() socket: Socket,
  ) {
    this.server.emit('userOnline', { username });
  }

  @SubscribeMessage('userOffline')
  handleUserOffline(
    @MessageBody() username: string,
    @ConnectedSocket() socket: Socket,
  ) {
    this.server.emit('userOffline', { username });
  }

  // 🔹 Read Receipts (messageRead)
  @SubscribeMessage('messageRead')
  handleMessageRead(
    @MessageBody() data: { ticketId: string; messageId: string; user: string },
    @ConnectedSocket() socket: Socket,
  ) {
    this.server
      .to(data.ticketId)
      .emit('messageRead', { messageId: data.messageId, user: data.user });
  }

  // 🔹 Seen Message (messageSeen)
  @SubscribeMessage('messageSeen')
  handleMessageSeen(
    @MessageBody() data: { ticketId: string; messageId: string; user: string },
    @ConnectedSocket() socket: Socket,
  ) {
    this.server
      .to(data.ticketId)
      .emit('messageSeen', { messageId: data.messageId, user: data.user });
  }
}
