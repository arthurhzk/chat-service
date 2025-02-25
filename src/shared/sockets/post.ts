import { Server, Socket } from 'socket.io';

export let socketIOPostObject: Server;
export class SocketIOpost {
  private io: Server;
  constructor(io: Server) {
    this.io = io;
    socketIOPostObject = io;
  }
  public listen(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log('a user connected');
    });
  }
}
