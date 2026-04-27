import { ChangeDetectionStrategy, Component, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { map, startWith } from 'rxjs/operators';
import {
  EchoEventEnvelope,
  EchoSocketService,
  JoinRoomPayload,
  SocketConnectionState,
  SocketConnectionStatus,
} from '../core/echo-socket.service';
import { Participant, ParticipantList } from '../participant-list/participant-list';
import { RoundControls } from '../round-controls/round-controls';
import { VoteCardGrid, VoteValue } from '../vote-card-grid/vote-card-grid';
import { VoteResult, VoteSummary } from '../vote-summary/vote-summary';

type RoundStatus = 'waiting' | 'voting' | 'revealed';

export interface RoundHistoryEntry {
  roundNumber: number;
  itemTitle: string;
  votes: { participantName: string; value: number | '?' | 'cafe' | null }[];
  average: number | null;
}

interface BackendParticipant {
  participantId: string;
  name: string;
  role: 'moderator' | 'participant';
  isOnline: boolean;
}

interface BackendVote {
  participantId: string;
  participantName: string;
  value: number | '?' | 'cafe' | null;
}

interface BackendStats {
  onlineCount: number;
  votedCount: number;
  missingVotes: string[];
}

interface BackendRound {
  roundNumber: number;
  itemTitle: string;
  status: RoundStatus;
}

interface BackendRoomState {
  roomCode: string;
  moderatorId: string;
  participants: BackendParticipant[];
  currentRound: BackendRound | null;
  votes: BackendVote[];
  stats: BackendStats;
}

@Component({
  selector: 'app-room-page',
  imports: [
    ReactiveFormsModule,
    ParticipantList,
    VoteCardGrid,
    RoundControls,
    VoteSummary,
  ],
  templateUrl: './room-page.html',
  styleUrl: './room-page.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomPage implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly socket = inject(EchoSocketService);

  protected readonly currentUserId = signal('');
  protected readonly currentUserName = signal('');
  protected readonly roomState = signal<BackendRoomState | null>(null);
  protected readonly statusMessage = signal('Conectando na sala...');
  protected readonly hasServerError = signal(false);
  protected readonly connectionState = this.socket.connectionState;
  private readonly previousConnectionStatus = signal<SocketConnectionStatus>('idle');
  protected readonly roundHistory = signal<RoundHistoryEntry[]>([]);
  private readonly seenRevealedRounds = new Set<number>();

  protected readonly roomCode = toSignal(
    this.route.paramMap.pipe(map((params) => (params.get('code') ?? '').toUpperCase())),
    { initialValue: (this.route.snapshot.paramMap.get('code') ?? '').toUpperCase() },
  );

  protected readonly actorKey = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('actor') ?? '')),
    { initialValue: this.route.snapshot.queryParamMap.get('actor') ?? '' },
  );

  protected readonly roomId = computed(() => this.roomCode());

  protected readonly roundStatus = computed<RoundStatus>(() => {
    const status = this.roomState()?.currentRound?.status;
    if (status === 'voting' || status === 'revealed') {
      return status;
    }
    return 'waiting';
  });

  protected readonly copied = signal(false);

  protected readonly itemForm = this.fb.group({
    item: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.minLength(4),
    ]),
  });

  private readonly itemTitleDraft = toSignal(
    this.itemForm.controls.item.valueChanges.pipe(
      startWith(this.itemForm.controls.item.value),
      map((value) => value.trim()),
    ),
    { initialValue: this.itemForm.controls.item.value.trim() },
  );

  protected readonly currentUserInitials = computed(() => {
    const name = this.currentUserName();
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return '?';
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  });

  protected readonly statusLabel = computed(() => {
    switch (this.roundStatus()) {
      case 'voting':
        return 'Votacao em andamento';
      case 'revealed':
        return 'Votos revelados';
      default:
        return 'Aguardando inicio';
    }
  });

  protected readonly hasConnectionIssue = computed(() => {
    const status = this.connectionState().status;
    return status === 'disconnected' || status === 'reconnecting' || status === 'error';
  });

  protected readonly connectionLabel = computed(() => this.buildConnectionLabel(this.connectionState()));

  protected readonly canRetryConnection = computed(() => {
    const status = this.connectionState().status;
    return status === 'disconnected' || status === 'error' || status === 'reconnecting';
  });

  protected readonly roundNumber = computed(() =>
    this.roomState()?.currentRound?.roundNumber ?? 0,
  );

  protected readonly votesByParticipant = computed<Record<string, VoteValue>>(() => {
    const map: Record<string, VoteValue> = {};
    for (const vote of this.roomState()?.votes ?? []) {
      const normalized = this.normalizeVote(vote.value);
      if (normalized !== null) {
        map[vote.participantId] = normalized;
      }
    }
    return map;
  });

  protected readonly votedParticipantIds = computed<Set<string>>(() => {
    return new Set((this.roomState()?.votes ?? []).map((v) => v.participantId));
  });

  protected readonly participants = computed<Participant[]>(() => {
    const votes = this.votesByParticipant();
    const voted = this.votedParticipantIds();
    const isRevealed = this.roundStatus() === 'revealed';
    return (this.roomState()?.participants ?? []).map((participant) => ({
      id: participant.participantId,
      name: participant.name,
      role: participant.role === 'moderator' ? 'moderator' : 'participant',
      isOnline: participant.isOnline,
      hasVoted: voted.has(participant.participantId),
      voteValue: isRevealed ? (votes[participant.participantId] ?? null) : null,
    }));
  });

  protected readonly onlineParticipantsCount = computed(() => this.roomState()?.stats.onlineCount ?? 0);

  protected readonly votedParticipantsCount = computed(() => this.roomState()?.stats.votedCount ?? 0);

  protected readonly isCurrentUserModerator = computed(() => {
    const current = this.participants().find((participant) => participant.id === this.currentUserId());
    return current?.role === 'moderator' || this.roomState()?.moderatorId === this.currentUserId();
  });

  protected readonly canEditRoundTitle = computed(() =>
    this.isCurrentUserModerator() && this.roundStatus() === 'waiting',
  );

  protected readonly canStartRound = computed(() => {
    const title = this.itemTitleDraft();
    return this.canEditRoundTitle() && title.length >= 4;
  });

  protected readonly canCurrentUserVote = computed(() => {
    if (this.roundStatus() !== 'voting') {
      return false;
    }

    const current = this.participants().find((participant) => participant.id === this.currentUserId());
    return !!current?.isOnline && !current.hasVoted;
  });

  protected readonly voteResults = computed<VoteResult[]>(() => {
    return (this.roomState()?.votes ?? [])
      .map((vote) => {
        const value = this.normalizeVote(vote.value);
        if (value === null) {
          return null;
        }

        return {
          participantId: vote.participantId,
          participantName: vote.participantName,
          value,
        } satisfies VoteResult;
      })
      .filter((vote): vote is VoteResult => vote !== null);
  });

  constructor() {
    effect(() => {
      const code = this.roomCode();
      if (!code) {
        return;
      }

      this.enterRoom(code);
    });

    effect(() => {
      if (this.canEditRoundTitle()) {
        this.itemForm.controls.item.enable();
      } else {
        this.itemForm.controls.item.disable();
      }
    });

    this.socket.on<{ room: unknown }>('room_state_synced', (envelope) => {
      if (envelope.roomCode !== this.roomCode()) {
        return;
      }

      this.applyRoomStateFromEnvelope(envelope);
    });

    this.socket.on<{ message?: string }>('error', (envelope) => {
      if (envelope.roomCode && envelope.roomCode !== this.roomCode()) {
        return;
      }

      this.hasServerError.set(true);
      this.statusMessage.set(envelope.payload?.message ?? 'Erro de comunicacao com a sala.');
    });

    effect(() => {
      const currentStatus = this.connectionState().status;
      const previousStatus = this.previousConnectionStatus();

      if (
        currentStatus === 'connected' &&
        (previousStatus === 'reconnecting' || previousStatus === 'disconnected' || previousStatus === 'error')
      ) {
        this.rejoinRoomAfterReconnect();
      }

      this.previousConnectionStatus.set(currentStatus);
    });
  }

  ngOnDestroy(): void {
    this.socket.leaveRoom({
      roomCode: this.roomCode(),
      participantId: this.currentUserId(),
    });
    this.socket.disconnect();
  }

  protected async startRound(): Promise<void> {
    const title = this.itemForm.controls.item.value.trim();
    if (!this.canStartRound() || title.length < 4) {
      this.itemForm.markAllAsTouched();
      return;
    }

    await this.socket.startRound({
      roomCode: this.roomCode(),
      participantId: this.currentUserId(),
      itemId: `item-${Date.now()}`,
      itemTitle: title,
    });
  }

  protected async revealVotes(): Promise<void> {
    if (this.roundStatus() !== 'voting') {
      return;
    }

    await this.socket.revealVotes({
      roomCode: this.roomCode(),
      participantId: this.currentUserId(),
    });
  }

  protected async resetRound(): Promise<void> {
    await this.socket.resetRound({
      roomCode: this.roomCode(),
      participantId: this.currentUserId(),
    });
  }

  protected async handleVoteSubmitted(vote: VoteValue): Promise<void> {
    if (this.roundStatus() !== 'voting') {
      return;
    }

    await this.socket.submitVote({
      roomCode: this.roomCode(),
      participantId: this.currentUserId(),
      value: vote,
    });
  }

  protected async goToNextItem(): Promise<void> {
    if (this.roundStatus() !== 'revealed') {
      return;
    }

    await this.socket.resetRound({
      roomCode: this.roomCode(),
      participantId: this.currentUserId(),
    });

    this.itemForm.controls.item.setValue('');
    this.itemForm.controls.item.markAsPristine();
    this.itemForm.controls.item.markAsUntouched();
  }

  protected async copyRoomCode(): Promise<void> {
    const code = this.roomCode();
    if (!code || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(code);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1500);
  }

  protected leaveRoom(): void {
    this.socket.leaveRoom({
      roomCode: this.roomCode(),
      participantId: this.currentUserId(),
    });
    this.router.navigate(['/']);
  }

  protected retryConnection(): void {
    this.statusMessage.set('Tentando reconectar...');
    this.socket.retryConnection();
  }

  private async enterRoom(roomCode: string): Promise<void> {
    const identity = this.getOrCreateActorIdentity();
    const participantId = identity.participantId;
    const participantName = identity.participantName;

    this.currentUserId.set(participantId);
    this.currentUserName.set(participantName);
    this.statusMessage.set('Sincronizando estado da sala...');
    this.hasServerError.set(false);

    const joinPayload: JoinRoomPayload = {
      roomCode,
      participantId,
      participantName,
    };

    try {
      const envelope = await this.socket.joinRoom(joinPayload);
      this.applyRoomStateFromEnvelope(envelope);
      await this.socket.requestSync({ roomCode, participantId });
    } catch (error) {
      this.hasServerError.set(true);
      this.statusMessage.set(
        error instanceof Error ? error.message : 'Nao foi possivel entrar na sala.',
      );
      this.roomState.set(null);
    }
  }

  private async rejoinRoomAfterReconnect(): Promise<void> {
    const roomCode = this.roomCode();
    const identity = this.getOrCreateActorIdentity();
    const participantId = this.currentUserId() || identity.participantId;
    const participantName = this.currentUserName() || identity.participantName;

    if (!roomCode || !participantId) {
      return;
    }

    this.statusMessage.set('Reconectado. Sincronizando estado da sala...');

    try {
      const envelope = await this.socket.joinRoom({
        roomCode,
        participantId,
        participantName,
      });
      this.applyRoomStateFromEnvelope(envelope);
      await this.socket.requestSync({ roomCode, participantId });
    } catch (error) {
      this.hasServerError.set(true);
      this.statusMessage.set(
        error instanceof Error ? error.message : 'Falha ao sincronizar apos reconexao.',
      );
    }
  }

  private applyRoomStateFromEnvelope(envelope: EchoEventEnvelope<{ room: unknown }>): void {
    const normalized = this.normalizeRoomState(envelope.payload.room);
    this.roomState.set(normalized);
    this.hasServerError.set(false);
    this.statusMessage.set('Conectado.');

    if (normalized.currentRound?.itemTitle && normalized.currentRound.status !== 'waiting') {
      this.itemForm.controls.item.setValue(normalized.currentRound.itemTitle);
    }

    if (normalized.currentRound?.status === 'revealed') {
      const rn = normalized.currentRound.roundNumber;
      if (!this.seenRevealedRounds.has(rn)) {
        this.seenRevealedRounds.add(rn);
        const numericVotes = normalized.votes
          .map((v) => v.value)
          .filter((v): v is number => typeof v === 'number');
        const average = numericVotes.length
          ? Math.round((numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length) * 10) / 10
          : null;
        const entry: RoundHistoryEntry = {
          roundNumber: rn,
          itemTitle: normalized.currentRound.itemTitle,
          votes: normalized.votes.map((v) => ({ participantName: v.participantName, value: v.value })),
          average,
        };
        this.roundHistory.update((h) => [entry, ...h]);
      }
    }
  }

  private normalizeRoomState(roomPayload: unknown): BackendRoomState {
    const raw = (roomPayload ?? {}) as Partial<BackendRoomState>;
    const currentRound = raw.currentRound ?? null;

    return {
      roomCode: typeof raw.roomCode === 'string' ? raw.roomCode.toUpperCase() : this.roomCode(),
      moderatorId: typeof raw.moderatorId === 'string' ? raw.moderatorId : '',
      participants: Array.isArray(raw.participants) ? raw.participants : [],
      currentRound,
      votes: Array.isArray(raw.votes) ? raw.votes : [],
      stats: {
        onlineCount: raw.stats?.onlineCount ?? 0,
        votedCount: raw.stats?.votedCount ?? 0,
        missingVotes: Array.isArray(raw.stats?.missingVotes) ? raw.stats.missingVotes : [],
      },
    };
  }

  private getOrCreateActorIdentity(): { actorKey: string; participantId: string; participantName: string } {
    const actorKey = this.getOrCreateActorKey();
    const storageKey = this.getActorStorageKey(actorKey);
    const raw = sessionStorage.getItem(storageKey);

    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { participantId?: unknown; participantName?: unknown };
        if (typeof parsed.participantId === 'string' && typeof parsed.participantName === 'string') {
          return {
            actorKey,
            participantId: parsed.participantId,
            participantName: parsed.participantName,
          };
        }
      } catch {
        // If parsing fails we recreate identity below.
      }
    }

    const created = {
      actorKey,
      participantId: `p-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      participantName: `Convidado ${Math.floor(Math.random() * 900 + 100)}`,
    };
    sessionStorage.setItem(
      storageKey,
      JSON.stringify({ participantId: created.participantId, participantName: created.participantName }),
    );

    return created;
  }

  private normalizeVote(value: BackendVote['value']): VoteValue | null {
    if (value === null) {
      return null;
    }

    if (typeof value === 'number') {
      return value;
    }

    if (value === '?' || value === 'cafe') {
      return value;
    }

    return null;
  }

  private getOrCreateActorKey(): string {
    const fromQuery = this.actorKey();
    if (fromQuery) {
      return fromQuery;
    }

    const generated = `a-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { actor: generated },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    return generated;
  }

  private getActorStorageKey(actorKey: string): string {
    return `echo-actor-${actorKey}`;
  }

  private buildConnectionLabel(state: SocketConnectionState): string {
    switch (state.status) {
      case 'connecting':
        return 'Conectando ao servidor em tempo real...';
      case 'connected':
        return 'Conexao em tempo real ativa.';
      case 'reconnecting':
        return `Reconectando... tentativa ${state.attempt}/${state.maxAttempts}.`;
      case 'disconnected':
        return 'Conexao perdida. Tentando restabelecer...';
      case 'error':
        return state.lastError
          ? `Falha de conexao: ${state.lastError}`
          : 'Falha de conexao com o servidor.';
      default:
        return 'Preparando conexao...';
    }
  }
}
