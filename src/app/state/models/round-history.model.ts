export interface RoundHistory {
  id: string;
  roomId: string;
  roundNumber: number;
  item: string;
  startedAt: Date;
  endedAt?: Date;
  estimates: Record<string, number | string>;
  consensusEstimate?: number | string;
}
