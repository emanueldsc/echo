import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { EchoSocketService } from '../core/echo-socket.service';

@Component({
  selector: 'app-home-page',
  imports: [ReactiveFormsModule],
  templateUrl: './home-page.html',
  styleUrl: './home-page.sass',
})
export class HomePage {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly socket = inject(EchoSocketService);
  private readonly activeActorKey = signal<string | null>(null);

  protected readonly creatingRoom = signal(false);
  protected readonly formMessage = signal('');

  readonly form = this.fb.group({
    name: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2)]),
    roomCode: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.minLength(4),
      Validators.maxLength(8),
      Validators.pattern(/^[a-zA-Z0-9]+$/),
    ]),
  });

  readonly roomCodeError = computed(() => {
    const control = this.form.controls.roomCode;
    if (!control.touched && !control.dirty) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Informe o codigo da sala.';
    }

    if (control.hasError('minlength')) {
      return 'Use no minimo 4 caracteres.';
    }

    if (control.hasError('maxlength')) {
      return 'Use no maximo 8 caracteres.';
    }

    if (control.hasError('pattern')) {
      return 'Use apenas letras e numeros.';
    }

    return '';
  });

  async createRoom(): Promise<void> {
    const nameControl = this.form.controls.name;
    if (nameControl.invalid) {
      nameControl.markAsTouched();
      this.formMessage.set('Informe seu nome para criar uma sala.');
      return;
    }

    const participantName = nameControl.value.trim();
    const actorIdentity = this.createAndPersistActorIdentity(participantName);
    this.activeActorKey.set(actorIdentity.actorKey);

    this.creatingRoom.set(true);
    this.formMessage.set('');

    try {
      const response = await this.socket.createRoom({
        roomName: `Sala de ${participantName}`,
        participantId: actorIdentity.participantId,
        participantName,
      });

      const roomCode = this.extractRoomCode(response.payload.room);
      if (!roomCode) {
        this.formMessage.set('Nao foi possivel obter o codigo da sala criada.');
        return;
      }

      this.form.controls.roomCode.setValue(roomCode);
      this.form.controls.roomCode.markAsDirty();
      this.form.controls.roomCode.markAsTouched();
      this.formMessage.set('Sala criada. Voce ja pode entrar.');
    } catch (error) {
      this.formMessage.set(
        error instanceof Error ? error.message : 'Nao foi possivel criar a sala agora.',
      );
    } finally {
      this.creatingRoom.set(false);
    }
  }

  joinRoom(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const participantName = this.form.controls.name.value.trim();
    const actorKey = this.activeActorKey() ?? this.createAndPersistActorIdentity(participantName).actorKey;
    if (this.activeActorKey()) {
      this.persistActorIdentity(actorKey, {
        participantId: this.readActorIdentity(actorKey)?.participantId ?? this.createParticipantId(),
        participantName,
      });
    }

    const roomCode = this.form.controls.roomCode.value.trim().toUpperCase();
    this.router.navigate(['/room', roomCode], { queryParams: { actor: actorKey } });
  }

  private extractRoomCode(roomPayload: unknown): string {
    if (!roomPayload || typeof roomPayload !== 'object') {
      return '';
    }

    const maybeRoomCode = (roomPayload as { roomCode?: unknown }).roomCode;
    return typeof maybeRoomCode === 'string' ? maybeRoomCode.toUpperCase() : '';
  }

  private createAndPersistActorIdentity(participantName: string): {
    actorKey: string;
    participantId: string;
  } {
    const actorKey = this.createActorKey();
    const participantId = this.createParticipantId();
    this.persistActorIdentity(actorKey, {
      participantId,
      participantName,
    });

    return { actorKey, participantId };
  }

  private persistActorIdentity(
    actorKey: string,
    identity: { participantId: string; participantName: string },
  ): void {
    sessionStorage.setItem(this.getActorStorageKey(actorKey), JSON.stringify(identity));
  }

  private readActorIdentity(actorKey: string): { participantId: string; participantName: string } | null {
    const raw = sessionStorage.getItem(this.getActorStorageKey(actorKey));
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as { participantId?: unknown; participantName?: unknown };
      if (typeof parsed.participantId !== 'string' || typeof parsed.participantName !== 'string') {
        return null;
      }

      return {
        participantId: parsed.participantId,
        participantName: parsed.participantName,
      };
    } catch {
      return null;
    }
  }

  private getActorStorageKey(actorKey: string): string {
    return `echo-actor-${actorKey}`;
  }

  private createParticipantId(): string {
    return `p-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  }

  private createActorKey(): string {
    return `a-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  }
}
