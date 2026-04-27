import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';

export type VoteValue = number | '?' | 'cafe';

@Component({
  selector: 'app-vote-card-grid',
  imports: [],
  templateUrl: './vote-card-grid.html',
  styleUrl: './vote-card-grid.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoteCardGrid {
  readonly isRevealed = input(false);
  readonly canVote = input(true);

  readonly voteSubmitted = output<VoteValue>();

  readonly deck = signal<VoteValue[]>([0, 1, 2, 3, 5, 8, 13, 21, '?', 'cafe']);
  readonly selectedVote = signal<VoteValue | null>(null);
  readonly submittedVote = signal<VoteValue | null>(null);
  private readonly wasCanVote = signal(this.canVote());

  readonly isLocked = computed(() => !this.canVote() || this.submittedVote() !== null);

  constructor() {
    effect(() => {
      const canVoteNow = this.canVote();
      const canVoteBefore = this.wasCanVote();

      // When a new round starts, canVote flips false -> true. Clear internal state.
      if (canVoteNow && !canVoteBefore) {
        this.resetVote();
      }

      this.wasCanVote.set(canVoteNow);
    });
  }

  selectCard(value: VoteValue): void {
    if (this.isLocked()) {
      return;
    }

    this.selectedVote.set(value);
  }

  submitVote(): void {
    const selected = this.selectedVote();
    if (selected === null || this.isLocked()) {
      return;
    }

    this.submittedVote.set(selected);
    this.voteSubmitted.emit(selected);
  }

  clearSelection(): void {
    if (this.submittedVote() !== null) {
      return;
    }

    this.selectedVote.set(null);
  }

  resetVote(): void {
    this.selectedVote.set(null);
    this.submittedVote.set(null);
  }
}
