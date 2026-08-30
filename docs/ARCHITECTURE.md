# DriveTune — Arquitetura

## 1. Objetivo

Este documento descreve a arquitetura conceitual do DriveTune.

A escolha definitiva das tecnologias será realizada antes da implementação do backend.

---

# 2. Visão geral

```text
                    ┌──────────────────┐
                    │    GOOGLE DRIVE  │
                    │                  │
                    │      MP3s        │
                    └────────┬─────────┘
                             │
                       Google Drive API
                             │
                             ▼
┌──────────────┐       ┌───────────────┐
│              │       │               │
│    PWA       │◄─────►│    Backend    │
│              │       │               │
│  Interface   │       │ Autenticação  │
│  Biblioteca  │       │ Drive API     │
│  Player      │       │ Metadados     │
│  Playlists   │       │               │
│              │       │               │
└──────┬───────┘       └───────────────┘
       │
       │ reprodução
       ▼
   ┌─────────┐
   │  ÁUDIO  │
   │ CELULAR │
   └─────────┘
```

---

# 3. Frontend

Responsável por:

* interface;
* navegação;
* biblioteca;
* busca;
* player;
* fila;
* playlists;
* interação com controles de mídia;
* estado da reprodução;
* PWA.

---

# 4. Backend

O backend poderá ser necessário para:

* autenticação;
* gerenciamento seguro da sessão;
* integração com Google;
* persistência de metadados;
* sincronização da biblioteca;
* gerenciamento de playlists.

A necessidade exata de cada função será determinada durante a definição da arquitetura técnica.

---

# 5. Google Drive

O Google Drive é o armazenamento primário dos arquivos musicais.

Cada música deverá possuir uma referência ao arquivo original.

Exemplo conceitual:

```text
drive_file_id
       │
       ▼
Google Drive
       │
       ▼
arquivo.mp3
```

---

# 6. Streaming

O objetivo é permitir a reprodução do arquivo sem criar uma cópia permanente no servidor.

Fluxo conceitual:

```text
Player
   │
   ▼
Aplicação
   │
   ▼
Google Drive
   │
   ▼
dados de áudio
   │
   ▼
HTMLAudioElement
   │
   ▼
alto-falante/fone
```

A implementação exata deverá considerar as limitações da API do Google Drive, autenticação e comportamento dos navegadores.

---

# 7. Banco de dados

O banco armazenará metadados da aplicação.

Não será utilizado como armazenamento dos arquivos MP3.

Exemplo:

```text
users
drive_folders
tracks
albums
artists
playlists
playlist_tracks
favorites
playback_state
```

A estrutura definitiva será definida antes da implementação.

---

# 8. Cache

O cache deverá ser utilizado para:

* recursos da aplicação;
* informações que possam ser reconstruídas;
* metadados quando apropriado.

Não assumir que arquivos MP3 devem ser armazenados no cache permanente da PWA.

---

# 9. Estado do player

O player deverá manter um estado semelhante a:

```text
currentTrack
queue
currentIndex
isPlaying
currentTime
duration
shuffle
repeatMode
volume
```

O estado deve ser independente da tela atualmente aberta.

---

# 10. Media Session

Quando disponível:

```text
MediaSession
     │
     ├── metadata
     ├── play
     ├── pause
     ├── seekbackward
     ├── seekforward
     ├── previoustrack
     └── nexttrack
```

A aplicação deverá atualizar os metadados da música atual.

---

# 11. Segurança

A arquitetura deverá observar:

* OAuth 2.0;
* princípio do menor privilégio;
* proteção de tokens;
* HTTPS;
* proteção de endpoints;
* validação de entradas;
* ausência de credenciais no código-fonte.

---

# 12. Escalabilidade

O sistema deverá ser suficientemente simples para um usuário individual inicialmente, mas a arquitetura não deverá impedir uma futura utilização por múltiplos usuários.

---

# 13. Decisões técnicas confirmadas

## 13.1 Stack

| Componente | Tecnologia |
|---|---|
| Frontend | React + Vite + TypeScript |
| Estilização | A definir (CSS Modules / Tailwind / styled-components) |
| Persistência local | Dexie.js (IndexedDB) |
| Auth | Google Identity Services (GIS) |
| API | Google Drive API v3 (REST) |
| Hospedagem | Vercel |
| Testes | Vitest |
| Backend MVP | Nenhum (tudo no cliente) |

## 13.2 Arquitetura sem backend

O MVP funcionará inteiramente no navegador:

```text
┌─────────────────────────────────────────┐
│              DriveTune PWA              │
│                                         │
│  React + Vite + TypeScript              │
│                                         │
│ ┌────────────┐     ┌─────────────────┐  │
│ │ Biblioteca │────►│ Player Service  │  │
│ └────────────┘     └────────┬────────┘  │
│                             │           │
│ ┌────────────┐              │           │
│ │ Playlists  │              ▼           │
│ │ (Dexie.js) │        HTMLAudioElement  │
│ └────────────┘              │           │
│                             │           │
│ ┌────────────┐              │           │
│ │   Search   │              │           │
│ └────────────┘              │           │
│                             ▼           │
│                      Google Drive API   │
└─────────────────────────────┬───────────┘
                              │
                              │ HTTPS + Bearer token
                              ▼
                       ┌─────────────┐
                       │ GOOGLE DRIVE│
                       │   MP3s      │
                       └─────────────┘
```

O backend poderá ser adicionado futuramente para:
* sincronização entre dispositivos;
* playlists persistentes na nuvem;
* indexação server-side;
* processamento de metadados.

## 13.3 Autenticação

Utilizar Google Identity Services (GIS) — modelo recomendado pelo Google para SPAs:

* `client_id` é público (não é secret);
* token de acesso é obtido no navegador;
* escopo mínimo: `https://www.googleapis.com/auth/drive.readonly`;
* refresh token gerenciado pelo GIS.

## 13.4 Streaming

Estratégia validada na POC:

```text
HTMLAudioElement
       │
       ▼
fetch() com Authorization header
       │
       ▼
Google Drive API: GET /drive/v3/files/{id}?alt=media
       │
       ▼
dados de áudio → reprodução
```

Suporte a Range requests confirmado pela documentação do Google.

## 13.5 Persistência

Dados armazenados localmente via Dexie.js (IndexedDB):

```text
tracks       → metadados das músicas
albums       → álbuns indexados
artists      → artistas indexados
playlists    → playlists do usuário
playlistItems→ músicas de cada playlist
favorites    → favoritos
playbackState→ estado de reprodução
```

## 13.6 Decisões futuras

Avaliar posteriormente:
* estilização (CSS Modules, Tailwind, etc.);
* necessário backend para sincronização;
* leitura de tags ID3 no cliente;
* strategy de cache offline.
