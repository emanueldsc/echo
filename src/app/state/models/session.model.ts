export interface Session {
  id: string;
  userId: string;
  userName: string;
  roomCode: string;
  role: 'moderator' | 'participant';
  isConnected: boolean;
  connectedAt?: Date;
}
