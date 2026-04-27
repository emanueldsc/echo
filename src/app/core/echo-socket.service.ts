import { computed, Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

export type SocketConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'error';

export interface SocketConnectionState {
  status: SocketConnectionStatus;
  attempt: number;
  maxAttempts: number;
  lastError: string | null;
}

export type EchoInboundEvent =
  | 'room.create'
  | 'room.join'
  | 'room.leave'
  | 'room.sync.request'
  | 'round.start'
  | 'vote.submit'
  | 'round.reveal'
  | 'round.reset'
  | 'round.nextItem';

export type EchoOutboundEvent =
  | 'room_state_synced'
  | 'participant_joined'
  | 'participant_left'
  | 'round_started'
  | 'vote_submitted'
  | 'votes_revealed'
  | 'round_reset'
  | 'next_item_started'
  | 'error';

export interface EchoEventEnvelope<TPayload> {
  event: string;
  version: string;
  timestamp?: string;
  correlationId: string;
  roomCode?: string;
  payload: TPayload;
}

export interface CreateRoomPayload {
  roomName: string;
  participantId: string;
  participantName: string;
}

export interface JoinRoomPayload {
  roomCode: string;
  participantId: string;
  participantName: string;
  role?: 'moderator' | 'participant' | 'observer';
}

export interface LeaveRoomPayload {
  roomCode: string;
  participantId: string;
}

export interface SyncRequestPayload {
  roomCode: string;
  participantId: string;
}

export interface StartRoundPayload {
  roomCode: string;
  itemId: string;
  itemTitle: string;
  participantId: string;
}

export interface SubmitVotePayload {
  roomCode: string;
  participantId: string;
  value: number | '?' | 'cafe';
}

export interface RevealVotesPayload {
  roomCode: string;
  participantId: string;
}

export interface ResetRoundPayload {
  roomCode: string;
  participantId: string;
}

export interface NextItemPayload {
  roomCode: string;
  itemId: string;
  itemTitle: string;
  participantId: string;
}

@Injectable({ providedIn: 'root' })
export class EchoSocketService {
  private socket: Socket | null = null;
  private readonly serverUrl = environment.socketUrl;
  private readonly maxReconnectAttempts = 8;

  readonly connectionState = signal<SocketConnectionState>({
    status: 'idle',
    attempt: 0,
    maxAttempts: this.maxReconnectAttempts,
    lastError: null,
  });

  readonly connectionStatus = computed(() => this.connectionState().status);

  connect(): Socket {
    if (this.socket) {
      return this.socket;
    }

    this.updateConnectionState({
      status: 'connecting',
      attempt: 0,
      lastError: null,
    });

    this.socket = io(this.serverUrl, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1200,
      reconnectionDelayMax: 5000,
      timeout: 8000,
    });
    this.registerConnectionListeners(this.socket);

    return this.socket;
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.updateConnectionState({
      status: 'disconnected',
      attempt: 0,
      lastError: null,
    });
  }

  retryConnection(): void {
    const socket = this.connect();
    this.updateConnectionState({
      status: 'reconnecting',
      attempt: Math.max(this.connectionState().attempt, 1),
      lastError: null,
    });
    socket.connect();
  }

  on<TPayload>(event: EchoOutboundEvent, listener: (envelope: EchoEventEnvelope<TPayload>) => void): void {
    this.connect().on(event, listener as (payload: unknown) => void);
  }

  off<TPayload>(event: EchoOutboundEvent, listener: (envelope: EchoEventEnvelope<TPayload>) => void): void {
    this.socket?.off(event, listener as (payload: unknown) => void);
  }

  createRoom(payload: CreateRoomPayload): Promise<EchoEventEnvelope<{ room: unknown }>> {
    return this.emitAndWaitForRoomState('room.create', payload, '');
  }

  joinRoom(payload: JoinRoomPayload): Promise<EchoEventEnvelope<{ room: unknown }>> {
    return this.emitAndWaitForRoomState('room.join', payload, payload.roomCode);
  }

  requestSync(payload: SyncRequestPayload): Promise<EchoEventEnvelope<{ room: unknown }>> {
    return this.emitAndWaitForRoomState('room.sync.request', payload, payload.roomCode);
  }

  leaveRoom(payload: LeaveRoomPayload): void {
    this.emit('room.leave', payload, payload.roomCode);
  }

  startRound(payload: StartRoundPayload): Promise<EchoEventEnvelope<{ room: unknown }>> {
    return this.emitAndWaitForRoomState('round.start', payload, payload.roomCode);
  }

  submitVote(payload: SubmitVotePayload): Promise<EchoEventEnvelope<{ room: unknown }>> {
    return this.emitAndWaitForRoomState('vote.submit', payload, payload.roomCode);
  }

  revealVotes(payload: RevealVotesPayload): Promise<EchoEventEnvelope<{ room: unknown }>> {
    return this.emitAndWaitForRoomState('round.reveal', payload, payload.roomCode);
  }

  resetRound(payload: ResetRoundPayload): Promise<EchoEventEnvelope<{ room: unknown }>> {
    return this.emitAndWaitForRoomState('round.reset', payload, payload.roomCode);
  }

  nextItem(payload: NextItemPayload): Promise<EchoEventEnvelope<{ room: unknown }>> {
    return this.emitAndWaitForRoomState('round.nextItem', payload, payload.roomCode);
  }

  private emitAndWaitForRoomState<TPayload>(
    event: EchoInboundEvent,
    payload: TPayload,
    roomCode: string,
  ): Promise<EchoEventEnvelope<{ room: unknown }>> {
    const correlationId = this.createCorrelationId();

    return new Promise<EchoEventEnvelope<{ room: unknown }>>((resolve, reject) => {
      const socket = this.connect();
      const timeoutId = setTimeout(() => {
        socket.off('room_state_synced', roomStateListener);
        socket.off('error', errorListener);
        reject(new Error('Tempo limite ao aguardar resposta do servidor.'));
      }, 7000);

      const roomStateListener = (envelope: EchoEventEnvelope<{ room: unknown }>) => {
        if (envelope.correlationId !== correlationId) {
          return;
        }

        clearTimeout(timeoutId);
        socket.off('room_state_synced', roomStateListener);
        socket.off('error', errorListener);
        resolve(envelope);
      };

      const errorListener = (envelope: EchoEventEnvelope<{ message?: string }>) => {
        if (envelope.correlationId && envelope.correlationId !== correlationId) {
          return;
        }

        clearTimeout(timeoutId);
        socket.off('room_state_synced', roomStateListener);
        socket.off('error', errorListener);
        reject(new Error(envelope.payload?.message ?? 'Erro ao processar evento no servidor.'));
      };

      socket.on('room_state_synced', roomStateListener);
      socket.on('error', errorListener);
      this.emit(event, payload, roomCode, correlationId);
    });
  }

  private emit<TPayload>(
    event: EchoInboundEvent,
    payload: TPayload,
    roomCode: string,
    correlationId = this.createCorrelationId(),
  ): void {
    this.connect().emit(event, {
      event,
      version: '1',
      correlationId,
      roomCode,
      payload,
    } satisfies EchoEventEnvelope<TPayload>);
  }

  private createCorrelationId(): string {
    return `echo-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  }

  private registerConnectionListeners(socket: Socket): void {
    socket.on('connect', () => {
      this.updateConnectionState({
        status: 'connected',
        attempt: 0,
        lastError: null,
      });
    });

    socket.on('disconnect', (reason) => {
      this.updateConnectionState({
        status: 'disconnected',
        lastError: reason || null,
      });
    });

    socket.on('connect_error', (error) => {
      this.updateConnectionState({
        status: 'error',
        lastError: error?.message ?? 'Falha de conexao',
      });
    });

    socket.io.on('reconnect_attempt', (attempt) => {
      this.updateConnectionState({
        status: 'reconnecting',
        attempt,
      });
    });

    socket.io.on('reconnect', () => {
      this.updateConnectionState({
        status: 'connected',
        attempt: 0,
        lastError: null,
      });
    });

    socket.io.on('reconnect_error', (error) => {
      this.updateConnectionState({
        status: 'error',
        lastError: error?.message ?? 'Erro ao reconectar',
      });
    });

    socket.io.on('reconnect_failed', () => {
      this.updateConnectionState({
        status: 'error',
        attempt: this.maxReconnectAttempts,
        lastError: 'Reconexao esgotada',
      });
    });
  }

  private updateConnectionState(partial: Partial<SocketConnectionState>): void {
    this.connectionState.update((state) => ({
      ...state,
      ...partial,
      maxAttempts: this.maxReconnectAttempts,
    }));
  }
}
