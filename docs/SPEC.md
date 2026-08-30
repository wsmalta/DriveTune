# DriveTune — Especificação Funcional

## 1. Visão geral

O DriveTune é um player de música baseado em PWA destinado à reprodução de arquivos MP3 armazenados no Google Drive do usuário.

O aplicativo deverá proporcionar uma experiência semelhante à de um player musical convencional, mas utilizando o Google Drive como armazenamento da coleção.

---

# 2. Usuário

O aplicativo possui inicialmente um único tipo de usuário:

**Usuário autenticado**

O usuário utiliza sua própria conta Google e acessa seus próprios arquivos.

---

# 3. Autenticação

## 3.1 Login

O usuário deverá poder entrar utilizando sua conta Google.

Fluxo:

```text
Abrir DriveTune
      ↓
Login Google
      ↓
Autorização
      ↓
Aplicação
```

## 3.2 Logout

O usuário deverá poder encerrar a sessão.

Após o logout, dados de sessão e tokens não deverão permanecer acessíveis à aplicação.

---

# 4. Acesso ao Google Drive

## 4.1 Seleção da biblioteca

Na primeira utilização, o usuário deverá selecionar a pasta do Google Drive que contém sua coleção musical.

Exemplo:

```text
Selecione sua pasta musical

📁 Música
📁 MP3
📁 Minha coleção
📁 Music
```

A aplicação deverá guardar a identificação da pasta escolhida para usos posteriores.

---

# 5. Biblioteca

A biblioteca deverá apresentar os arquivos musicais de forma organizada.

Estrutura lógica:

```text
Biblioteca
 ├── Artistas
 │    └── Artista
 │         └── Álbuns
 │              └── Faixas
 └── Faixas
```

---

# 6. Identificação das músicas

Na primeira versão, a aplicação deverá trabalhar com os dados disponíveis nos nomes dos arquivos e/ou metadados acessíveis.

A implementação definitiva da leitura de tags ID3 será definida durante a evolução do projeto.

O sistema não deverá depender exclusivamente de tags ID3 para conseguir localizar e reproduzir um MP3.

---

# 7. Artistas

A biblioteca deverá permitir visualizar os artistas disponíveis.

Exemplo:

```text
ARTISTAS

Depeche Mode
Erasure
New Order
Pink Floyd
Yes
```

Ao selecionar um artista, serão apresentadas suas músicas e/ou álbuns identificados.

---

# 8. Álbuns

Quando os dados permitirem identificar o álbum, as músicas deverão ser agrupadas.

Exemplo:

```text
Depeche Mode

Violator
Music for the Masses
Black Celebration
```

---

# 9. Faixas

Ao selecionar um álbum:

```text
Violator

01 World in My Eyes
02 Sweetest Perfection
03 Personal Jesus
04 Halo
05 Waiting for the Night
...
```

Cada faixa deverá possuir uma ação para iniciar sua reprodução.

---

# 10. Busca

O aplicativo deverá possuir mecanismo de busca.

O usuário poderá procurar pelo menos por:

* nome da música;
* artista;
* álbum.

A busca deverá funcionar sem exigir que o usuário percorra manualmente a biblioteca.

---

# 11. Player

O player deverá permanecer disponível enquanto o usuário navega pela aplicação.

Informações mínimas:

* música atual;
* artista;
* álbum, quando disponível;
* tempo decorrido;
* duração;
* progresso.

Controles:

* play;
* pause;
* próxima;
* anterior;
* seek;
* volume;
* aleatório;
* repetição.

---

# 12. Reprodução

Ao selecionar uma música, o sistema deverá obter o arquivo correspondente no Google Drive e reproduzi-lo através do elemento de áudio do navegador ou mecanismo equivalente.

A aplicação não deverá exigir download permanente do MP3 para seu próprio servidor.

---

# 13. Fila de reprodução

O usuário deverá poder reproduzir uma sequência de músicas.

Exemplo:

```text
TOCANDO AGORA

1. Enjoy the Silence
2. Policy of Truth
3. World in My Eyes
4. Personal Jesus
5. Halo
```

A fila deverá possuir:

* adicionar música;
* remover música;
* próxima música;
* música anterior;
* limpar fila.

Quando tecnicamente apropriado, deverá ser possível alterar a ordem da fila.

---

# 14. Reprodução aleatória

O usuário poderá ativar o modo aleatório.

Quando ativo, a próxima música será escolhida aleatoriamente dentro da fila ou conjunto de reprodução atual.

---

# 15. Repetição

O player deverá possuir modos de repetição.

No mínimo:

```text
Sem repetição
Repetir fila
Repetir música
```

---

# 16. Reprodução em segundo plano

O aplicativo deverá continuar a reprodução quando o usuário:

* bloquear a tela;
* mudar para outro aplicativo;
* minimizar o navegador;

desde que o sistema operacional e o navegador permitam.

A aplicação deverá utilizar a Media Session API quando disponível.

---

# 17. Controles de mídia

Quando suportado pelo dispositivo:

```text
Anterior
Play/Pause
Próxima
```

deverão aparecer nos controles de mídia do sistema.

O título e o artista da música atual também deverão ser informados ao sistema.

---

# 18. Playlists

Playlists fazem parte da funcionalidade planejada.

O usuário poderá criar playlists, por exemplo:

```text
❤️ Favoritas
🎵 Dance
🎸 Rock
🌙 Noite
```

Cada playlist poderá conter referências às músicas existentes no Google Drive.

As playlists não deverão duplicar os arquivos MP3.

---

# 19. Favoritos

O usuário poderá marcar músicas como favoritas.

O favorito é um atributo da aplicação e não modifica o arquivo original no Google Drive.

---

# 20. Histórico

Funcionalidade prevista para evolução.

O sistema poderá registrar músicas reproduzidas recentemente.

---

# 21. Retomar reprodução

Funcionalidade prevista para evolução.

O sistema poderá armazenar:

* última música;
* posição aproximada;
* fila de reprodução.

Isso permitirá continuar posteriormente de onde o usuário parou.

---

# 22. Interface

A interface deverá seguir o princípio Mobile First.

Estrutura conceitual:

```text
┌──────────────────────────┐
│ DriveTune                │
│ 🔎 Buscar                │
├──────────────────────────┤
│                          │
│ Biblioteca               │
│                          │
│ Artistas                 │
│ Álbuns                   │
│ Músicas                  │
│ Playlists                │
│                          │
├──────────────────────────┤
│ Música atual             │
│ Artista                  │
│ ━━━━━━━●━━━━━━           │
│                          │
│    ◀   ▶❚❚   ▶           │
└──────────────────────────┘
```

---

# 23. PWA

O aplicativo deverá possuir características de PWA:

* manifest;
* ícone;
* instalação na tela inicial quando suportada;
* comportamento adequado em modo standalone;
* cache dos recursos da aplicação quando apropriado.

O cache não deve resultar no armazenamento permanente indevido dos arquivos MP3.

---

# 24. Tratamento de erros

O aplicativo deverá informar claramente problemas como:

* usuário não autenticado;
* acesso negado ao Google Drive;
* pasta não encontrada;
* arquivo removido;
* arquivo sem permissão;
* erro de reprodução;
* conexão indisponível.

Mensagens técnicas internas não devem ser apresentadas diretamente ao usuário como única explicação.

---

# 25. Dados armazenados

A aplicação poderá armazenar:

```text
ID do usuário
ID da pasta musical
ID do arquivo no Drive
nome do arquivo
artista
álbum
faixa
número da faixa
gênero
duração
favorito
playlist
data da última atualização
```

A estrutura definitiva do banco será definida na especificação arquitetural.

---

# 26. Não objetivos do MVP

O MVP não deverá incluir:

* download offline da coleção;
* equalizador;
* crossfade;
* gapless playback;
* estatísticas avançadas;
* sincronização complexa entre dispositivos;
* compartilhamento público de músicas;
* reprodução de arquivos que não sejam suportados pelo projeto.

Esses recursos poderão ser avaliados posteriormente.

---

# 27. Critério geral de sucesso do MVP

O usuário deverá conseguir:

```text
Entrar com Google
      ↓
Escolher pasta do Drive
      ↓
Encontrar suas músicas
      ↓
Escolher uma música
      ↓
Reproduzir
      ↓
Bloquear o celular
      ↓
Continuar ouvindo
```

Esse fluxo representa o objetivo central do primeiro produto funcional.
