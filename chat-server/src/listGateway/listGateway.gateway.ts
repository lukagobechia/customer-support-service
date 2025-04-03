import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({cors: {origin: '*'}})
export class ListGateway {
  @WebSocketServer()
  server: Server;

  sendUpdate(data: any) {
    console.log('Sending update:', data);
    this.server.emit('list-updated', data);
  }
}
