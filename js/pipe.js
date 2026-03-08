function intersects(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export class Pipe {
  constructor(x, width, gapTop, gapHeight, playHeight, speed) {
    this.x = x;
    this.width = width;
    this.gapTop = gapTop;
    this.gapHeight = gapHeight;
    this.playHeight = playHeight;
    this.speed = speed;
    this.scored = false;
  }

  update() {
    this.x -= this.speed;
  }

  isOffscreen() {
    return this.x + this.width < 0;
  }

  collidesWith(rect) {
    const topPipe = {
      x: this.x,
      y: 0,
      width: this.width,
      height: this.gapTop,
    };

    const bottomPipeY = this.gapTop + this.gapHeight;
    const bottomPipe = {
      x: this.x,
      y: bottomPipeY,
      width: this.width,
      height: this.playHeight - bottomPipeY,
    };

    return intersects(rect, topPipe) || intersects(rect, bottomPipe);
  }

  draw(ctx) {
    const body = "#3d9d40";
    const dark = "#2f7d33";
    const light = "#59c55f";
    const cap = "#52b958";
    const capHeight = 14;

    // Top pipe
    drawPipeBody(ctx, this.x, 0, this.width, this.gapTop, body, dark, light);
    ctx.fillStyle = cap;
    ctx.fillRect(this.x - 4, this.gapTop - capHeight, this.width + 8, capHeight);

    // Bottom pipe
    const bottomY = this.gapTop + this.gapHeight;
    drawPipeBody(ctx, this.x, bottomY, this.width, this.playHeight - bottomY, body, dark, light);
    ctx.fillStyle = cap;
    ctx.fillRect(this.x - 4, bottomY, this.width + 8, capHeight);
  }
}

function drawPipeBody(ctx, x, y, width, height, body, dark, light) {
  ctx.fillStyle = body;
  ctx.fillRect(x, y, width, height);

  // Pixel blocks to keep the retro look.
  const step = 8;
  ctx.fillStyle = dark;
  for (let line = y; line < y + height; line += step * 2) {
    ctx.fillRect(x, line, width, 2);
  }

  ctx.fillStyle = light;
  ctx.fillRect(x + 4, y, 3, height);
}
