import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type VoteValue = number | '?' | 'cafe';

export interface VoteResult {
  participantId: string;
  participantName: string;
  value: VoteValue;
}

@Component({
  selector: 'app-vote-summary',
  imports: [],
  templateUrl: './vote-summary.html',
  styleUrl: './vote-summary.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoteSummary {
  readonly isRevealed = input(true);
  readonly votes = input<VoteResult[]>([]);

  readonly results = computed(() => this.votes());

  readonly numericVotes = computed(() =>
    this.results()
      .map((item) => item.value)
      .filter((value): value is number => typeof value === 'number'),
  );

  readonly distribution = computed(() => {
    const map = new Map<string, number>();

    for (const vote of this.results()) {
      const key = String(vote.value);
      map.set(key, (map.get(key) ?? 0) + 1);
    }

    return Array.from(map.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => {
        const aNum = Number(a.value);
        const bNum = Number(b.value);
        if (Number.isNaN(aNum) || Number.isNaN(bNum)) {
          return a.value.localeCompare(b.value);
        }
        return aNum - bNum;
      });
  });

  readonly average = computed(() => {
    const values = this.numericVotes();
    if (values.length === 0) {
      return null;
    }

    const total = values.reduce((sum, current) => sum + current, 0);
    return Number((total / values.length).toFixed(2));
  });

  readonly median = computed(() => {
    const sorted = [...this.numericVotes()].sort((a, b) => a - b);
    if (sorted.length === 0) {
      return null;
    }

    const middle = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
      return Number(((sorted[middle - 1] + sorted[middle]) / 2).toFixed(2));
    }

    return sorted[middle];
  });

  readonly consensusVote = computed(() => {
    const items = this.distribution();
    if (items.length === 0) {
      return null;
    }

    return [...items].sort((a, b) => b.count - a.count)[0].value;
  });

  readonly hasHighDivergence = computed(() => {
    const values = this.numericVotes();
    if (values.length < 2) {
      return false;
    }

    return Math.max(...values) - Math.min(...values) >= 8;
  });
}
