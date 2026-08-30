# AGENTS.md — DriveTune

## 1. Objetivo

Este arquivo define as regras permanentes que devem ser seguidas por qualquer agente de IA trabalhando no projeto DriveTune.

O agente deve tratar este arquivo como conjunto de regras do projeto.

---

## 2. Regra principal

Não implementar funcionalidades que não estejam previstas na especificação ou em uma tarefa autorizada.

Quando houver conflito entre arquivos:

1. instruções explícitas do usuário;
2. `AGENTS.md`;
3. `docs/SPEC.md`;
4. `docs/ARCHITECTURE.md`;
5. `TASK.md`;
6. demais documentação.

Nunca inventar requisitos importantes.

---

## 3. Princípios do projeto

### 3.1 Mobile First

O aplicativo será utilizado principalmente em smartphones.

A interface deve ser projetada primeiro para telas pequenas.

A experiência em desktop deve ser tratada como complementar.

### 3.2 PWA

O aplicativo deve ser desenvolvido como Progressive Web App.

Quando tecnicamente possível, deverá permitir instalação na tela inicial do smartphone.

### 3.3 Google Drive

O Google Drive é a fonte dos arquivos de áudio.

O DriveTune não deve manter cópias permanentes dos arquivos MP3 no servidor da aplicação.

### 3.4 Privacidade

O aplicativo deve solicitar somente as permissões Google necessárias.

Não acessar arquivos que não sejam necessários para o funcionamento do aplicativo.

Não transmitir o conteúdo dos arquivos MP3 para serviços externos sem autorização explícita.

### 3.5 Metadados

O aplicativo poderá armazenar metadados necessários para melhorar o desempenho da biblioteca.

Exemplos:

* ID do arquivo no Drive
* nome do arquivo
* artista
* álbum
* faixa
* número da faixa
* duração
* gênero
* data de atualização
* informações necessárias para playlists

### 3.6 Separação de responsabilidades

A interface, autenticação, acesso ao Google Drive, persistência e reprodução devem possuir responsabilidades claramente separadas.

Evitar código fortemente acoplado.

---

## 4. Desenvolvimento incremental

Não tentar construir o sistema inteiro de uma vez.

Cada tarefa deve:

1. ser pequena;
2. possuir objetivo claro;
3. possuir critério de aceitação;
4. ser implementada;
5. ser testada;
6. ser marcada como concluída somente depois dos testes.

---

## 5. Antes de modificar código

O agente deve:

1. verificar o estado atual do Git;
2. ler a documentação relevante;
3. identificar a tarefa atual;
4. verificar se dependências existentes são suficientes;
5. evitar alterações não relacionadas à tarefa.

---

## 6. Testes

Toda funcionalidade implementada deve possuir testes apropriados ao seu nível.

O agente deve executar os testes relevantes antes de considerar uma tarefa concluída.

Erros encontrados durante os testes devem ser corrigidos antes de avançar.

Não mascarar erros simplesmente desabilitando testes.

---

## 7. Código

Priorizar:

* simplicidade;
* legibilidade;
* modularidade;
* baixo acoplamento;
* tratamento explícito de erros;
* segurança;
* manutenção futura.

Evitar:

* código duplicado;
* abstrações prematuras;
* dependências desnecessárias;
* soluções excessivamente complexas;
* alterações fora do escopo.

---

## 8. Segurança

Nunca colocar:

* client secrets;
* tokens;
* credenciais;
* chaves privadas;
* senhas;

diretamente no código ou no Git.

Utilizar variáveis de ambiente ou mecanismos apropriados de configuração.

Arquivos `.env` contendo segredos nunca devem ser versionados.

---

## 9. Google OAuth

A implementação deve respeitar as boas práticas de OAuth 2.0 e as exigências atuais da API do Google.

Os tokens devem ser tratados como dados sensíveis.

O agente não deve solicitar permissões mais amplas do que as necessárias.

---

## 10. Reprodução

A reprodução deve utilizar os recursos nativos do navegador sempre que possível.

O player deve ser compatível com:

* play;
* pause;
* próxima;
* anterior;
* seek;
* volume;
* reprodução aleatória;
* repetição.

A integração com `Media Session API` deve ser utilizada quando suportada.

---

## 11. Compatibilidade

A prioridade de compatibilidade é:

1. Android + Chrome;
2. Android + navegadores compatíveis;
3. iPhone/iOS + Safari;
4. desktop.

Quando uma funcionalidade não for suportada por determinado navegador, o sistema deve degradar de forma elegante.

---

## 12. Git

Commits devem ser pequenos e descritivos.

Não realizar commits gigantes contendo alterações não relacionadas.

Não apagar ou sobrescrever trabalho existente sem autorização.

---

## 13. Atualização da documentação

Se uma alteração modificar significativamente a arquitetura ou o comportamento do sistema, a documentação correspondente deve ser atualizada.

O `TASK.md` deve sempre refletir o estado real do projeto.

---

## 14. Regra contra decisões irreversíveis

Quando houver uma decisão arquitetural importante não definida pela especificação, o agente não deve simplesmente escolher uma solução de grande impacto.

Deve registrar a questão e solicitar decisão quando necessário.

---

## 15. Definition of Done

Uma tarefa somente pode ser considerada concluída quando:

* implementação realizada;
* código compilando/executando;
* testes relevantes executados;
* erros corrigidos;
* documentação atualizada quando necessário;
* `TASK.md` atualizado;
* Git em estado coerente.

---

## 16. Regra para o agente em loop

Quando estiver sendo executado pelo prompt de desenvolvimento automático:

```text
LER
↓
PLANEJAR
↓
IMPLEMENTAR
↓
TESTAR
↓
CORRIGIR
↓
DOCUMENTAR
↓
ATUALIZAR TASK
↓
VERIFICAR
↓
PRÓXIMA TAREFA
```

O agente nunca deve pular diretamente para tarefas posteriores apenas porque parecem mais interessantes.

A prioridade é sempre a próxima tarefa elegível do `TASK.md`.
