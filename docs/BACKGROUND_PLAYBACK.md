# Reprodução em Segundo Plano — DriveTune

## Visão Geral

Este documento documenta o comportamento da reprodução de áudio em segundo plano no DriveTune.

## Implementação

### Media Session API

O DriveTune utiliza a Media Session API para integrar com os controles de mídia do sistema:

- **Play/Pause**: Controle básico de reprodução
- **Próxima/Anterior**: Navegação na fila de reprodução
- **Seek**: Busca por posição na faixa (seekto, seekbackward, seekforward)
- **Metadados**: Título, artista, álbum e capa do álbum

### Configuração do Service Worker

O service worker (`public/sw.js`) utiliza estratégia **network-first** para requisições de áudio:

```javascript
// Enquadrar o cache de áudio
if (request.url.includes('googleapis.com/drive/v3/files')) {
  return; // Não cachear streaming do Drive
}
```

## Comportamento por Plataforma

### Android + Chrome

| Cenário | Comportamento |
|---------|---------------|
| Tela bloqueada | ✅ Áudio continua tocando |
| App minimizado | ✅ Áudio continua tocando |
| Outro app em primeiro plano | ✅ Áudio continua tocando |
| Controles de mídia | ✅ Aparecem na tela de bloqueio |
| Bateria otimizada | ⚠️ Pode interromper após longo período |

**Recomendações Android:**
- Permitir que o DriveTune rode em segundo plano nas configurações de bateria
- O Media Session API mantém os controles ativos na tela de bloqueio

### iOS + Safari

| Cenário | Comportamento |
|---------|---------------|
| Tela bloqueada | ✅ Áudio continua tocando |
| App minimizado | ⚠️ Pode parar após ~30 segundos |
| Outro app em primeiro plano | ⚠️ Pode parar |
| Controles de mídia | ✅ Aparecem no Control Center |

**Limitações iOS:**
- Safari pode interromper áudio em segundo plano após período prolongado
- É necessário interação do usuário para manter o áudio ativo
- O MusicKit API pode ser uma alternativa no futuro

### Desktop

| Cenário | Comportamento |
|---------|---------------|
| Janela minimizada | ✅ Áudio continua tocando |
| Outra janela em foco | ✅ Áudio continua tocando |
| Tela de bloqueio (Windows) | ✅ Áudio continua tocando |

## Testes Realizados

### T051.1 — Android/Chrome

**Data:** *(preencher após teste manual)*

- [ ] Login funciona
- [ ] Seleção de pasta funciona
- [ ] Reprodução funciona
- [ ] Tela bloqueada funciona
- [ ] Media Session funciona
- [ ] Controles na tela de bloqueio funcionam

### T051.2 — iOS/Safari

**Data:** *(preencher após teste manual)*

- [ ] Login funciona
- [ ] Reprodução funciona
- [ ] Limitações documentadas

## Limitações Conhecidas

1. **iOS Safari**: Pode interromper áudio após ~30s em segundo plano
2. **Bateria otimizada Android**: Pode interromper após longo período
3. **Streaming do Google Drive**: Usa blob URLs, não cache de longo prazo

## Melhorias Futuras

- Adicionar suporte a MediaSession `setPositionState` para barra de progresso
- Implementar `MediaSession.setActionHandler('stop')` para limpeza
- Considerar Background Sync API para metadados
