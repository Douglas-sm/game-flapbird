import { BirdBrain } from "./ai.js";
import { Game } from "./game.js";

const INPUT_SIZE = 5;

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
    this.experiences = [];
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

    this.tfFineTuneEpochs = 4;
    this.tfFineTuneBatchSize = 64;
    this.tfFineTuneElite = 6;
    this.tfFineTuneMaxSamples = 5000;
    this.maxExperiencesPerAgent = 2200;
    this.maxHistoryPoints = 120;

    this.tfLastLoss = null;
    this.tfLastAccuracy = null;
    this.tfLastSamples = 0;
    this.tfHistory = [];

    this.isEvolving = false;
    this.evolutionRunId = 0;

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
    this.evolutionRunId += 1;
    this.isEvolving = false;
    this.restartGenerationState();

    if (this.ui) {
      this.ui.setModeHint(this.getModeText());
    }
  }

  resetTraining() {
    this.running = false;
    this.evolutionRunId += 1;
    this.isEvolving = false;

    this.generation = 1;
    this.totalDeaths = 0;
    this.historicalBestScore = 0;
    this.generationBestScore = 0;
    this.generationAverageScore = 0;
    this.finishedScores = [];
    this.agentsTestedCurrentGen = 0;

    this.tfLastLoss = null;
    this.tfLastAccuracy = null;
    this.tfLastSamples = 0;
    this.tfHistory = [];

    this.disposeAgents(this.agents);
    this.agents = this.createPopulation();
    this.restartGenerationState();
  }

  update() {
    if (!this.running || this.isEvolving) {
      return;
    }

    const stepsPerFrame = this.mode === "batch" ? this.speed * 3 : this.speed;

    for (let i = 0; i < stepsPerFrame; i += 1) {
      if (this.isEvolving) {
        break;
      }

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
      aiState: this.getAIStateText(),
      aiOutput: observedAgent ? observedAgent.lastOutput : 0,
      aiDecision: observedAgent
        ? observedAgent.lastDecision
          ? "jump"
          : "wait"
        : "waiting",
      tfLoss: this.tfLastLoss,
      tfAccuracy: this.tfLastAccuracy,
      tfSamples: this.tfLastSamples,
      tfHistory: this.tfHistory,
    };
  }

  getAIStateText() {
    if (this.isEvolving) {
      return "Evolving (TensorFlow)";
    }

    if (!this.running) {
      return "Paused";
    }

    return this.mode === "single" ? "Training (single)" : "Training (batch)";
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
      this.queueFinishGeneration();
      return;
    }

    const state = this.singleGame.getStateInputs();
    const output = agent.brain.predict(state.inputs);
    const decision = output >= 0.5;

    agent.lastOutput = output;
    agent.lastDecision = decision;
    this.recordExperience(agent, state.inputs, decision);

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
        this.queueFinishGeneration();
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
      this.recordExperience(agent, state.inputs, decision);

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
      this.queueFinishGeneration();
      return;
    }

    this.focusAgentIndex = firstAlive;
  }

  recordExperience(agent, inputs, decision) {
    agent.experiences.push({
      inputs: [...inputs],
      action: decision ? 1 : 0,
    });

    if (agent.experiences.length > this.maxExperiencesPerAgent) {
      agent.experiences.shift();
    }
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

  queueFinishGeneration() {
    if (this.isEvolving) {
      return;
    }

    this.isEvolving = true;
    const runId = ++this.evolutionRunId;

    this.finishGeneration(runId)
      .catch((error) => {
        console.error("Error while evolving generation with TensorFlow:", error);
      })
      .finally(() => {
        if (runId === this.evolutionRunId) {
          this.isEvolving = false;
        }
      });
  }

  async finishGeneration(runId) {
    const ranked = [...this.agents].sort((a, b) => b.fitness - a.fitness);
    if (!ranked.length) {
      return;
    }

    const finishedGeneration = this.generation;
    const finishedBest = this.generationBestScore;
    const finishedAvg = this.generationAverageScore;

    const mentorBrain = ranked[0].brain.clone();
    let tfMetrics = { loss: null, accuracy: null, samples: 0 };

    try {
      tfMetrics = await this.applyTensorFlowFineTune(mentorBrain, ranked);
    } catch (error) {
      console.error("TensorFlow fine-tune skipped:", error);
    }

    if (runId !== this.evolutionRunId) {
      mentorBrain.dispose();
      return;
    }

    this.recordTensorFlowEvolution({
      generation: finishedGeneration,
      bestScore: finishedBest,
      avgScore: finishedAvg,
      loss: tfMetrics.loss,
      accuracy: tfMetrics.accuracy,
      samples: tfMetrics.samples,
    });

    const eliteCount = Math.max(1, Math.min(this.eliteCount, ranked.length));
    const nextPopulation = [new Agent(1, mentorBrain)];

    for (let i = 1; i < eliteCount; i += 1) {
      const eliteClone = ranked[i].brain.clone();
      nextPopulation.push(new Agent(nextPopulation.length + 1, eliteClone));
    }

    const selectionPool = [
      {
        fitness: ranked[0].fitness + 1,
        brain: mentorBrain,
      },
      ...ranked,
    ];

    while (nextPopulation.length < this.populationSize) {
      const parentA = this.pickParent(selectionPool);
      const parentB = this.pickParent(selectionPool);
      const childBrain = parentA.brain.crossover(parentB.brain);
      childBrain.mutate(this.mutationRate, this.mutationAmount);
      nextPopulation.push(new Agent(nextPopulation.length + 1, childBrain));
    }

    this.disposeAgents(this.agents);
    this.agents = nextPopulation;
    this.generation += 1;

    this.restartGenerationState();
  }

  async applyTensorFlowFineTune(mentorBrain, rankedAgents) {
    if (!window.tf) {
      return { loss: null, accuracy: null, samples: 0 };
    }

    const dataset = this.buildFineTuneDataset(rankedAgents);
    if (!dataset) {
      return { loss: null, accuracy: null, samples: 0 };
    }

    try {
      const training = await mentorBrain.trainWithExamples(dataset.inputs, dataset.labels, {
        epochs: this.tfFineTuneEpochs,
        batchSize: this.tfFineTuneBatchSize,
        learningRate: 0.003,
      });

      return {
        loss: training.loss,
        accuracy: training.accuracy,
        samples: dataset.samples,
      };
    } finally {
      dataset.inputs.dispose();
      dataset.labels.dispose();
    }
  }

  buildFineTuneDataset(rankedAgents) {
    const eliteSlice = rankedAgents.slice(0, Math.min(this.tfFineTuneElite, rankedAgents.length));
    if (!eliteSlice.length) {
      return null;
    }

    const samples = [];
    const labels = [];

    const maxReferenceScore = Math.max(1, eliteSlice[0].score);
    const perAgentLimit = Math.max(40, Math.floor(this.tfFineTuneMaxSamples / eliteSlice.length));

    for (const agent of eliteSlice) {
      if (!agent.experiences.length) {
        continue;
      }

      const confidence = clamp01(agent.score / maxReferenceScore);
      const trustAgent = 0.2 + confidence * 0.8;
      const stride = Math.max(1, Math.floor(agent.experiences.length / perAgentLimit));

      for (let i = 0; i < agent.experiences.length; i += stride) {
        const exp = agent.experiences[i];
        const coachDecision = this.estimateCoachDecision(exp.inputs);
        const target = trustAgent * exp.action + (1 - trustAgent) * coachDecision;

        samples.push(exp.inputs);
        labels.push([target]);

        if (samples.length >= this.tfFineTuneMaxSamples) {
          break;
        }
      }

      if (samples.length >= this.tfFineTuneMaxSamples) {
        break;
      }
    }

    if (samples.length < 24) {
      return null;
    }

    return {
      samples: samples.length,
      inputs: tf.tensor2d(samples, [samples.length, INPUT_SIZE], "float32"),
      labels: tf.tensor2d(labels, [labels.length, 1], "float32"),
    };
  }

  estimateCoachDecision(inputs) {
    const birdY = inputs[0];
    const velocity = inputs[1];
    const distanceX = inputs[2];
    const gapTop = inputs[3];
    const gapBottom = inputs[4];

    const gapCenter = (gapTop + gapBottom) / 2;
    const desiredHeight = gapCenter - 0.08;
    const nearPipe = 1 - Math.min(1, distanceX * 1.6);

    const urgency = (birdY - desiredHeight) * 2.2 + (velocity - 0.5) * 1.3 + nearPipe * 0.25;
    return urgency > 0.18 ? 1 : 0;
  }

  recordTensorFlowEvolution(entry) {
    this.tfLastLoss = Number.isFinite(entry.loss) ? entry.loss : null;
    this.tfLastAccuracy = Number.isFinite(entry.accuracy) ? entry.accuracy : null;
    this.tfLastSamples = entry.samples ?? 0;

    this.tfHistory.push({
      generation: entry.generation,
      bestScore: entry.bestScore,
      avgScore: entry.avgScore,
      loss: this.tfLastLoss,
      accuracy: this.tfLastAccuracy,
      samples: this.tfLastSamples,
    });

    if (this.tfHistory.length > this.maxHistoryPoints) {
      this.tfHistory.shift();
    }
  }

  pickParent(rankedAgents) {
    if (rankedAgents.length === 1) {
      return rankedAgents[0];
    }

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

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}
