export class UIController {
  constructor(training) {
    this.training = training;
    this.spacePressedUntil = 0;

    this.refs = {
      generation: document.getElementById("statGeneration"),
      currentAgent: document.getElementById("statCurrentAgent"),
      currentScore: document.getElementById("statCurrentScore"),
      bestScore: document.getElementById("statBestScore"),
      generationBest: document.getElementById("statGenerationBest"),
      avgScore: document.getElementById("statAvgScore"),
      agentsTested: document.getElementById("statAgentsTested"),
      deaths: document.getElementById("statDeaths"),
      speed: document.getElementById("statSpeed"),
      aiState: document.getElementById("statAIState"),
      output: document.getElementById("statOutput"),
      decision: document.getElementById("statDecision"),
      spaceKey: document.getElementById("spaceKey"),
      spaceStatus: document.getElementById("spaceStatus"),
      modeHint: document.getElementById("modeHint"),
      startBtn: document.getElementById("startBtn"),
      pauseBtn: document.getElementById("pauseBtn"),
      resetBtn: document.getElementById("resetBtn"),
      speedUpBtn: document.getElementById("speedUpBtn"),
      normalSpeedBtn: document.getElementById("normalSpeedBtn"),
      modeRadios: document.querySelectorAll("input[name='renderMode']"),
    };

    this.bindControls();
  }

  bindControls() {
    this.refs.startBtn?.addEventListener("click", () => this.training.start());
    this.refs.pauseBtn?.addEventListener("click", () => this.training.pause());
    this.refs.resetBtn?.addEventListener("click", () => this.training.resetTraining());
    this.refs.speedUpBtn?.addEventListener("click", () => this.training.speedUp());
    this.refs.normalSpeedBtn?.addEventListener("click", () => this.training.normalSpeed());

    this.refs.modeRadios?.forEach((radio) => {
      radio.addEventListener("change", (event) => {
        const target = event.target;
        if (target.checked) {
          this.training.setMode(target.value);
        }
      });
    });
  }

  setModeHint(text) {
    if (this.refs.modeHint) {
      this.refs.modeHint.textContent = text;
    }
  }

  setSpacePressed(isPressed) {
    const now = performance.now();

    if (isPressed) {
      this.spacePressedUntil = now + 130;
      if (this.refs.spaceStatus) {
        this.refs.spaceStatus.textContent = "AI pressed SPACE";
      }
    } else if (now > this.spacePressedUntil && this.refs.spaceStatus) {
      this.refs.spaceStatus.textContent = "Waiting for decision";
    }

    this.updateSpaceVisual();
  }

  update(stats) {
    this.updateSpaceVisual();

    this.refs.generation.textContent = String(stats.generation);
    this.refs.currentAgent.textContent = String(stats.currentAgent);
    this.refs.currentScore.textContent = String(stats.currentScore);
    this.refs.bestScore.textContent = String(stats.bestScore);
    this.refs.generationBest.textContent = String(stats.generationBest);
    this.refs.avgScore.textContent = stats.avgScore.toFixed(2);
    this.refs.agentsTested.textContent = String(stats.agentsTested);
    this.refs.deaths.textContent = String(stats.deaths);
    this.refs.speed.textContent = `${stats.speed}x`;

    this.refs.aiState.textContent = stats.aiState;
    this.refs.output.textContent = Number(stats.aiOutput).toFixed(3);
    this.refs.decision.textContent = stats.aiDecision;
  }

  updateSpaceVisual() {
    const pressed = performance.now() < this.spacePressedUntil;
    this.refs.spaceKey.classList.toggle("pressed", pressed);

    if (!pressed && this.refs.spaceStatus.textContent !== "Waiting for decision") {
      this.refs.spaceStatus.textContent = "Waiting for decision";
    }
  }
}
