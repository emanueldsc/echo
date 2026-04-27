export interface Room {
  id: string;
  code: string;
  name: string;
  moderatorId: string;
  currentItem?: string;
  status: 'waiting' | 'voting' | 'revealed' | 'closed';
  createdAt: Date;
  updatedAt: Date;
  participantIds?: string[];
  roundEstimates?: Record<string, number | string>;
}
