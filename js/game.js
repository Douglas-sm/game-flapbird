import { Bird } from "./bird.js";
import { Pipe } from "./pipe.js";

export class Game {
  constructor(options = {}) {
    this.width = options.width ?? 480;
    this.height = options.height ?? 640;
    this.floorHeight = options.floorHeight ?? 72;
    this.playHeight = this.height - this.floorHeight;

    this.gravity = 0.28;
    this.maxFallSpeed = 6;
    this.jumpForce = -4.8;

    this.pipeWidth = 58;
    this.pipeGap = 145;
    this.pipeSpacing = 210;
    this.pipeSpeed = 2.2;

    this.bird = new Bird(120, this.height / 2, 18);
    this.pipes = [];
    this.reset();
  }

  reset() {
    this.dead = false;
    this.score = 0;
    this.ticks = 0;
    this.bird.reset(120, this.playHeight / 2);
    this.pipes = [];

    this.spawnPipe(this.width + 120);
    this.spawnPipe(this.width + 120 + this.pipeSpacing);
  }

  spawnPipe(startX) {
    const minGapTop = 80;
    const maxGapTop = this.playHeight - this.pipeGap - 80;
    const gapTop = Math.floor(minGapTop + Math.random() * (maxGapTop - minGapTop));
    this.pipes.push(
      new Pipe(startX, this.pipeWidth, gapTop, this.pipeGap, this.playHeight, this.pipeSpeed)
    );
  }

  getNextPipe() {
    return this.pipes.find((pipe) => pipe.x + pipe.width >= this.bird.x - 8) ?? null;
  }

  getStateInputs() {
    const nextPipe = this.getNextPipe();

    if (!nextPipe) {
      return {
        inputs: [this.bird.y / this.playHeight, 0, 1, 0.35, 0.65],
        nextPipe: null,
      };
    }

    const distanceX = (nextPipe.x + nextPipe.width - this.bird.x) / this.width;
    const velocityNorm = (this.bird.velocityY + this.maxFallSpeed) / (this.maxFallSpeed * 2);
    const gapTopNorm = nextPipe.gapTop / this.playHeight;
    const gapBottomNorm = (nextPipe.gapTop + nextPipe.gapHeight) / this.playHeight;

    return {
      inputs: [
        clamp01(this.bird.y / this.playHeight),
        clamp01(velocityNorm),
        clamp01(distanceX),
        clamp01(gapTopNorm),
        clamp01(gapBottomNorm),
      ],
      nextPipe,
    };
  }

  step(shouldJump) {
    if (this.dead) {
      return { dead: true, score: this.score };
    }

    if (shouldJump) {
      this.bird.jump(this.jumpForce);
    }

    this.bird.update(this.gravity, this.maxFallSpeed);

    for (const pipe of this.pipes) {
      pipe.update();

      if (!pipe.scored && pipe.x + pipe.width < this.bird.x) {
        pipe.scored = true;
        this.score += 1;
      }

      if (pipe.collidesWith(this.bird.getBounds())) {
        this.dead = true;
      }
    }

    this.pipes = this.pipes.filter((pipe) => !pipe.isOffscreen());

    const lastPipe = this.pipes[this.pipes.length - 1];
    if (lastPipe && lastPipe.x < this.width - this.pipeSpacing) {
      this.spawnPipe(this.width + 40);
    }

    const birdTop = this.bird.y - this.bird.size / 2;
    const birdBottom = this.bird.y + this.bird.size / 2;
    if (birdTop < 0 || birdBottom > this.playHeight) {
      this.dead = true;
    }

    this.ticks += 1;
    return { dead: this.dead, score: this.score };
  }

  draw(ctx, options = {}) {
    const simplified = options.simplified ?? false;
    const overlayText = options.overlayText ?? "";

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    this.drawBackground(ctx, simplified);
    for (const pipe of this.pipes) {
      pipe.draw(ctx);
    }
    this.bird.draw(ctx);
    this.drawGround(ctx, simplified);
    this.drawScore(ctx);

    if (overlayText) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(8, 8, 206, 22);
      ctx.fillStyle = "#f4f4f4";
      ctx.font = "12px monospace";
      ctx.fillText(overlayText, 14, 23);
    }

    ctx.restore();
  }

  drawBackground(ctx, simplified) {
    ctx.fillStyle = "#73b8ff";
    ctx.fillRect(0, 0, this.width, this.playHeight);

    if (simplified) {
      ctx.fillStyle = "#8ac4ff";
      for (let y = 0; y < this.playHeight; y += 24) {
        ctx.fillRect(0, y, this.width, 2);
      }
      return;
    }

    // Pixel clouds.
    drawCloud(ctx, 40, 74, 20, "#d8ecff");
    drawCloud(ctx, 180, 130, 16, "#d8ecff");
    drawCloud(ctx, 320, 88, 18, "#d8ecff");

    // Distant blocks to make the world less flat.
    ctx.fillStyle = "#80b5ef";
    for (let x = 0; x < this.width; x += 32) {
      const h = 18 + ((x / 32) % 3) * 8;
      ctx.fillRect(x, this.playHeight - 48 - h, 20, h);
    }
  }

  drawGround(ctx, simplified) {
    ctx.fillStyle = "#cba45d";
    ctx.fillRect(0, this.playHeight, this.width, this.floorHeight);

    if (simplified) {
      return;
    }

    const block = 16;
    for (let y = this.playHeight; y < this.height; y += block) {
      for (let x = 0; x < this.width; x += block) {
        ctx.fillStyle = (x / block + y / block) % 2 === 0 ? "#d6b16b" : "#b88f4f";
        ctx.fillRect(x, y, block, block);
      }
    }
  }

  drawScore(ctx) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fillRect(this.width - 92, 8, 84, 30);
    ctx.fillStyle = "#ffffff";
    ctx.font = "15px monospace";
    ctx.fillText(`Score ${this.score}`, this.width - 85, 28);
  }
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function drawCloud(ctx, x, y, size, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, size, size);
  ctx.fillRect(x + size, y - size / 2, size, size);
  ctx.fillRect(x + size * 2, y, size, size);
  ctx.fillRect(x + size, y + size / 2, size, size);
}
