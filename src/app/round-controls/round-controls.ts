import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

type RoundStatus = 'waiting' | 'voting' | 'revealed';

@Component({
  selector: 'app-round-controls',
  imports: [],
  templateUrl: './round-controls.html',
  styleUrl: './round-controls.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoundControls {
  readonly status = input<RoundStatus>('waiting');
  readonly totalParticipants = input(0);
  readonly votedParticipants = input(0);
  readonly isModerator = input(true);
  readonly roundTitleReady = input(false);

  readonly startRound = output<void>();
  readonly revealVotes = output<void>();
  readonly resetRound = output<void>();
  readonly nextItem = output<void>();

  readonly canStart = computed(() =>
    this.isModerator() && this.status() === 'waiting' && this.roundTitleReady(),
  );
  readonly canReveal = computed(() => this.isModerator() && this.status() === 'voting');
  readonly canReset = computed(() => this.isModerator() && this.status() !== 'waiting');
  readonly canNextItem = computed(() => this.isModerator() && this.status() === 'revealed');

  readonly votesRemaining = computed(() =>
    Math.max(this.totalParticipants() - this.votedParticipants(), 0),
  );

  readonly progressLabel = computed(() => {
    const total = this.totalParticipants();
    const voted = this.votedParticipants();

    if (total <= 0) {
      return 'Sem participantes conectados';
    }

    if (this.status() === 'revealed') {
      return 'Rodada concluida';
    }

    return `${voted}/${total} votos registrados`;
  });
}
