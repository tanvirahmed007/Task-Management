// lib/socket.ts
import { Server as NetServer } from "http";
import { Server as SocketServer } from "socket.io";
import { NextApiResponse } from "next";

export const config = {
  api: {
    bodyParser: false,
  },
};

export class NotificationServer {
  private io: SocketServer;
  private clients: Map<string, any> = new Map();

  constructor(server: NetServer) {
    this.io = new SocketServer(server, {
      path: "/api/socketio",
    });

    this.io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);
      
      socket.on("authenticate", (userData: { userId: string; userRole: number; teamId: string }) => {
        if (userData.userRole === 2222) {
          this.clients.set(socket.id, userData);
          socket.join(`team-${userData.teamId}-leaders`);
        }
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
        this.clients.delete(socket.id);
      });
    });
  }

  sendToTeamLeaders(teamId: string, event: string, data: any) {
    this.io.to(`team-${teamId}-leaders`).emit(event, data);
  }
}

declare global {
  var io: NotificationServer | undefined;
}