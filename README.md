# Echo

Tem reuniao que parece tribunal: todo mundo fala, ninguem concorda, e a estimativa sai no grito.
O Echo nasce pra acabar com esse drama.

Echo e um app de Planning Poker feito para times que querem estimar tarefa com ordem, clareza e velocidade, sem perder a humanidade da conversa.

## Visao Geral

No Echo, o moderador abre uma sala e chama o time.
Cada pessoa entra, escolhe sua carta e vota no sigilo.
Ninguem ve o voto de ninguem antes da hora.

Quando todo mundo vota, o moderador revela.
A verdade aparece na mesa.
Se deu diferenca grande, conversa.
Se alinhou, segue o jogo.

Tudo acontece em tempo real via WebSocket, e o estado da aplicacao fica organizado com NgRx.

## O Que o Echo Faz

- Cria salas de Planning Poker com codigo unico.
- Permite entrada rapida de participantes.
- Mostra quem esta online em tempo real.
- Faz votacao secreta por rodada.
- Revela os votos para todos ao mesmo tempo.
- Permite resetar rodada para nova tentativa.
- Mostra o status da rodada (aguardando, todos votaram, revelado).

## Funcionalidades do MVP

### 1) Sala e Participantes
- Criar sala.
- Entrar por codigo.
- Definir quem e moderador.
- Sair da sala com atualizacao imediata para todos.

### 2) Votacao
- Baralho padrao (0, 1, 2, 3, 5, 8, 13, 21, ?, cafe).
- Voto oculto ate o momento da revelacao.
- Indicador de quem ja votou (sem mostrar valor).
- Acao de revelar e resetar rodada pelo moderador.

### 3) Rodadas
- Abrir rodada para um item (historia/ticket).
- Encerrar rodada revelando votos.
- Limpar votos para nova rodada.
- Guardar historico resumido durante a sessao.

### 4) Tempo Real com WebSocket
- Eventos de sala sincronizados para todos os clientes.
- Eventos principais:
  - participant_joined
  - participant_left
  - vote_submitted
  - votes_revealed
  - round_reset
  - room_state_synced
- Reentrada com recuperacao de estado.

### 5) Estado com NgRx
- Store separada por dominio:
  - session
  - room
  - voting
  - round-history
- Actions para interacoes de usuario e eventos de socket.
- Reducers para transicoes previsiveis.
- Effects para fluxo assincrono, reconexao e falhas.
- Selectors para status da rodada, progresso de votos e consenso.

## Plano de Implementacao (MVP)

### Fase 1 - Base
- Definir entidades: Usuario, Sala, Rodada, Voto e Evento.
- Organizar as features do frontend.
- Configurar NgRx (Store, Effects e DevTools).
- Implementar servico de WebSocket.

### Fase 2 - Fluxo de Entrada
- Tela para criar ou entrar em sala.
- Tela da sala com lista de participantes.
- Controle de permissao do moderador.
- Carregamento do estado inicial ao entrar.

### Fase 3 - Fluxo de Votacao
- Escolha de carta e envio de voto.
- Progresso de votos em tempo real.
- Revelacao e reset de rodada.
- Suporte a reconexao sem perder contexto.

### Fase 4 - Qualidade
- Validar regras de permissao (moderador revela/reseta).
- Tratar erro de conexao com feedback claro.
- Testar reducers, selectors e effects.
- Testar fluxo principal de votacao.

### Fase 5 - Entrega
- Refinar experiencia de uso para reuniao real.
- Ajustar acessibilidade e performance.
- Publicar MVP para uso do time.

## Arquitetura em Poucas Palavras

- Angular no frontend.
- NgRx como fonte de verdade do estado.
- WebSocket para atualizacao em tempo real.
- Backend de sala para arbitrar eventos e manter consistencia.

Fluxo essencial:
1. Pessoa entra na sala.
2. Cliente sincroniza estado.
3. Pessoa vota.
4. Evento vai para o servidor e volta para todos.
5. NgRx atualiza a interface de todos.
6. Moderador revela e inicia nova rodada.

## Resultado Esperado

Com o MVP, o time ganha uma sessao de Planning Poker online que funciona de verdade:
rapida, sincronizada e sem confusao.
Menos achismo, mais alinhamento.
