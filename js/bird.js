export class Bird {
  constructor(x, y, size = 18) {
    this.size = size;
    this.reset(x, y);
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.velocityY = 0;
    this.flapFrame = 0;
  }

  update(gravity, maxFallSpeed) {
    this.velocityY = Math.min(this.velocityY + gravity, maxFallSpeed);
    this.y += this.velocityY;
    this.flapFrame = (this.flapFrame + 1) % 20;
  }

  jump(jumpForce) {
    this.velocityY = jumpForce;
  }

  getBounds() {
    const half = this.size / 2;
    return {
      x: this.x - half,
      y: this.y - half,
      width: this.size,
      height: this.size,
    };
  }

  draw(ctx) {
    const left = Math.floor(this.x - this.size / 2);
    const top = Math.floor(this.y - this.size / 2);
    const px = Math.max(2, Math.floor(this.size / 6));

    // Body
    fillPixels(ctx, left + px, top + px, 4, 4, px, "#f5d65b");
    fillPixels(ctx, left + px * 5, top + px * 2, 1, 2, px, "#f5d65b");

    // Wing animation toggles between two positions for a retro feel.
    const wingOffset = this.flapFrame < 10 ? 2 : 3;
    fillPixels(ctx, left + px * 2, top + px * wingOffset, 2, 2, px, "#d1a23d");

    // Eye
    fillPixels(ctx, left + px * 4, top + px * 2, 1, 1, px, "#ffffff");
    fillPixels(ctx, left + px * 4, top + px * 2, 1, 1, Math.max(1, Math.floor(px / 2)), "#111111");

    // Beak
    fillPixels(ctx, left + px * 6, top + px * 3, 2, 1, px, "#f09035");
  }
}

function fillPixels(ctx, x, y, cols, rows, pixelSize, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, cols * pixelSize, rows * pixelSize);
}
