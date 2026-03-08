import { TrainingManager } from "./training.js";
import { UIController } from "./ui.js";

function bootstrap() {
  const canvas = document.getElementById("gameCanvas");
  const context = canvas.getContext("2d");
  context.imageSmoothingEnabled = false;

  const training = new TrainingManager({ canvas, context });
  const ui = new UIController(training);
  training.setUI(ui);

  function frame() {
    training.update();
    training.draw();
    ui.update(training.getStats());
    window.requestAnimationFrame(frame);
  }

  frame();
}

window.addEventListener("DOMContentLoaded", bootstrap);
