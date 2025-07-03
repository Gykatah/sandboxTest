
export class Sandbox
{
    ctx = null;
    lastTime = performance.now();
    width = 400;
    height = 600;
    materials = {};
    speed = 50;
    size = 1;
    fps = 0;
    opAvg = 0;
    fpsCounter = 0;
    opCounter = 0;
    item = "water"
    timeAccumulator = 0;
    drawing = false
    globalTime = 0
    map = []
    lastMouse = null;
    constructor(canvasId, materials)
    {
        materials.forEach((material) =>
        {
            this.materials[material.name] = material
        })
        this.map = Array.from({ length: this.height / 10 }, () => Array(this.width / 10).fill(null));
        const canvas = document.getElementById(canvasId);
        canvas.width = this.width;
        canvas.height = this.height;
        this.ctx = canvas.getContext("2d");
        document.addEventListener("mousedown", () => { this.drawing = true });
        document.addEventListener("mouseup", () => { this.drawing = false; this.lastMouse = null });
        canvas.addEventListener("mousemove", (event) => this.move(event, canvas));
        this.gameLoop = this.gameLoop.bind(this);
        requestAnimationFrame(this.gameLoop);
    }
    move(event, canvas)
    {
        if (this.drawing) {
            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;
            const x = Math.floor(mouseX / 10);
            const y = Math.floor((this.height - mouseY) / 10);

            if (this.lastMouse) {
                this.drawLine(this.lastMouse.x, this.lastMouse.y, x, y, this.item);
            } else {
                this.drawBrush(x,y,this.item)
            }

            this.lastMouse = { x, y };
        }
    }
    drawLine(x0, y0, x1, y1, material) {
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;

        while (true) {
            this.drawBrush(x0, y0, material);

            if (x0 === x1 && y0 === y1) break;

            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x0 += sx;
            }
            if (e2 < dx) {
                err += dx;
                y0 += sy;
            }
        }
    }

    drawBrush(x, y, material) {
        const half = Math.floor(this.size / 2);
        for (let offsetY = -half; offsetY <= half; offsetY++) {
            for (let offsetX = -half; offsetX <= half; offsetX++) {
                const drawY = y + offsetY;
                const drawX = x + offsetX;
                if (
                    drawY >= 0 && drawY < this.map.length &&
                    drawX >= 0 && drawX < this.map[0].length &&
                    this.map[drawY][drawX] === null
                ) {
                    this.map[drawY][drawX] = { name: material };
                }
            }
        }
    }


    draw(delta)
    {
        this.ctx.clearRect(0, 0, this.width, this.height);
        let operations = 0;
        for (let y = 0; y < this.height / 10; y++) {
            for (let x = 0; x < this.width / 10; x++) {
                const cell = this.map[y][x];
                if (cell) {
                    this.update(delta, cell, y, x)
                    const color = this.materials[cell.name]?.getColor() || "#ff00ff";
                    this.ctx.fillStyle = color;
                    const px = x * 10;
                    const py = this.height - (y + 1) * 10;
                    this.ctx.fillRect(px, py, 10, 10);
                    operations++;
                }
            }
        }
        this.opCounter += operations;
        this.ctx.fillStyle = "white";
        this.ctx.font = "16px monospace";
        this.ctx.fillText(`FPS: ${this.fps.toFixed(1)}`, 10, 20);
        this.ctx.fillText(`Ops/frame: ${this.opAvg.toFixed(1)}`, 10, 40);
        this.ctx.fillText(`Speed: ${this.speed.toFixed(1)}x`, 10, 60);
        this.ctx.fillText(`Tick: ${this.globalTime.toFixed(1)}`, 10, 80);
    }
    update(delta, block, y, x)
    {
        if (!block) return;
        block.cycle = block.cycle || 0.1;
        const currentTick = Math.floor(this.globalTime / block.cycle);
        if (!block.lastTick) block.lastTick = currentTick
        if (block.lastTick !== currentTick) {
            block.lastTick = currentTick;
            if (this.materials[block.name].gravity >= 1) {
                this.gravityTest(block, x, y, this.materials[block.name].gravity)
            }
        }
    }

    gravityTest(block, x, y, density)
    {
        const below = this.map[y - 1]?.[x];
        const belowLeft = this.map[y - 1]?.[x - 1];
        const belowRight = this.map[y - 1]?.[x + 1];
        const left = this.map[y]?.[x - 1];
        const right = this.map[y]?.[x + 1];
        if (!below && this.map[y - 1]) {
            this.map[y - 1][x] = { ...block };
            this.map[y][x] = null;
            return;
        }
        if (this.map[y - 1] && this.materials[below.name]?.gravity < density) {
            this.map[y - 1][x] = { ...block };
            if(block.name!="lava"){
                this.map[y][x] = below;
            }else{
                this.map[y][x] = null;
            }
            return;
        }
        const directions = [-1, 1];
        const dir = directions[Math.floor(Math.random() * 2)];
        const side = this.map[y]?.[x + dir];

        const supportedBelow = below != null;
        const supportedBelowSides = belowLeft != null && belowRight != null;

        if (supportedBelow && supportedBelowSides && block.name != "water") return;
        if (block.name != "water" && y == 0) return
        if (!side || this.materials[side.name]?.gravity < density && this.map[y][x + dir]) {
            this.map[y][x] = side || null;
            this.map[y][x + dir] = { ...block };
            return;
        }
    }


    gameLoop(now)
    {
        if (this.globalTime > 50) {
            this.globalTime -= 50
        }
        // this.drawLine(3,50,6,50,"water")
        const delta = (now - this.lastTime) / 1000;
        this.lastTime = now;
        this.globalTime = this.globalTime + delta * this.speed

        this.fpsCounter++;
        this.timeAccumulator += delta;

        if (this.timeAccumulator >= 0.2) {
            this.fps = this.fpsCounter / this.timeAccumulator;
            this.opAvg = this.opCounter / this.fpsCounter;
            this.fpsCounter = 0;
            this.opCounter = 0;
            this.timeAccumulator = 0;
        }

        this.draw(delta);
        requestAnimationFrame(this.gameLoop);
    }
}