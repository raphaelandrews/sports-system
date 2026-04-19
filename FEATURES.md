# FEATURES — Sistema de Gerenciamento de Competições Multiesportivas

## Visão Geral

Sistema genérico para gerenciar eventos multiesportivos (olimpíadas escolares, universitárias, interclasse). Delegações de instituições competem entre si em 10 modalidades esportivas ao longo de semanas de competição. O sistema oferece cadastro, inscrições, resultados, quadro de medalhas e geração de conteúdo por IA.

---

## Ciclo de Competição

A competição é estruturada em **semanas**:

| Dia | Atividade |
|-----|-----------|
| Segunda-feira (00h00–23h59, UTC-3) | Janela de transferências — atletas podem trocar de delegação |
| Terça a Domingo | 6 dias de eventos esportivos |

**Regras do ciclo:**
- O calendário de uma semana é montado pelo admin e **travado automaticamente** quando o horário do primeiro evento passa
- Uma vez travada, nenhuma alteração de escala é permitida na semana atual
- Ao travar, o sistema **gera automaticamente** as partidas e o chaveamento com base nas inscrições aprovadas
- Novas delegações, atletas e técnicos podem ser cadastrados a qualquer momento, mas **só participam a partir da próxima semana**
- Janela de transferências abre às **00h00 de segunda-feira** e fecha às **00h00 de terça-feira** (UTC-3) — **verificação automática**, sem intervenção do admin
- Resultados de partidas registram a **delegação do atleta no momento da partida** — mudanças futuras não afetam o histórico

**Estados de uma semana de competição:**
```
RASCUNHO → AGENDADA → TRAVADA → ATIVA → CONCLUÍDA
```
- `RASCUNHO`: admin está montando o calendário
- `AGENDADA`: calendário publicado, visível aos usuários
- `TRAVADA`: horário do primeiro evento passou — travamento e geração de partidas automáticos via scheduler
- `ATIVA`: eventos em andamento
- `CONCLUÍDA`: todos os eventos encerrados, resultados finalizados

---

## Tipos de Usuário e Permissões

### Admin
- Acesso total ao sistema
- Aprova/rejeita solicitações de chefe de delegação
- Gerencia esportes, modalidades, calendário
- Acessa painel de geração por IA
- Encerra semanas e publica resultados

### Chefe de Delegação
- Gerencia própria delegação
- Convida usuários para a delegação (atletas, técnicos)
- Inscreve atletas em provas
- Pode ser também atleta ou técnico na mesma delegação
- Solicita transferências de atletas (apenas na janela de segunda-feira)
- Um usuário pertence a **uma única delegação por vez**

### Técnico / Manager
- Visualiza agenda da delegação
- Acompanha resultados
- Não pode inscrever atletas (apenas o chefe pode)

### Atleta
- Visualiza própria agenda e resultados
- Visualiza quadro de medalhas e classificações
- Pode competir em **múltiplas modalidades**
- Histórico de delegações e partidas preservado mesmo após transferências

### Público (sem autenticação)
- Visualiza página inicial, quadro de medalhas, calendário, resultados e perfil de delegações

---

## Regras de Negócio

### Usuários e Delegações
- Registro cria usuário sem delegação
- Para ser chefe de delegação, usuário envia solicitação → admin aprova → delegação é criada ou atribuída
- Convite para delegação: chefe envia convite pelo sistema → usuário recebe **notificação in-app** → aceita ou recusa
- Usuário pode recusar convite; chefe pode revogar convite pendente
- Ao aceitar convite, vínculo anterior é mantido no histórico; novo vínculo inicia
- Transferências só válidas na janela de segunda-feira (00h00–23h59, UTC-3) — verificação automática via backend, tentativas fora do período retornam erro com horário da próxima janela
- Histórico de delegações: `(atleta, delegação, data_entrada, data_saída)` — `data_saída` nulo se ativo

### Integridade Histórica de Partidas
- Toda participação em partida registra `delegacao_na_epoca` (snapshot do vínculo no momento)
- Perfil do atleta exibe cronologia: delegações por período + partidas por delegação representada
- Quadro de medalhas reflete a delegação do momento da conquista (não a atual)

### Inscições e Elegibilidade
- Atleta novo (ou recém-transferido): elegível apenas na próxima semana após cadastro/transferência
- Inscrição fecha quando a semana é travada (primeiro evento inicia)
- Validação automática de regras por esporte (ex: categoria de peso no judô, sexo na modalidade)
- Atleta pode competir em modalidades diferentes na mesma semana se não houver conflito de horário

### Partidas e Resultados
- Com `AUTO_SIMULATE=true` (modo showcase): partidas iniciam automaticamente no horário agendado e finalizam 5 minutos depois com resultados, estatísticas e eventos gerados automaticamente
- Com `AUTO_SIMULATE=false` (modo real): admin controla início, placar ao vivo e encerramento manualmente
- Placar ao vivo atualizado via timeline de eventos (gol ao minuto X, cartão, ponto marcado) — seja pelo admin ou pelo simulador
- Eventos da partida transmitidos em tempo real via SSE para todos os espectadores
- Resultado final gera estatísticas individuais e coletivas
- Estatísticas são específicas por esporte (ver tabela abaixo)
- Após resultado registrado: quadro de medalhas e classificações atualizados em tempo real
- Recordes (melhor tempo, maior pontuação) atualizados automaticamente

### Notificações
- Todas notificações são **in-app** (sem e-mail)
- Usuário vê badge de notificações não lidas no header
- Tipos: convite de delegação, solicitação aprovada/rejeitada, lembrete de partida (24h antes), resultado publicado, transferência aceita/recusada

---

## Modalidades Esportivas

### 1. Futebol (Coletivo — 11 jogadores)
**Estrutura de competição:** Fase de grupos → Mata-mata → Final + Disputa de 3º lugar

**Estatísticas de equipe:** Jogos, Vitórias, Empates, Derrotas, Pontos, Gols marcados, Gols sofridos, Saldo de gols, Cartões amarelos, Cartões vermelhos

**Estatísticas individuais:** Gols, Assistências, Cartões amarelos, Cartões vermelhos, Jogos disputados, Minutos jogados

**Critérios de desempate (grupos):** Pontos > Saldo de gols > Gols marcados > Confronto direto > Cartões

**Regras especiais:** Prorrogação + Pênaltis no mata-mata; máximo 5 substituições; gol contra computa para saldo mas não para artilheiro

---

### 2. Vôlei (Coletivo — 6 jogadores)
**Estrutura:** Fase de grupos → Mata-mata

**Estatísticas de equipe:** Vitórias, Derrotas, Sets ganhos, Sets perdidos, Pontos marcados, Pontos sofridos

**Estatísticas individuais:** Aces, Bloqueios, Pontos de ataque, Erros, Sets jogados

**Critérios de desempate:** Vitórias > Saldo de sets > Saldo de pontos > Confronto direto

**Regras especiais:** Melhor de 5 sets; 5º set vai a 15; rally point

---

### 3. Basquete (Coletivo — 5 jogadores)
**Estrutura:** Fase de grupos → Mata-mata

**Estatísticas de equipe:** Vitórias, Derrotas, Pontos marcados, Pontos sofridos, Saldo

**Estatísticas individuais:** Pontos (1pt/2pt/3pt), Rebotes (ofensivo/defensivo), Assistências, Tocos, Roubadas de bola, Faltas

**Critérios de desempate:** Vitórias > Saldo de pontos > Confronto direto

**Regras especiais:** 4 quartos de 10 min; prorrogação de 5 min em caso de empate; limite de 5 faltas pessoais

---

### 4. Atletismo (Individual e Revezamento)
**Provas planejadas:**
- Corridas: 100m, 200m, 400m, 800m, 1500m (masculino/feminino/misto)
- Saltos: Salto em altura, Salto em distância
- Lançamentos: Arremesso de peso
- Revezamentos: 4x100m, 4x400m

**Estatísticas:** Tempo (cronometrado), Distância/altura (medida), Posição por bateria, Melhor marca pessoal

**Critérios de desempate:** Melhor marca → Segunda melhor → Número de batidas (saltos)

**Regras especiais:** Atleta tem 3 tentativas em saltos/lançamentos; falsa largada = desclassificação; revezamento registra os 4 atletas

---

### 5. Judô (Individual)
**Categorias:** Por peso (até 60kg, 66kg, 73kg, 81kg, 90kg, +90kg — masculino; até 48kg, 52kg, 57kg, 63kg, 70kg, +70kg — feminino)

**Estatísticas:** Ippon (vitória imediata), Waza-ari (½ ponto), Shido (penalidade), Hansoku-make (desqualificação)

**Critérios de desempate:** Ippon > Waza-ari; acúmulo de 2 waza-ari = ippon; 3 shidos = hansoku-make

**Estrutura:** Eliminatória com repechagem para bronze

---

### 6. Handebol (Coletivo — 7 jogadores)
**Estrutura:** Fase de grupos → Mata-mata

**Estatísticas de equipe:** Vitórias, Empates, Derrotas, Pontos, Gols marcados, Gols sofridos, Saldo

**Estatísticas individuais:** Gols marcados, Assistências, Defesas (goleiro), Cartões (amarelo/vermelho/azul), Suspensões de 2 min

**Critérios de desempate:** Pontos > Saldo de gols > Gols marcados > Confronto direto

**Regras especiais:** 2 tempos de 30 min; prorrogação + pênaltis no mata-mata; goleiro pode sair da área

---

### 7. Natação (Individual e Revezamento)
**Provas:**
- 50m Livre, 100m Livre, 200m Livre
- 50m Costas, 50m Peito, 50m Borboleta
- 100m Medley individual
- Revezamento 4x50m Livre, 4x50m Medley

**Estatísticas:** Tempo (centésimos de segundo), Posição por bateria, Melhor marca pessoal, Recorde da competição

**Critérios de desempate:** Tempo cronometrado (tempo menor = melhor)

**Regras especiais:** Saída antecipada = desclassificação; reviramento obrigatório; cronometragem eletrônica preferencial

---

### 8. Vôlei de Praia (Coletivo — 2 jogadores/dupla)
**Estrutura:** Fase de grupos → Eliminatória

**Estatísticas de equipe:** Vitórias, Derrotas, Sets ganhos/perdidos, Pontos marcados/sofridos

**Estatísticas individuais:** Aces, Bloqueios, Pontos de ataque, Erros

**Critérios de desempate:** Vitórias > Saldo de sets > Saldo de pontos

**Regras especiais:** Melhor de 3 sets; 3º set vai a 15; sem substituições

---

### 9. Tênis de Mesa (Individual e Duplas)
**Modalidades:** Simples masculino, Simples feminino, Duplas mistas

**Estatísticas:** Sets ganhos, Sets perdidos, Pontos, Vitórias, Derrotas

**Critérios de desempate:** Vitórias > Saldo de sets > Saldo de pontos

**Estrutura:** Round-robin em grupos → Eliminatória

**Regras especiais:** Melhor de 5 sets (11 pontos cada); alternância de saque a cada 2 pontos; saque alterna a cada set em duplas

---

### 10. Karatê (Individual)
**Modalidades:** Kata (forma) e Kumite (combate)

**Categorias Kumite:** Por peso (similar ao judô)
**Categorias Kata:** Aberta (sem divisão por peso)

**Estatísticas Kumite:** Yuko (1pt), Waza-ari (2pt), Ippon (3pt), Penalidades (Chukoku, Keikoku, Hansoku), Senshu (ponto de iniciativa em empate)

**Estatísticas Kata:** Pontuação dos juízes (0-10), Excluindo maior e menor nota, Média final

**Critérios de desempate Kumite:** Pontuação > Senshu > Categoria de técnica
**Critérios de desempate Kata:** Pontuação dos juízes

**Estrutura:** Eliminatória com repechagem para bronze

---

## Quadro de Medalhas

- Medalhas: Ouro (1º), Prata (2º), Bronze (3º) por modalidade/prova
- Quadro geral: delegação × (ouro, prata, bronze, total)
- Ordenação: Ouro > Prata > Bronze > Total
- Quadro por esporte: classificação específica de cada modalidade
- Recordes: melhor marca registrada na competição por prova
- Melhores marcas pessoais: por atleta, por modalidade

---

---

# BACKEND — FastAPI

## Tecnologias
- Python 3.12+, FastAPI, SQLModel (SQLAlchemy + Pydantic), Alembic
- PostgreSQL (banco principal + tabela `refresh_tokens` para invalidação de JWT)
- JWT + refresh tokens (autenticação) — SSE usa `asyncio.Queue` in-process
- SSE — Server-Sent Events (atualizações em tempo real, unidirecional servidor→cliente)
- APScheduler (automação: travamento de semanas, notificações, geração de partidas)
- LLM via API (geração de conteúdo IA, com modo mock para demos)
- Servidor dedicado
- Todos os timestamps armazenados em UTC; lógica de negócio usa `TIMEZONE=America/Sao_Paulo` (configurável)

## Boas Práticas
- Separação em camadas: `router → service → repository → model`
- Pydantic v2 para validação de request/response
- Migrações com Alembic
- Testes com pytest + httpx
- Documentação automática (Swagger UI via FastAPI)
- `background_tasks` para operações assíncronas (IA, notificações)

---

## Fase 1 — Infraestrutura e Configuração

- [x] Configurar projeto FastAPI com estrutura de pastas (`app/`, `routers/`, `services/`, `models/`, `schemas/`, `repositories/`)
- [x] Configurar banco de dados PostgreSQL com SQLModel + Alembic
- [x] Criar migrações iniciais (tabelas base)
- [x] Configurar variáveis de ambiente (pydantic-settings) — `.env.example` na raiz do repo
- [x] Configurar CORS para o frontend
- [x] Adicionar `TIMEZONE=America/Sao_Paulo` à configuração — usado em toda lógica de data/hora
- [x] Adicionar `AUTO_SIMULATE=true` à configuração — modo showcase: partidas iniciam e finalizam automaticamente com resultados gerados
- [x] Implementar sistema de autenticação JWT (access + refresh tokens)
- [x] Implementar middleware de autenticação e autorização por role
- [x] Criar endpoint de health check (`GET /health`)
- [x] Configurar logging estruturado
- [x] Definir envelope padrão de resposta: listas `{ data: [], meta: { total, page, per_page } }`, erros `{ error, detail, code }`
- [x] Configurar APScheduler com os seguintes jobs:
  - [x] A cada 5min: auto-travar semanas quando `primeiro_evento.start_time < utcnow()`
  - [x] A cada 1min (se `AUTO_SIMULATE=true`): iniciar partidas cujo `start_time` passou e `status == SCHEDULED`
  - [x] A cada 1min (se `AUTO_SIMULATE=true`): finalizar partidas onde `started_at + 5min < utcnow()` → gera resultados e eventos automaticamente
  - [x] Diariamente à meia-noite (UTC-3): enviar notificações de lembrete 24h antes de partidas
- [x] Criar endpoint `POST /admin/demo-seed` — gera semana completa com delegações, atletas, inscrições e resultados (para showcase)
- [x] Criar tabela `users` com campos: id, email, name, password_hash, role, created_at, is_active
- [x] Criar tabela `notifications` com campos: id, user_id, type, payload (JSON), read, created_at
- [x] Criar tabela `delegation_invites` com campos: id, delegation_id, user_id, status (PENDING/ACCEPTED/REFUSED), created_at
- [x] Criar tabela `chief_requests` com campos: id, user_id, delegation_name, message, status, reviewed_by, created_at

## Fase 2 — Autenticação e Usuários

- [x] `POST /auth/register` — cadastro de usuário
- [x] `POST /auth/login` — login, retorna JWT
- [x] `POST /auth/refresh` — renovar access token
- [x] `POST /auth/logout` — invalidar refresh token
- [x] `GET /users/me` — perfil do usuário autenticado
- [x] `PATCH /users/me` — atualizar perfil
- [x] `POST /requests/chief` — solicitar ser chefe de delegação
- [x] `GET /admin/requests` — listar solicitações pendentes (admin)
- [x] `PATCH /admin/requests/{id}` — aprovar ou rejeitar solicitação (admin)
- [x] `GET /users/{id}/notifications` — listar notificações do usuário
- [x] `PATCH /users/notifications/{id}/read` — marcar notificação como lida
- [x] `PATCH /users/notifications/read-all` — marcar todas como lidas
- [x] Serviço de disparo de notificações in-app (chamado por outros serviços)

## Fase 3 — Delegações

- [x] Criar tabela `delegations` com campos: id, code, name, flag_url, chief_id, created_at
- [x] Criar tabela `delegation_members` com campos: id, delegation_id, user_id, role (CHIEF/ATHLETE/COACH), joined_at, left_at (null = ativo)
- [x] `GET /delegations` — listar delegações (público)
- [x] `GET /delegations/{id}` — detalhe de delegação com membros atuais (público)
- [x] `POST /delegations` — criar delegação (admin)
- [x] `PATCH /delegations/{id}` — editar delegação (admin ou chefe)
- [x] `DELETE /delegations/{id}` — arquivar delegação (admin)
- [x] `POST /delegations/{id}/invite` — convidar usuário (chefe)
- [x] `GET /delegations/{id}/invites` — listar convites pendentes (chefe)
- [x] `DELETE /delegations/{id}/invites/{invite_id}` — revogar convite (chefe)
- [x] `POST /invites/{invite_id}/accept` — aceitar convite (usuário notificado)
- [x] `POST /invites/{invite_id}/refuse` — recusar convite (usuário notificado)
- [x] `POST /delegations/{id}/transfer/{user_id}` — solicitar transferência (chefe destino)
- [x] Validação automática de janela de transferência: verifica `datetime.now(ZoneInfo(settings.TIMEZONE)).weekday() == 0` — bloqueia fora de segunda-feira, retorna `{ next_window: "<ISO datetime>" }` no erro
- [x] Serviço de snapshot: registrar `delegation_na_epoca` ao registrar participação em partida
- [x] `GET /delegations/{id}/history` — histórico de membros com datas
- [x] `POST /delegations/ai-generate` — gerar delegações fictícias com IA (admin)

## Fase 4 — Esportes e Modalidades

- [x] Criar tabela `sports` com campos: id, name, type (INDIVIDUAL/TEAM), description, rules_json, player_count, created_at
- [x] Criar tabela `modalities` com campos: id, sport_id, name, gender (M/F/MIXED), category (ex: peso no judô), rules_json
- [x] Criar tabela `sport_statistics_schema` — define campos de estatística por esporte (JSON Schema)
- [x] Popular banco com os 10 esportes e suas modalidades padrão (seed/migration)
- [x] `GET /sports` — listar esportes (público)
- [x] `GET /sports/{id}` — detalhe com modalidades (público)
- [x] `POST /sports` — criar esporte (admin)
- [x] `PATCH /sports/{id}` — editar (admin)
- [x] `DELETE /sports/{id}` — arquivar (admin)
- [x] `POST /sports/{id}/modalities` — criar modalidade (admin)
- [x] `PATCH /modalities/{id}` — editar modalidade (admin)
- [x] `DELETE /modalities/{id}` — arquivar (admin)
- [x] `POST /sports/ai-generate` — gerar esportes/modalidades com IA (admin)

## Fase 5 — Atletas e Técnicos

- [x] Criar tabela `athletes` com campos: id, user_id (FK nullable — pode ser IA gerado), name, birthdate, code, created_at
- [x] Criar tabela `athlete_modalities` — vínculo atleta × modalidade (com categoria, se aplicável)
- [x] `GET /athletes` — listar (admin: global; chefe: só da delegação)
- [x] `GET /athletes/{id}` — perfil do atleta com histórico de delegações e partidas
- [x] `POST /athletes` — cadastrar atleta (admin ou chefe)
- [x] `PATCH /athletes/{id}` — editar (admin ou chefe da delegação)
- [x] `DELETE /athletes/{id}` — arquivar (admin)
- [x] `GET /athletes/{id}/history` — histórico: delegações por período, partidas por delegação
- [x] `GET /athletes/{id}/statistics` — estatísticas por modalidade e temporada
- [x] `POST /athletes/ai-generate` — gerar atletas com IA (admin)
- [x] Validação de elegibilidade: atleta cadastrado/transferido após semana travada → só próxima semana

## Fase 6 — Semanas de Competição

- [x] Criar tabela `competition_weeks` com campos: id, week_number, start_date, end_date, status (DRAFT/SCHEDULED/LOCKED/ACTIVE/COMPLETED), sport_focus (JSON array)
- [ ] `GET /weeks` — listar semanas
- [ ] `GET /weeks/{id}` — detalhe da semana
- [ ] `POST /weeks` — criar semana (admin)
- [ ] `PATCH /weeks/{id}` — editar semana (admin — proibido se LOCKED ou posterior)
- [ ] `POST /weeks/{id}/publish` — publicar calendário (DRAFT → SCHEDULED)
- [ ] `POST /weeks/{id}/lock` — travar manualmente (SCHEDULED → LOCKED) + dispara geração de partidas
- [ ] Travamento automático via APScheduler: a cada 5min verifica se `primeiro_evento.start_time < now(UTC)` e status ainda é SCHEDULED → auto-lock
- [ ] `POST /weeks/{id}/activate` — ativar semana (LOCKED → ACTIVE)
- [ ] `POST /weeks/{id}/complete` — encerrar semana (ACTIVE → COMPLETED)
- [ ] `POST /weeks/{id}/generate-schedule` — prévia da geração de partidas (admin, pré-lock, não persiste)
- [ ] Serviço `transfer_window_service`: verifica `weekday() == 0` em UTC-3 — chamado por toda solicitação de transferência
- [ ] Serviço: verificar elegibilidade de atleta/delegação para semana

## Fase 7 — Calendário e Partidas

- [x] Criar tabela `events` com campos: id, week_id, modality_id, date, time, venue, phase (GROUPS/QUARTER/SEMI/FINAL/BRONZE), status (SCHEDULED/IN_PROGRESS/COMPLETED/CANCELLED)
- [x] Criar tabela `matches` com campos: id, event_id, team_a_delegation_id, team_b_delegation_id (ou athlete_a/b para individuais), score_a, score_b, winner_delegation_id, status, started_at, ended_at
- [x] Criar tabela `match_participants` com campos: id, match_id, athlete_id, delegation_id_at_time, role (PLAYER/CAPTAIN/SUBSTITUTE)
- [x] Criar tabela `match_events` com campos: id, match_id, minute, type (GOAL/CARD/POINT/PENALTY/SUBSTITUTION/etc.), athlete_id, delegation_id_at_time, value_json — timeline da partida
- [ ] `GET /events` — calendário geral (público, filtros: semana, esporte, data)
- [ ] `GET /events/{id}` — detalhe do evento com partidas
- [ ] `POST /events` — criar evento (admin)
- [ ] `PATCH /events/{id}` — editar (admin — proibido se semana LOCKED+)
- [ ] `DELETE /events/{id}` — cancelar (admin)
- [ ] `GET /matches/{id}` — detalhe da partida com participantes, placar e eventos
- [ ] `POST /matches/{id}/events` — registrar evento da partida (admin — gol, cartão, ponto, etc.) — mesma rota usada pelo `simulation_service`
- [ ] `GET /matches/{id}/events` — listar timeline de eventos (público)
- [ ] `GET /matches/{id}/stream` — SSE stream de eventos e placar ao vivo
- [ ] `POST /matches/{id}/start` — iniciar partida
- [ ] `POST /matches/{id}/finish` — encerrar partida e disparar cálculo de resultados
- [ ] `POST /events/ai-generate` — gerar calendário com IA (admin)
- [ ] Serviço `bracket_service`: gera pareamentos por modalidade a partir das inscrições aprovadas (round-robin para grupos, eliminatória para mata-mata)
- [ ] Serviço `schedule_service`: distribui partidas geradas por slots de tempo (Ter–Dom), respeitando conflitos de atleta e capacidade de venue
- [ ] Geração automática de chaveamento mata-mata após conclusão da fase de grupos

## Fase 8 — Inscrições

- [x] Criar tabela `enrollments` com campos: id, athlete_id, event_id, delegation_id, status (PENDING/APPROVED/REJECTED), validation_message, created_at
- [ ] `GET /enrollments` — listar inscrições (admin: global; chefe: delegação)
- [ ] `POST /enrollments` — inscrever atleta em evento (chefe)
- [ ] `DELETE /enrollments/{id}` — cancelar inscrição (chefe — antes do travamento)
- [ ] `PATCH /enrollments/{id}/review` — aprovar/rejeitar inscrição (admin)
- [ ] Motor de validação genérico: lê regras do `rules_json` da modalidade — sem hardcode por esporte
  - [ ] Formato de `rules_json`: `{ "max_athletes": N, "gender": "M/F/MIXED", "weight_categories": [...], "schedule_conflict_check": bool }`
  - [ ] Categoria de peso (lida de `weight_categories` no rules_json)
  - [ ] Gênero da modalidade (lido de `gender` no rules_json)
  - [ ] Número máximo de atletas por equipe (lido de `max_athletes`)
  - [ ] Conflito de horário (mesmo atleta em dois eventos simultâneos)
  - [ ] Elegibilidade de semana (atleta cadastrado/transferido antes do travamento)
- [ ] `POST /enrollments/ai-generate` — gerar inscrições com IA (admin)

## Fase 9 — Resultados e Quadro de Medalhas

- [x] Criar tabela `results` com campos: id, match_id, athlete_id (ou delegation_id para coletivo), rank, medal (GOLD/SILVER/BRONZE/null), value (JSON — estatísticas específicas)
- [x] Criar tabela `athlete_statistics` com campos: id, athlete_id, sport_id, week_id, stats_json (dinâmico por esporte)
- [x] Criar tabela `records` com campos: id, modality_id, athlete_id, delegation_id_at_time, value, week_id, date
- [ ] `GET /results` — listar resultados (público, filtros: semana, esporte, delegação)
- [ ] `GET /results/medal-board` — quadro de medalhas geral em tempo real (público)
- [ ] `GET /results/medal-board/{sport_id}` — quadro por esporte (público)
- [ ] `POST /results` — registrar resultado (admin)
- [ ] `PATCH /results/{id}` — corrigir resultado (admin)
- [ ] `GET /results/standings/{modality_id}` — classificação da modalidade
- [ ] `GET /results/records` — recordes da competição
- [ ] Serviço: atualizar quadro de medalhas após registro de resultado
- [ ] Serviço: verificar e atualizar recordes (melhor marca por prova)
- [ ] Serviço: calcular estatísticas individuais por esporte com regras específicas
- [ ] Serviço `simulation_service`: gera resultados, eventos e estatísticas realistas por esporte (chamado pelo scheduler quando `AUTO_SIMULATE=true` ou manualmente via `POST /admin/simulate/match/{id}`)
  - Futebol: placar 0–4 × 0–4, eventos de gol (minuto aleatório), cartões ocasionais
  - Judô/Karatê: ippon, waza-ari ou decisão por pontos com tempo simulado
  - Atletismo/Natação: tempo cronometrado dentro de faixa realista por prova
  - Vôlei/Basquete/Handebol: placar por sets/quartos dentro de faixa típica
  - Gera `match_events` por cada ponto/gol/evento relevante
  - Atualiza `athlete_statistics`, `results`, `records` após simular
- [ ] `POST /admin/simulate/match/{id}` — simular partida específica manualmente (admin, qualquer `AUTO_SIMULATE`)
- [ ] SSE endpoint para atualização em tempo real do quadro de medalhas (`GET /results/medal-board/stream`) — broadcasting via `asyncio.Queue` in-process
- [ ] `POST /results/ai-generate/{event_id}` — gerar resultados com IA (admin) — substituto manual do `simulation_service`

## Fase 10 — Relatórios e IA

- [ ] `GET /report/final` — relatório final: medalhas + classificações + recordes + melhores marcas
- [ ] `GET /report/week/{week_id}` — relatório da semana
- [ ] `GET /report/athlete/{athlete_id}` — relatório individual do atleta
- [ ] `GET /narrative/today` — narrativa do dia (gerada ou em cache)
- [ ] `GET /narrative/{date}` — narrativa de data específica
- [ ] `POST /narrative/generate` — gerar narrativa com IA (admin)
- [ ] `GET /ai/generation-history` — histórico de gerações por tipo (admin)
- [ ] Serviço de IA: integração com LLM para geração de:
  - [ ] Delegações fictícias com contexto
  - [ ] Atletas com nomes, idades e perfis realistas
  - [ ] Calendário otimizado por esporte e local
  - [ ] Resultados plausíveis com base nos esportes e regras
  - [ ] Narrativa contextualizada dos destaques do dia
- [ ] `GET /report/export/pdf` — exportar relatório em PDF *(opcional — pós-showcase)*
- [ ] `GET /report/export/csv` — exportar resultados em CSV *(opcional — pós-showcase)*

---

---

# FRONTEND — TanStack Start

## Tecnologias
- TanStack Start (React 19, SSR + SPA seletivo)
- TanStack Router (file-based routing, `beforeLoad` guards)
- TanStack Query (server state, cache para navegação instantânea)
- Tailwind CSS v4, shadcn/ui (`@base-ui/react`)
- Cloudflare Workers (deploy via Alchemy)
- Bun (package manager)

## Estratégia SSR por Rota

| Rota | Modo | Motivo |
|------|------|--------|
| `/`, `/login`, `/register` | SSR completo | SEO, primeira pintura rápida |
| `/results`, `/calendar`, `/sports`, `/delegations/*` | SSR completo | Conteúdo público indexável |
| `/dashboard`, áreas autenticadas | `ssr: 'data-only'` | Dados no servidor, componente no cliente (QueryClient/browser APIs) |
| `/admin/ai`, match ao vivo | `ssr: false` | Streaming IA, SSE |

## Padrão de Autenticação

```
_authenticated.tsx       — beforeLoad: checa context.session → redirect /login
  _admin.tsx             — beforeLoad: checa session.role === 'ADMIN'
  _chief.tsx             — beforeLoad: checa role CHIEF ou ADMIN
```

Sessão carregada via server function no `__root.tsx` e injetada no router context.

## Boas Práticas

- `queryOptions()` factory compartilhado entre loader (prefetch no servidor) e hook `useSuspenseQuery` (componente)
- `staleTime` configurado por tipo de dado (listas: 2min, medal board: 30s, IA: 10min)
- `routerWithQueryClient` — QueryClient no contexto do router, sem duplo provider
- `RouteErrorComponent` global para tratar `ApiError` com retry
- Navegação instantânea: loader chama `queryClient.ensureQueryData` → sem spinner no retorno

---

## Fase 1 — Infraestrutura Frontend

- [ ] Configurar `QueryClient` com `staleTime`/`gcTime` padrão no `router.tsx`
- [ ] Integrar `routerWithQueryClient` do `@tanstack/react-router-with-query`
- [ ] Adicionar `queryClient: QueryClient` ao `RouterAppContext` em `__root.tsx`
- [ ] Criar server function de sessão no `__root.tsx` (carrega sessão do cookie JWT)
- [ ] Criar `_authenticated.tsx` — layout guard com `beforeLoad` → redirect `/login`
- [ ] Criar `_admin.tsx` — guard de role admin (nested em `_authenticated`)
- [ ] Criar `_chief.tsx` — guard de role chefe/admin (nested em `_authenticated`)
- [ ] Criar `apps/web/src/lib/api.ts` — cliente tipado para FastAPI (`apiFetch`, `ApiError`)
- [ ] Criar `apps/web/src/lib/queryKeys.ts` — factories de query keys por domínio
- [ ] Criar `apps/web/src/queries/` — hooks por domínio (`delegations.ts`, `sports.ts`, etc.)
- [ ] Criar componente `RouteErrorComponent` — trata `ApiError` com retry
- [ ] Adicionar shadcn components em `packages/ui`: `table`, `badge`, `tabs`, `dialog`, `select`, `separator`, `tooltip`, `progress`, `scroll-area`, `avatar`, `popover`, `sheet`, `alert`, `form`
- [ ] Atualizar `packages/env/src/web.ts` — validar `VITE_SERVER_URL` e `VITE_TIMEZONE` com Zod
- [ ] Criar utilitário `apps/web/src/lib/date.ts` — `formatEventDate(iso)` sempre formata em `VITE_TIMEZONE`, nunca timezone do navegador
- [ ] Adicionar dark mode toggle no header (next-themes já instalado — 1 botão, ícone sol/lua)

## Fase 2 — Páginas Públicas (SSR)

- [ ] Atualizar `routes/index.tsx` — landing page: resumo da competição, quadro de medalhas ao vivo, próximos eventos, destaque do dia
- [ ] `routes/login.tsx` — formulário de login, redirect pós-login
- [ ] `routes/register.tsx` — formulário de cadastro
- [ ] `routes/request-chief.tsx` — formulário de solicitação de chefe
- [ ] `routes/(public)/results/index.tsx` — quadro de medalhas público (SSR + polling 30s)
- [ ] `routes/(public)/calendar/index.tsx` — calendário público por semana/esporte
- [ ] `routes/(public)/delegations/index.tsx` — lista de delegações
- [ ] `routes/(public)/delegations/$delegationId/index.tsx` — perfil público da delegação
- [ ] `routes/(public)/sports/index.tsx` — visão geral dos 10 esportes
- [ ] `routes/(public)/sports/$sportId/index.tsx` — detalhe do esporte + classificação

## Fase 3 — Notificações e Onboarding

- [ ] Componente `NotificationBell` no header — badge de não lidas + dropdown
- [ ] `NotificationItem` — renderiza por tipo (convite, aprovação, lembrete, resultado)
- [ ] Fluxo de aceitar/recusar convite de delegação direto da notificação
- [ ] Página de status da solicitação de chefe (`/request-chief/status`)
- [ ] Indicador de janela de transferência ativa no header (segunda-feira)

## Fase 4 — Dashboard

- [ ] `routes/_authenticated/dashboard/index.tsx` (`ssr: 'data-only'`)
  - [ ] **Admin**: total de delegações, atletas, status da semana, solicitações pendentes, atalhos de geração IA
  - [ ] **Admin — gráficos**: progressão de medalhas por delegação, atletas por esporte (barra), taxa de partidas concluídas (gauge)
  - [ ] **Chefe**: minha delegação, próximas partidas, status de inscrições, avisos
  - [ ] **Atleta/Técnico**: minhas próximas partidas, meus resultados recentes

## Fase 5 — Gestão de Delegações (Admin)

- [ ] `routes/_authenticated/_admin/delegations/index.tsx` — lista com filtros, paginação, ação de gerar IA
- [ ] `routes/_authenticated/_admin/delegations/new.tsx` — formulário de criação
- [ ] `routes/_authenticated/_admin/delegations/$delegationId/index.tsx` — detalhe: membros, histórico, partidas
- [ ] `routes/_authenticated/_admin/delegations/$delegationId/edit.tsx` — edição
- [ ] Botão "Gerar com IA" com feedback de loading + toast de sucesso

## Fase 6 — Minha Delegação (Chefe)

- [ ] `routes/_authenticated/_chief/my-delegation/index.tsx` — overview da delegação
- [ ] `routes/_authenticated/_chief/my-delegation/members.tsx` — lista membros, convites pendentes, ações
- [ ] `routes/_authenticated/_chief/my-delegation/invite.tsx` — buscar usuário + enviar convite
- [ ] `routes/_authenticated/_chief/my-delegation/transfers.tsx` — painel de transferências (ativo só na segunda)

## Fase 7 — Esportes e Modalidades (Admin)

- [ ] `routes/_authenticated/_admin/sports/index.tsx` — lista os 10 esportes + status
- [ ] `routes/_authenticated/_admin/sports/$sportId/index.tsx` — detalhe: modalidades, regras, estatísticas-schema
- [ ] `routes/_authenticated/_admin/sports/$sportId/modalities/new.tsx` — criar modalidade
- [ ] `routes/_authenticated/_admin/sports/$sportId/modalities/$modalityId/edit.tsx` — editar regras

## Fase 8 — Atletas e Técnicos

- [ ] `routes/_authenticated/_admin/athletes/index.tsx` — lista global com filtros
- [ ] `routes/_authenticated/_chief/athletes/index.tsx` — atletas da delegação
- [ ] `routes/_authenticated/athletes/$athleteId/index.tsx` — perfil do atleta:
  - [ ] Dados pessoais e modalidades
  - [ ] Timeline de delegações (com datas)
  - [ ] Histórico de partidas (com delegação na época)
  - [ ] Estatísticas por esporte
- [ ] `routes/_authenticated/_admin/athletes/new.tsx` — cadastrar atleta (admin)
- [ ] `routes/_authenticated/_chief/athletes/new.tsx` — cadastrar atleta (chefe)
- [ ] Botão "Gerar com IA" (admin)

## Fase 9 — Semanas de Competição (Admin)

- [ ] `routes/_authenticated/_admin/weeks/index.tsx` — lista das semanas com status visual
- [ ] `routes/_authenticated/_admin/weeks/new.tsx` — criar semana
- [ ] `routes/_authenticated/_admin/weeks/$weekId/index.tsx` — detalhe da semana: eventos, status, ações de transição
- [ ] Controles de estado: Publicar → Travar → Ativar → Encerrar (com confirmação) — travar também disponível como ação manual além do automático
- [ ] Indicador "Janela de transferência aberta" — visível quando dia atual é segunda-feira em UTC-3
- [ ] Indicador de próxima janela de transferência com countdown quando fora de segunda

## Fase 10 — Calendário e Partidas

- [ ] `routes/_authenticated/_admin/calendar/index.tsx` — administração do calendário da semana
- [ ] `routes/_authenticated/_admin/calendar/events/new.tsx` — criar evento
- [ ] `routes/(public)/calendar/$weekId/index.tsx` — calendário público da semana (SSR)
- [ ] `routes/_authenticated/matches/$matchId/index.tsx` (`ssr: false`) — partida ao vivo:
  - [ ] Placar em tempo real via SSE (`GET /matches/{id}/stream`)
  - [ ] Feed de eventos da partida ao vivo (gols, cartões, pontos com minuto)
  - [ ] Lista de participantes com delegação na época
  - [ ] Formulário de registro de evento (admin — tipo, atleta, minuto)
- [ ] Componente `BracketView` — visualização de chaveamento mata-mata por modalidade
- [ ] `routes/(public)/sports/$sportId/bracket.tsx` — página pública de chaveamento (SSR)
- [ ] Botão "Gerar Calendário com IA" (admin)

## Fase 11 — Inscrições

- [ ] `routes/_authenticated/_admin/enrollments/index.tsx` — todas inscrições com filtros + revisão
- [ ] `routes/_authenticated/_chief/enrollments/index.tsx` — inscrições da delegação
- [ ] `routes/_authenticated/_chief/enrollments/new.tsx` — inscrever atleta em evento:
  - [ ] Seletor de evento (filtrado por semana/esporte)
  - [ ] Seletor de atleta (filtrado por elegibilidade)
  - [ ] Validação em tempo real das regras do esporte
- [ ] Badge de status de inscrição (PENDING/APPROVED/REJECTED) com mensagem de validação
- [ ] Bloqueio visual de inscrições quando semana está TRAVADA
- [ ] Botão "Gerar Inscrições com IA" (admin)

## Fase 12 — Resultados e Quadro de Medalhas

- [ ] `routes/(public)/results/index.tsx` — quadro de medalhas ao vivo (SSR + refetch 30s)
- [ ] `routes/(public)/results/sports/$sportId/index.tsx` — classificação por esporte
- [ ] `routes/_authenticated/_admin/results/index.tsx` — painel de entrada de resultados
- [ ] `routes/_authenticated/_admin/results/$matchId/new.tsx` — registrar resultado com campos específicos por esporte
- [ ] `routes/(public)/results/records/index.tsx` — recordes e melhores marcas da competição
- [ ] Componente `MedalBoard` — tabela com ouro/prata/bronze animado
- [ ] Componente `SportStandings` — tabela de classificação por esporte com critérios de desempate
- [ ] Botão "Gerar Resultados com IA" (admin)

## Fase 13 — Painel de IA (Admin)

- [ ] `routes/_authenticated/_admin/ai/index.tsx` (`ssr: false`) — painel central de geração:
  - [ ] Card por categoria: Delegações, Esportes, Atletas, Calendário, Inscrições, Resultados, Narrativa
  - [ ] Botão "Gerar" por categoria com indicador de progresso
  - [ ] Histórico das últimas gerações com timestamp e quantidade
  - [ ] Preview do conteúdo gerado antes de confirmar
- [ ] Componente `AiGenerateButton` — reutilizável, loading state + toast

## Fase 14 — Relatórios e Exportação

- [ ] `routes/(public)/report/index.tsx` — relatório final público (SSR)
  - [ ] Quadro de medalhas completo
  - [ ] Classificação por modalidade
  - [ ] Recordes e melhores marcas
  - [ ] Destaque de atletas
- [ ] `routes/_authenticated/narrative/index.tsx` (`ssr: false`) — narrativa gerada por IA:
  - [ ] Histórico de narrativas por dia
  - [ ] Botão "Gerar narrativa do dia" (admin)
  - [ ] Rendering de texto rico com destaques
- [ ] Botão de exportação PDF (`/report/export/pdf`) *(opcional — pós-showcase)*
- [ ] Botão de exportação CSV (`/report/export/csv`) *(opcional — pós-showcase)*

---

## Features Adicionais Sugeridas

- [x] **Chaveamento automático**: ~~gerar brackets~~ → movido para core (Fase 7 backend + Fase 10 frontend)
- [x] **Dark/Light mode toggle**: ~~suportado por next-themes~~ → movido para core (Fase 1 frontend)
- [ ] **Comparação de atletas**: tela side-by-side com estatísticas de dois atletas (head-to-head)
- [ ] **Busca global**: buscar atletas, delegações, eventos por nome
- [ ] **Filtros e ordenação**: tabelas com filtros persistidos na URL via TanStack Router search params
- [ ] **PWA**: adicionar suporte PWA para uso em dispositivos móveis no local do evento
- [ ] **Feed de atividades**: timeline global de eventos da competição em tempo real
- [ ] **Estatísticas de delegação**: página com todos os atletas, medalhas, e desempenho histórico por semana
- [ ] **Regras editáveis**: admin pode editar as regras de cada esporte sem alterar código (edita `rules_json` via UI)
