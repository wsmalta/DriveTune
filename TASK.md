# DriveTune — TASK

Este arquivo controla a execução do desenvolvimento.

O agente deve executar as tarefas em ordem de prioridade, respeitando dependências.

---

# Status

Legenda:

* `[ ]` pendente
* `[~]` em andamento
* `[x]` concluída
* `[!]` bloqueada

---

# FASE 0 — POC (Prova de Conceito)

> Objetivo: Validar o fluxo técnico crítico antes do MVP.
> Se a POC falhar, reconsiderar arquitetura (ex: backend para streaming).

## POC-001 — Setup mínimo React + Vite

Status: `[x]`

### Objetivo

Criar projeto React + Vite + TypeScript funcional.

### Critérios de aceitação

* `npm create vite` com React + TypeScript;
* `npm run dev` funciona;
* `npm run build` funciona;
* pasta `src/` organizada com estrutura básica.

---

## POC-002 — Google Identity Services (GIS)

Status: `[x]`

### Objetivo

Integrar autenticação Google no navegador.

### Critérios de aceitação

* GIS carregado via script tag ou npm;
* `client_id` configurado via variável de ambiente;
* botão "Entrar com Google" visível;
* ao clicar, fluxo de consentimento é iniciado;
* token de acesso é obtido e armazenado em memória;
* logout funciona (token é removido).

---

## POC-003 — Listar pastas do Drive

Status: `[x]`

### Objetivo

Usar o token para listar pastas do Drive do usuário.

### Critérios de aceitação

* requisição `GET /drive/v3/files?q=mimeType='application/vnd.google-apps.folder'` funciona;
* pastas são exibidas na tela;
* usuário consegue selecionar uma pasta;
* ID da pasta selecionada é armazenado.

---

## POC-004 — Listar MP3s na pasta

Status: `[x]`

### Objetivo

Listar arquivos MP3 dentro da pasta escolhida.

### Critérios de aceitação

* requisição lista arquivos com `mimeType='audio/mpeg'` ou extensão `.mp3`;
* cada arquivo exibe nome;
* cada arquivo possui referência ao `driveFileId`;
* arquivos não-MP3 são ignorados.

---

## POC-005 — Stream de um MP3

Status: `[x]`

### Objetivo

Reproduzir um MP3 diretamente do Google Drive.

### Critérios de aceitação

* ao clicar em uma música, `<audio>` é criado;
* `src` do áudio usa `https://www.googleapis.com/drive/v3/files/{id}?alt=media`;
* header `Authorization: Bearer {token}` é enviado;
* música começa a tocar;
* barra de progresso funciona.

---

## POC-006 — Testar seek

Status: `[x]`

### Objetivo

Validar que avançar/voltar na faixa funciona.

### Critérios de aceitação

* slider de progresso permite mudar posição;
* `audio.currentTime` é atualizado corretamente;
* não há erro ao fazer seek em arquivo remoto.

---

## POC-007 — Tela bloqueada (Android/Chrome)

Status: `[x]`

### Objetivo

Validar reprodução com tela bloqueada.

### Critérios de aceitação

* bloquear tela no Android/Chrome;
* áudio continua tocando por pelo menos 30 segundos;
* não há interrupção ao minimizar o navegador.

---

## POC-008 — Media Session API

Status: `[x]`

### Objetivo

Integrar controles de mídia do sistema.

### Critérios de aceitação

* `navigator.mediaSession` é configurado;
* metadados da música atual são exibidos (título, artista);
* botões play/pause, próxima, anterior funcionam na tela de bloqueio;
* teste em Android/Chrome.

---

## POC-009 — Próxima música automática

Status: `[x]`

### Objetivo

Avançar automaticamente para a próxima faixa.

### Critérios de aceitação

* evento `ended` no `<audio>` dispara próxima música;
* fila simples funciona (array de IDs);
* música seguinte toca sem intervenção do usuário.

---

# FASE 0.5 — Fundação

> Objetivo: Estruturar o projeto para o MVP após POC validada.

## T001 — Inicializar projeto

Status: `[ ]`

### Objetivo

Criar estrutura do projeto com React + Vite + TypeScript.

### Critérios de aceitação

* projeto inicializado;
* Git configurado;
* `npm run dev` e `npm run build` funcionam;
* pasta `src/` com estrutura organizada;
* documentação preservada.

---

## T002 — Registrar stack em ARCHITECTURE.md

Status: `[ ]`

### Objetivo

Confirmar decisões técnicas no documento de arquitetura.

### Critérios de aceitação

* `docs/ARCHITECTURE.md` atualizado com stack definitiva;
* nenhuma tecnologia escolhida por conveniência do agente.

---

## T003 — Configurar PWA

Status: `[ ]`

### Objetivo

Transformar a aplicação em PWA básica.

### Critérios de aceitação

* `manifest.json` configurado;
* ícones configurados;
* service worker registrado;
* aplicação instalável quando suportada;
* funcionamento básico em modo standalone.

---

## T004 — Configurar Dexie.js

Status: `[ ]`

### Objetivo

Preparar IndexedDB para persistência local.

### Critérios de aceitação

* Dexie.js instalado;
* banco de dados definido com tabelas: `tracks`, `albums`, `artists`, `playlists`, `playlistItems`, `favorites`, `playbackState`;
* `npm run build` sem erros.

---

## T005 — Configurar Google Identity Services

Status: `[ ]`

### Objetivo

Preparar autenticação Google para uso na aplicação.

### Critérios de aceitação

* GIS integrado;
* `VITE_GOOGLE_CLIENT_ID` em `.env` (não versionado);
* helper de autenticação criado em `src/auth/`;
* login e logout funcionais.

---

# FASE 1 — Autenticação

## T010 — Login Google completo

Status: `[x]`

### Objetivo

Fluxo completo de autenticação do usuário.

### Critérios de aceitação

* usuário consegue iniciar login;
* autorização é solicitada;
* usuário autenticado é reconhecido pela aplicação;
* tokens não aparecem no código-fonte;
* estado de autenticação é persistido na sessão.

---

## T011 — Implementar logout

Status: `[x]`

### Objetivo

Permitir encerramento seguro da sessão.

### Critérios de aceitação

* usuário consegue sair;
* sessão deixa de estar disponível;
* usuário não consegue acessar biblioteca protegida após logout.

---

# FASE 2 — Google Drive

## T020 — Solicitar acesso mínimo ao Drive

Status: `[x]`

### Objetivo

Configurar os escopos necessários para acessar a biblioteca musical.

### Critérios de aceitação

* somente permissões necessárias são solicitadas (`drive.readonly` ou equivalente);
* aplicação consegue identificar as pastas permitidas.

---

## T021 — Selecionar pasta musical

Status: `[x]`

### Objetivo

Permitir que o usuário escolha a pasta onde estão suas músicas.

### Critérios de aceitação

* pastas disponíveis são apresentadas;
* usuário consegue selecionar uma pasta;
* ID da pasta é armazenado no IndexedDB;
* pasta selecionada pode ser recuperada posteriormente.

---

## T022 — Listar arquivos MP3

Status: `[x]`

### Objetivo

Localizar os arquivos MP3 dentro da pasta escolhida.

### Critérios de aceitação

* arquivos MP3 são identificados;
* arquivos não suportados são ignorados;
* cada música possui referência ao arquivo no Drive (`driveFileId`);
* metadados básicos são extraídos do nome do arquivo.

---

# FASE 3 — Biblioteca

## T030 — Criar modelo de faixa

Status: `[x]`

### Objetivo

Criar representação interna de uma música.

### Dados iniciais

```text
id
driveFileId
name
artist
album
trackNumber
genre
duration
```

---

## T031 — Exibir biblioteca

Status: `[x]`

### Objetivo

Apresentar as músicas encontradas.

### Critérios de aceitação

* lista de músicas;
* artista quando disponível;
* álbum quando disponível;
* seleção de uma música inicia reprodução.

---

## T032 — Navegação por artista

Status: `[x]`

### Objetivo

Permitir visualizar músicas agrupadas por artista.

### Critérios de aceitação

* lista de artistas;
* ao selecionar artista, vê seus álbuns/músicas;
* navegação de volta funciona.

---

## T033 — Navegação por álbum

Status: `[x]`

### Objetivo

Permitir visualizar músicas agrupadas por álbum.

### Critérios de aceitação

* lista de álbuns (quando disponível);
* ao selecionar álbum, vê suas faixas;
* faixas numeradas.

---

## T034 — Busca

Status: `[x]`

### Objetivo

Permitir procurar músicas.

### Critérios de aceitação

Buscar por:

* nome;
* artista;
* álbum.

A busca deve funcionar sem exigir que o usuário percorra manualmente a biblioteca.

---

# FASE 4 — Player

## T040 — Criar player básico

Status: `[x]`

### Objetivo

Implementar reprodução de uma música.

### Critérios de aceitação

* play;
* pause;
* progresso;
* duração;
* erro de reprodução tratado.

---

## T041 — Player persistente

Status: `[x]`

### Objetivo

Manter o player disponível durante a navegação.

### Critérios de aceitação

* player permanece visível ao navegar entre telas;
* estado de reprodução é mantido.

---

## T042 — Próxima e anterior

Status: `[x]`

### Objetivo

Implementar navegação entre músicas da fila.

### Critérios de aceitação

* botão próxima;
* botão anterior;
* respeita fim da fila (quando sem repetição).

---

## T043 — Seek

Status: `[x]`

### Objetivo

Permitir avançar e retroceder na música.

### Critérios de aceitação

* slider de progresso funcional;
*拖拽 funciona;
* tempo atual é atualizado.

---

## T044 — Volume

Status: `[x]`

### Objetivo

Implementar controle de volume.

### Critérios de aceitação

* slider de volume;
* mudo/desmudo;
* volume é persistido na sessão.

---

## T045 — Fila de reprodução

Status: `[x]`

### Objetivo

Criar e controlar a fila de reprodução.

### Critérios de aceitação

* adicionar música à fila;
* remover música da fila;
* limpar fila;
* próxima;
* anterior;
* fila visível na interface.

---

## T046 — Aleatório

Status: `[x]`

### Objetivo

Implementar reprodução aleatória.

### Critérios de aceitação

* botão aleatório;
* quando ativo, próxima música é escolhida aleatoriamente;
* toggle liga/desliga.

---

## T047 — Repetição

Status: `[x]`

### Objetivo

Implementar modos de repetição.

### Critérios de aceitação

* sem repetição;
* repetir fila;
* repetir música;
* ciclo entre os modos ao pressionar botão.

---

# FASE 5 — Reprodução em segundo plano

## T050 — Media Session API

Status: `[ ]`

### Objetivo

Integrar o player aos controles de mídia do sistema.

### Critérios de aceitação

Quando suportado:

* play/pause;
* próxima;
* anterior;
* informações da música atual;
* controles na tela de bloqueio.

---

## T051 — Testar reprodução em segundo plano

Status: `[ ]`

### Objetivo

Validar a reprodução com:

* tela bloqueada;
* aplicativo minimizado;
* outro aplicativo em primeiro plano.

### Critérios de aceitação

* documentar comportamento em Android/Chrome;
* documentar comportamento em iOS/Safari;
* identificar limitações.

---

# FASE 6 — Playlists

## T060 — Criar playlist

Status: `[x]`

### Objetivo

Permitir criar playlists.

### Critérios de aceitação

*botão criar playlist;
* dialog para nome;
* playlist criada no IndexedDB.

---

## T061 — Adicionar música à playlist

Status: `[x]`

### Objetivo

Permitir adicionar músicas a uma playlist.

### Critérios de aceitação

* opção "Adicionar à playlist" no menu da música;
* lista de playlists disponíveis;
* música é adicionada.

---

## T062 — Remover música da playlist

Status: `[x]`

### Objetivo

Permitir remover músicas de uma playlist.

### Critérios de aceitação

* opção remover em cada música da playlist;
* música é removida da playlist (não do Drive).

---

## T063 — Listar playlists

Status: `[x]`

### Objetivo

Apresentar as playlists do usuário.

### Critérios de aceitação

* lista de playlists;
* ao selecionar, vê as músicas;
* opção excluir playlist.

---

# FASE 7 — Favoritos

## T070 — Favoritar música

Status: `[x]`

### Objetivo

Permitir marcar músicas como favoritas.

### Critérios de aceitação

* botão/ícone de favorito;
* toggle favorito;
* estado persistido no IndexedDB.

---

## T071 — Listar favoritas

Status: `[x]`

### Objetivo

Apresentar músicas favoritas.

### Critérios de aceitação

* seção "Favoritas" na biblioteca;
* lista de músicas favoritas;
* reproduzir a partir da lista.

---

# FASE 8 — Histórico

## T080 — Registrar reprodução

Status: `[ ]`

### Objetivo

Registrar músicas reproduzidas.

### Critérios de aceitação

* ao tocar uma música, registro é criado;
* dados: música, data/hora.

---

## T081 — Listar histórico

Status: `[ ]`

### Objetivo

Apresentar reproduções recentes.

### Critérios de aceitação

* seção "Recentes" na biblioteca;
* lista ordenada por data;
* reproduzir a partir da lista.

---

# FASE 9 — Retomar reprodução

## T090 — Salvar estado do player

Status: `[ ]`

### Objetivo

Persistir estado de reprodução.

### Critérios de aceitação

* ao sair ou recarregar, estado é salvo:
  * track atual;
  * posição;
  * fila;
  * currentIndex.

---

## T091 — Restaurar estado

Status: `[ ]`

### Objetivo

Restaurar estado de reprodução anterior.

### Critérios de aceitação

* ao voltar, estado é restaurado;
* música continua de onde parou;
* fila é restaurada.

---

# FASE 10 — Qualidade

## T100 — Testes automatizados

Status: `[ ]`

### Objetivo

Implementar testes com Vitest.

### Critérios de aceitação

* Vitest configurado;
* testes para serviços (player, library, auth);
* `npm run test` funciona;
* cobertura mínima aceitável.

---

## T101 — Testes em Android

Status: `[ ]`

### Objetivo

Validar em dispositivo Android real.

### Critérios de aceitação

* teste em Android + Chrome;
* login funciona;
* seleção de pasta funciona;
* reprodução funciona;
* tela bloqueada funciona;
* Media Session funciona.

---

## T102 — Testes em iOS

Status: `[ ]`

### Objetivo

Validar em dispositivo iOS real.

### Critérios de aceitação

* teste em iOS + Safari;
* login funciona;
* reprodução funciona;
* limitações documentadas.

---

## T103 — Testes de PWA

Status: `[ ]`

### Objetivo

Validar características de PWA.

### Critérios de aceitação

* Lighthouse PWA score ≥ 90;
* instalável;
* funciona offline (recursos da app);
* manifest válido.

---

## T104 — Revisão de segurança

Status: `[ ]`

### Objetivo

Verificar segurança da aplicação.

### Critérios de aceitação

* nenhum secret no código;
* tokens tratados adequadamente;
* HTTPS em todas as requisições;
* escopos mínimos utilizados.

---

# Regra de execução

O agente deve executar somente tarefas cujo estado seja:

```text
[ ]
```

e cujas dependências estejam concluídas.

Depois de concluir uma tarefa:

```text
[ ] → [~] → implementação → testes → [x]
```

Se encontrar bloqueio real:

```text
[!] BLOQUEADA
```

e deverá registrar o motivo abaixo da tarefa.

---

# Regra importante

Não marcar uma tarefa como `[x]` apenas porque o código foi escrito.

Uma tarefa somente está concluída depois que seus critérios de aceitação forem verificados.
