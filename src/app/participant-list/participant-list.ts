import { ChangeDetectionStrategy, Component, OnDestroy, computed, effect, input, signal } from '@angular/core';

type ParticipantRole = 'moderator' | 'participant';
type ParticipantVoteValue = number | '?' | 'cafe' | null;

export interface Participant {
  id: string;
  name: string;
  role: ParticipantRole;
  isOnline: boolean;
  hasVoted: boolean;
  voteValue: ParticipantVoteValue;
}

@Component({
  selector: 'app-participant-list',
  imports: [],
  templateUrl: './participant-list.html',
  styleUrl: './participant-list.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParticipantList implements OnDestroy {
  readonly participants = input<Participant[]>([]);
  readonly currentUserId = input<string | null>(null);
  readonly isRevealed = input(false);
  readonly roundNumber = input(0);

  readonly revealSpinActive = signal(false);
  readonly nextItemSpinActive = signal(false);

  private previousIsRevealed = false;
  private previousRoundNumber = 0;
  private isFirstTransitionCycle = true;
  private revealSpinTimer: ReturnType<typeof setTimeout> | null = null;
  private nextItemSpinTimer: ReturnType<typeof setTimeout> | null = null;

  readonly list = computed(() => this.participants());

  readonly total = computed(() => this.list().length);
  readonly onlineCount = computed(() => this.list().filter((participant) => participant.isOnline).length);
  readonly votedCount = computed(() => this.list().filter((participant) => participant.hasVoted).length);
  readonly missingVotes = computed(() => Math.max(this.onlineCount() - this.votedCount(), 0));

  readonly shouldRevealVotes = computed(() => this.isRevealed());

  constructor() {
    effect(() => {
      const revealed = this.isRevealed();
      const round = this.roundNumber();

      if (this.isFirstTransitionCycle) {
        this.isFirstTransitionCycle = false;
        this.previousIsRevealed = revealed;
        this.previousRoundNumber = round;
        return;
      }

      if (!this.previousIsRevealed && revealed) {
        this.startRevealSpin();
      }

      if (round > this.previousRoundNumber) {
        this.startNextItemSpin();
      }

      this.previousIsRevealed = revealed;
      this.previousRoundNumber = round;
    });
  }

  ngOnDestroy(): void {
    if (this.revealSpinTimer) {
      clearTimeout(this.revealSpinTimer);
    }

    if (this.nextItemSpinTimer) {
      clearTimeout(this.nextItemSpinTimer);
    }
  }

  initials(name: string): string {
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      return '??';
    }

    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }

    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  displayedVote(value: ParticipantVoteValue): string {
    if (value === null) {
      return '-';
    }

    return String(value);
  }

  private startRevealSpin(): void {
    this.revealSpinActive.set(false);
    if (this.revealSpinTimer) {
      clearTimeout(this.revealSpinTimer);
    }

    this.revealSpinTimer = setTimeout(() => {
      this.revealSpinActive.set(true);
      this.revealSpinTimer = setTimeout(() => this.revealSpinActive.set(false), 440);
    }, 0);
  }

  private startNextItemSpin(): void {
    this.nextItemSpinActive.set(false);
    if (this.nextItemSpinTimer) {
      clearTimeout(this.nextItemSpinTimer);
    }

    this.nextItemSpinTimer = setTimeout(() => {
      this.nextItemSpinActive.set(true);
      this.nextItemSpinTimer = setTimeout(() => this.nextItemSpinActive.set(false), 440);
    }, 0);
  }
}
