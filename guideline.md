I want you to create a complete project using HTML, CSS, and pure JavaScript with Canvas 2D and TensorFlow.js to simulate a Flappy Bird–style game in pixel art, where an AI learns to play visually.

Project goal:
- The game must be a simplified Flappy Bird.
- The visuals must follow a pixel art style.
- The AI must play the game automatically.
- The screen must clearly display the learning progress.
- A visual element must simulate pressing the SPACE key to show when the AI decides to jump.
- The project must be organized, easy to run locally, and easy to extend later.

General rules:
- Use only HTML, CSS, and JavaScript.
- Use Canvas for rendering the game.
- Use TensorFlow.js in the browser.
- Do not use frameworks such as React or Vue.
- Code must be separated into files.
- Comment important parts of the code.
- Keep the project readable and modular.
- The project must run by opening index.html using a simple local server.

Desired project structure:
- index.html
- style.css
- js/main.js
- js/game.js
- js/bird.js
- js/pipe.js
- js/ai.js
- js/training.js
- js/ui.js

Game requirements:
1. A bird in pixel art style
2. Upper and lower pipes in pixel art style
3. Simple pixel art background
4. Gravity
5. Jump action triggered by "pressing SPACE"
6. Collision with pipes and floor/ceiling
7. Score system
8. Automatic restart after death as part of training

About the AI:
- The AI must learn to play by observing the current game state.
- Use TensorFlow.js with a small neural network.
- The AI action must be binary:
    - jump
    - do not jump
- The AI must receive at least these inputs:
    - bird Y position
    - bird vertical velocity
    - horizontal distance to the next pipe
    - position of the top of the pipe gap
    - position of the bottom of the pipe gap
- The output must indicate whether to jump or not.

Training behavior:
- Use a simple and practical training approach suitable for running in the browser.
- Prefer something easy to understand and visually demonstrable.
- It can be:
    - a genetic algorithm with neural networks
    - or another simple strategy that works well in the browser.
- The important part is that learning progression is visible.
- When an agent dies, it must contribute to the next generation.
- There must be a concept of generations.

Display on screen:
Show the following information:

- Current generation
- Current agent
- Current score
- Best score
- Average score of the generation
- Number of deaths
- Simulation speed

Learning visualization:
Create a panel (side or top of the screen) showing:

- Current generation
- Best historical score
- Current score
- Average score of the generation
- Number of agents tested
- Current AI state
- Raw neural network output value
- Current AI decision: jump or not

SPACE key simulation:
Add a visual UI element representing the SPACE key.

Requirements:
- The element must visually resemble a keyboard key.
- When the AI decides to jump, the key must visually change for a short moment, simulating a key press.

Example behavior:
Normal state:
- light colored key

Pressed state:
- darker or pressed-looking key

Also display text such as:
- "AI pressed SPACE"
- or "Waiting for decision"

This feature is important because I want to visually demonstrate the AI interaction.

Pixel art style:
The game must resemble a retro pixel game.

Guidelines:
- Use pixel-like shapes in canvas or simple generated sprites
- Avoid smooth modern visuals
- Use blocky shapes and retro aesthetics
- Background, bird, and pipes must follow the same style

Control panel:
Add buttons for:

- Start training
- Pause training
- Reset training
- Speed up training
- Normal speed

Also add a control to:
- show only 1 agent playing visually
- or train multiple agents with simplified rendering

Expected architecture:

game.js
Main loop, physics, collision detection, score.

bird.js
Bird behavior.

pipe.js
Pipe creation and movement.

ai.js
Neural network model, inference, and decision logic.

training.js
Evolution logic, selection, mutation, new generations.

ui.js
Interface, statistics panel, SPACE key visual.

main.js
Project initialization.

Implementation requirements:
You must generate:

1. All files
2. Full HTML
3. Full CSS
4. Full JavaScript
5. Organized and executable code
6. Comments explaining important sections
7. A short instruction at the end explaining how to run the project locally

Important:
- Do not provide only explanations.
- Generate the complete code for all files.
- Ensure the project is functional in the first version.
- If necessary, simplify the AI logic to guarantee functionality.
- Prioritize clear visualization of learning.
- The main goal is to see the AI playing, learning, and simulating the SPACE key press.