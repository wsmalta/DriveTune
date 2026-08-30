# DriveTune — Roadmap

## Visão

O desenvolvimento será realizado em etapas, mantendo cada versão funcional.

---

# V0 — POC (Prova de Conceito)

Objetivo: validar o fluxo técnico crítico antes do MVP.

### Itens

* setup mínimo React + Vite;
* Google Identity Services (login/logout);
* listagem de pastas e MP3s no Drive;
* streaming de MP3 via `<audio>` + Drive API;
* seek funcional;
* reprodução com tela bloqueada;
* Media Session API;
* próxima música automática.

### Critério de sucesso

Se a POC funcionar no Android/Chrome, o MVP é viável sem backend.

---

# V0.5 — Fundação

Objetivo: preparar o projeto para o MVP.

### Itens

* estrutura do projeto;
* configuração inicial;
* Git;
* PWA básica;
* Dexie.js (IndexedDB);
* documentação;
* ambiente de desenvolvimento;
* stack definitiva registrada.

---

# V1 — MVP

Objetivo: reproduzir músicas do Google Drive no celular.

### Itens

* login/logout Google;
* seleção da pasta musical;
* biblioteca com artistas/álbuns/faixas;
* busca;
* player completo (play/pause/próxima/anterior/seek/volume);
* fila de reprodução;
* aleatório e repetição;
* Media Session API;
* reprodução em 2º plano;
* playlists básicas (IndexedDB);
* favoritos (IndexedDB).

---

# V1.1 — Biblioteca

* melhoria da indexação;
* leitura de tags ID3;
* capas dos álbuns;
* classificação por gênero;
* atualização incremental da biblioteca.

---

# V1.2 — Organização

* histórico de reprodução;
* músicas recentemente reproduzidas.

---

# V1.3 — Estado da reprodução

* continuar de onde parou;
* salvar posição da música;
* salvar fila;
* restaurar sessão de reprodução.

---

# V2 — Experiência avançada

Possíveis recursos:

* reprodução aleatória inteligente;
* filtros avançados;
* estatísticas;
* interface aprimorada;
* sincronização entre dispositivos.

---

# V3 — Áudio avançado

Possíveis recursos:

* equalizador;
* crossfade;
* gapless playback;
* processamento adicional de áudio.

---

# V4 — Offline

Possível suporte a:

* download controlado;
* armazenamento local;
* playlists offline;
* reprodução sem conexão.

Essa etapa somente deverá ser implementada depois de avaliar cuidadosamente as limitações técnicas e de segurança.

---

# Regra do roadmap

Itens do roadmap não são automaticamente tarefas de implementação.

Uma funcionalidade somente poderá ser implementada quando:

1. estiver suficientemente especificada;
2. tiver sido priorizada;
3. possuir uma tarefa no `TASK.md`.
