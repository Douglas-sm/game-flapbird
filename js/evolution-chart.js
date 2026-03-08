export class EvolutionChart {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas?.getContext?.("2d") ?? null;
  }

  render(history) {
    if (!this.ctx || !this.canvas) {
      return;
    }

    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = "#111f2b";
    ctx.fillRect(0, 0, width, height);

    if (!history || history.length === 0) {
      ctx.fillStyle = "#d4e9ff";
      ctx.font = "12px monospace";
      ctx.fillText("Aguardando geracoes de treino...", 14, Math.floor(height / 2));
      ctx.restore();
      return;
    }

    const padLeft = 40;
    const padRight = 40;
    const padTop = 16;
    const padBottom = 28;

    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    const maxScore = Math.max(
      1,
      ...history.map((item) => Math.max(item.bestScore ?? 0, item.avgScore ?? 0))
    );

    const lossValues = history
      .map((item) => item.loss)
      .filter((value) => Number.isFinite(value) && value >= 0);
    const maxLoss = Math.max(0.15, ...lossValues);

    ctx.strokeStyle = "rgba(173, 212, 247, 0.25)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i += 1) {
      const y = padTop + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.stroke();
    }

    ctx.strokeStyle = "#7aa0bf";
    ctx.beginPath();
    ctx.moveTo(padLeft, padTop);
    ctx.lineTo(padLeft, height - padBottom);
    ctx.lineTo(width - padRight, height - padBottom);
    ctx.stroke();

    const toX = (index) => {
      if (history.length === 1) {
        return padLeft + chartW / 2;
      }
      return padLeft + (index / (history.length - 1)) * chartW;
    };

    const toYScore = (value) => padTop + chartH - (value / maxScore) * chartH;
    const toYLoss = (value) => padTop + chartH - (value / maxLoss) * chartH;

    this.drawLine(history, "bestScore", toX, toYScore, "#35d07f", 2);
    this.drawLine(history, "avgScore", toX, toYScore, "#f4b860", 2);

    const hasLoss = lossValues.length > 0;
    if (hasLoss) {
      this.drawLine(history, "loss", toX, toYLoss, "#57b0ff", 2);
    }

    ctx.fillStyle = "#c5e4ff";
    ctx.font = "10px monospace";
    ctx.fillText(`Score max: ${maxScore.toFixed(1)}`, 6, 14);
    ctx.fillText(`Loss max: ${maxLoss.toFixed(3)}`, width - 128, 14);

    const firstGen = history[0]?.generation ?? 1;
    const lastGen = history[history.length - 1]?.generation ?? firstGen;
    ctx.fillText(`Gen ${firstGen}`, padLeft, height - 8);
    ctx.fillText(`Gen ${lastGen}`, width - padRight - 44, height - 8);

    this.drawLegend(width, height, hasLoss);
    ctx.restore();
  }

  drawLine(history, key, toX, toY, color, width) {
    const ctx = this.ctx;
    let started = false;

    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();

    for (let i = 0; i < history.length; i += 1) {
      const value = history[i][key];
      if (!Number.isFinite(value)) {
        continue;
      }

      const x = toX(i);
      const y = toY(value);

      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    }

    if (started) {
      ctx.stroke();
    }
  }

  drawLegend(width, height, showLoss) {
    const ctx = this.ctx;
    const y = height - 8;

    let x = 10;
    x = this.drawLegendItem(x, y, "#35d07f", "best");
    x = this.drawLegendItem(x + 8, y, "#f4b860", "avg");

    if (showLoss) {
      this.drawLegendItem(x + 8, y, "#57b0ff", "tf loss");
    }
  }

  drawLegendItem(x, y, color, label) {
    const ctx = this.ctx;

    ctx.fillStyle = color;
    ctx.fillRect(x, y - 7, 10, 3);
    ctx.fillStyle = "#dbefff";
    ctx.font = "10px monospace";
    ctx.fillText(label, x + 14, y);

    return x + 14 + ctx.measureText(label).width;
  }
}
