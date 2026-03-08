import { BirdBrain } from "./ai.js";
import { Game } from "./game.js";

class Agent {
  constructor(id, brain = new BirdBrain()) {
    this.id = id;
    this.brain = brain;
    this.resetRunStats();
  }

  resetRunStats() {
    this.alive = true;
    this.score = 0;
    this.frames = 0;
    this.fitness = 0;
    this.lastOutput = 0;
    this.lastDecision = false;
  }
}

export class TrainingManager {
  constructor({ canvas, context }) {
    this.canvas = canvas;
    this.ctx = context;

    this.populationSize = 30;
    this.eliteCount = 4;
    this.mutationRate = 0.12;
    this.mutationAmount = 0.32;

    this.mode = "single";
    this.speed = 1;
    this.maxSpeed = 12;
    this.running = false;

    this.generation = 1;
    this.totalDeaths = 0;
    this.historicalBestScore = 0;
    this.generationBestScore = 0;
    this.generationAverageScore = 0;
    this.finishedScores = [];
    this.agentsTestedCurrentGen = 0;

    this.ui = null;
    this.singleGame = this.createGame();
    this.batchGames = [];
    this.focusAgentIndex = 0;
    this.currentAgentIndex = 0;

    this.agents = this.createPopulation();
    this.restartGenerationState();
  }

  setUI(ui) {
    this.ui = ui;
    this.ui.setModeHint(this.getModeText());
  }

  createGame() {
    return new Game({ width: this.canvas.width, height: this.canvas.height });
  }

  createPopulation() {
    const population = [];
    for (let i = 0; i < this.populationSize; i += 1) {
      population.push(new Agent(i + 1));
    }
    return population;
  }

  start() {
    this.running = true;
  }

  pause() {
    this.running = false;
  }

  speedUp() {
    this.speed = Math.min(this.maxSpeed, this.speed + 1);
  }

  normalSpeed() {
    this.speed = 1;
  }

  setMode(mode) {
    if (mode !== "single" && mode !== "batch") {
      return;
    }

    if (this.mode === mode) {
      return;
    }

    this.mode = mode;
    this.restartGenerationState();

    if (this.ui) {
      this.ui.setModeHint(this.getModeText());
    }
  }

  resetTraining() {
    this.running = false;
    this.generation = 1;
    this.totalDeaths = 0;
    this.historicalBestScore = 0;
    this.generationBestScore = 0;
    this.generationAverageScore = 0;
    this.finishedScores = [];
    this.agentsTestedCurrentGen = 0;

    this.disposeAgents(this.agents);
    this.agents = this.createPopulation();
    this.restartGenerationState();
  }

  update() {
    if (!this.running) {
      return;
    }

    const stepsPerFrame = this.mode === "batch" ? this.speed * 3 : this.speed;

    for (let i = 0; i < stepsPerFrame; i += 1) {
      if (this.mode === "single") {
        this.stepSingleMode();
      } else {
        this.stepBatchMode();
      }
    }
  }

  draw() {
    const observedGame = this.getObservedGame();
    if (!observedGame) {
      return;
    }

    observedGame.draw(this.ctx, {
      simplified: this.mode === "batch",
      overlayText: this.mode === "batch" ? "FAST BATCH MODE" : "",
    });
  }

  getStats() {
    const observedAgent = this.getObservedAgent();
    const observedGame = this.getObservedGame();

    return {
      generation: this.generation,
      currentAgent: this.getCurrentAgentDisplayIndex(),
      currentScore: observedGame ? observedGame.score : 0,
      bestScore: this.historicalBestScore,
      generationBest: this.generationBestScore,
      avgScore: this.generationAverageScore,
      agentsTested: this.agentsTestedCurrentGen,
      deaths: this.totalDeaths,
      speed: this.speed,
      aiState: this.running
        ? this.mode === "single"
          ? "Training (single)"
          : "Training (batch)"
        : "Paused",
      aiOutput: observedAgent ? observedAgent.lastOutput : 0,
      aiDecision: observedAgent
        ? observedAgent.lastDecision
          ? "jump"
          : "wait"
        : "waiting",
    };
  }

  getModeText() {
    return this.mode === "single"
      ? "Mode: Single agent visual training"
      : "Mode: Multiple agents with simplified rendering";
  }

  restartGenerationState() {
    this.finishedScores = [];
    this.agentsTestedCurrentGen = 0;
    this.currentAgentIndex = 0;
    this.focusAgentIndex = 0;
    this.generationBestScore = 0;
    this.generationAverageScore = 0;

    for (const agent of this.agents) {
      agent.resetRunStats();
    }

    this.singleGame.reset();

    if (this.mode === "batch") {
      this.batchGames = this.agents.map(() => this.createGame());
    } else {
      this.batchGames = [];
    }
  }

  stepSingleMode() {
    const agent = this.agents[this.currentAgentIndex];
    if (!agent) {
      this.finishGeneration();
      return;
    }

    const state = this.singleGame.getStateInputs();
    const output = agent.brain.predict(state.inputs);
    const decision = output >= 0.5;

    agent.lastOutput = output;
    agent.lastDecision = decision;

    if (this.ui) {
      this.ui.setSpacePressed(decision);
    }

    const result = this.singleGame.step(decision);
    agent.score = this.singleGame.score;
    agent.frames = this.singleGame.ticks;
    this.focusAgentIndex = this.currentAgentIndex;

    if (result.dead) {
      this.finishAgent(agent);
      this.currentAgentIndex += 1;

      if (this.currentAgentIndex >= this.agents.length) {
        this.finishGeneration();
      } else {
        this.singleGame.reset();
      }
    }
  }

  stepBatchMode() {
    for (let i = 0; i < this.agents.length; i += 1) {
      const agent = this.agents[i];
      if (!agent.alive) {
        continue;
      }

      const game = this.batchGames[i];
      const state = game.getStateInputs();
      const output = agent.brain.predict(state.inputs);
      const decision = output >= 0.5;

      agent.lastOutput = output;
      agent.lastDecision = decision;

      if (i === this.focusAgentIndex && this.ui) {
        this.ui.setSpacePressed(decision);
      }

      const result = game.step(decision);
      agent.score = game.score;
      agent.frames = game.ticks;

      if (result.dead) {
        this.finishAgent(agent);
      }
    }

    const firstAlive = this.findFirstAliveAgentIndex();
    if (firstAlive === -1) {
      this.finishGeneration();
      return;
    }

    this.focusAgentIndex = firstAlive;
  }

  finishAgent(agent) {
    if (!agent.alive) {
      return;
    }

    agent.alive = false;
    agent.fitness = this.calculateFitness(agent.score, agent.frames);

    this.totalDeaths += 1;
    this.agentsTestedCurrentGen += 1;
    this.finishedScores.push(agent.score);

    this.generationBestScore = Math.max(this.generationBestScore, agent.score);
    this.historicalBestScore = Math.max(this.historicalBestScore, agent.score);

    const total = this.finishedScores.reduce((sum, value) => sum + value, 0);
    this.generationAverageScore = total / this.finishedScores.length;
  }

  finishGeneration() {
    const ranked = [...this.agents].sort((a, b) => b.fitness - a.fitness);
    const eliteCount = Math.max(1, Math.min(this.eliteCount, ranked.length));
    const nextPopulation = [];

    for (let i = 0; i < eliteCount; i += 1) {
      const eliteClone = ranked[i].brain.clone();
      nextPopulation.push(new Agent(i + 1, eliteClone));
    }

    while (nextPopulation.length < this.populationSize) {
      const parentA = this.pickParent(ranked);
      const parentB = this.pickParent(ranked);
      const childBrain = parentA.brain.crossover(parentB.brain);
      childBrain.mutate(this.mutationRate, this.mutationAmount);
      nextPopulation.push(new Agent(nextPopulation.length + 1, childBrain));
    }

    this.disposeAgents(this.agents);
    this.agents = nextPopulation;
    this.generation += 1;

    this.restartGenerationState();
  }

  pickParent(rankedAgents) {
    const poolSize = Math.max(2, Math.floor(rankedAgents.length * 0.5));
    const first = rankedAgents[Math.floor(Math.random() * poolSize)];
    const second = rankedAgents[Math.floor(Math.random() * poolSize)];
    return first.fitness >= second.fitness ? first : second;
  }

  calculateFitness(score, frames) {
    // Reward surviving and passing pipes so both stability and progress matter.
    return score * 160 + frames;
  }

  getObservedGame() {
    if (this.mode === "single") {
      return this.singleGame;
    }

    const idx = this.findFirstAliveAgentIndex();
    if (idx === -1) {
      return this.batchGames[0] ?? this.singleGame;
    }

    return this.batchGames[idx];
  }

  getObservedAgent() {
    if (this.mode === "single") {
      return this.agents[this.currentAgentIndex] ?? this.agents[this.agents.length - 1] ?? null;
    }

    const idx = this.findFirstAliveAgentIndex();
    if (idx === -1) {
      return this.agents[0] ?? null;
    }

    return this.agents[idx];
  }

  getCurrentAgentDisplayIndex() {
    if (this.mode === "single") {
      return Math.min(this.currentAgentIndex + 1, this.populationSize);
    }

    const idx = this.findFirstAliveAgentIndex();
    return idx === -1 ? this.populationSize : idx + 1;
  }

  findFirstAliveAgentIndex() {
    for (let i = 0; i < this.agents.length; i += 1) {
      if (this.agents[i].alive) {
        return i;
      }
    }

    return -1;
  }

  disposeAgents(agentList) {
    for (const agent of agentList) {
      agent.brain.dispose();
    }
  }
}
