export interface Voting {
  id: string;
  userId: string;
  userName: string;
  roomId: string;
  roundNumber: number;
  estimate: number | string;
  isRevealed: boolean;
  submittedAt: Date;
}
