# game-flapbird

Flappy Bird em pixel art com IA treinando no navegador usando Canvas 2D + TensorFlow.js.

## Estrutura

- `index.html`
- `style.css`
- `server.js`
- `package.json`
- `js/main.js`
- `js/game.js`
- `js/bird.js`
- `js/pipe.js`
- `js/ai.js`
- `js/training.js`
- `js/ui.js`

## Como rodar com pnpm + Node server

1. Abra um terminal na pasta do projeto.
2. Execute:
   - `pnpm install`
   - `pnpm start`
3. Abra no navegador:
   - `http://localhost:3000`
4. Clique em **Start training** para iniciar.

## Controles

- `Start training`: inicia o treino
- `Pause training`: pausa
- `Reset training`: reinicia do zero
- `Speed up training`: aumenta velocidade da simulação
- `Normal speed`: volta para 1x
- `Render mode`: alterna entre 1 agente visível ou treino de múltiplos agentes com render simplificado
