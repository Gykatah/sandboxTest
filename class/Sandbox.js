
export class Sandbox
{
    ctx = null;
    lastTime = performance.now();
    width = 400;
    height = 600;
    pixelperpixel = 40
    materials = {};
    speed = 2;
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
        this.map = Array.from({ length: this.height / this.pixelperpixel }, () => Array(this.width / this.pixelperpixel).fill({ name: "air", temperature: 24 }));
        const canvas = document.getElementById(canvasId);
        canvas.width = this.width;
        canvas.height = this.height;
        this.ctx = canvas.getContext("2d");
        document.addEventListener("mousedown", (event) => { this.drawing = true; this.move(event, canvas) });
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
            const x = Math.floor(mouseX / this.pixelperpixel);
            const y = Math.floor((this.height - mouseY) / this.pixelperpixel);

            if (this.lastMouse) {
                this.drawLine(this.lastMouse.x, this.lastMouse.y, x, y, this.item);
            } else {
                this.drawBrush(x, y, this.item)
            }

            this.lastMouse = { x, y };
        }
    }
    drawLine(x0, y0, x1, y1, material)
    {
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

    drawBrush(x, y, material)
    {
        const half = Math.floor(this.size / 2);
        for (let offsetY = -half; offsetY <= half; offsetY++) {
            for (let offsetX = -half; offsetX <= half; offsetX++) {
                const drawY = y + offsetY;
                const drawX = x + offsetX;
                if (
                    drawY >= 0 && drawY < this.map.length &&
                    drawX >= 0 && drawX < this.map[0].length &&
                    this.map[drawY][drawX].name === "air"
                ) {
                    this.map[drawY][drawX] = { ...this.materials[material] };
                }
            }
        }
    }


    draw(delta)
    {
        this.ctx.clearRect(0, 0, this.width, this.height);
        let operations = 0;
        for (let y = 0; y < this.height / this.pixelperpixel; y++) {
            for (let x = 0; x < this.width / this.pixelperpixel; x++) {
                const cell = this.map[y][x];
                if (cell) {
                    this.update(delta, cell, y, x)
                    const color = this.materials[cell.name]?.getColor() || "#ff00ff";
                    const minTemp = -100, maxTemp = 100;
                    const t = Math.max(minTemp, Math.min(maxTemp, cell.temperature || 0));
                    const ratio = (t - minTemp) / (maxTemp - minTemp);
                    const r = Math.round(255 * ratio);
                    const b = Math.round(255 * (1 - ratio));
                    const g = Math.round(255 * (1 - Math.abs(ratio - 0.5) * 2));
                    const color2 = `rgba(${r},${g},${b},0.4)`;
                    this.ctx.fillStyle = color;
                    const px = x * this.pixelperpixel;
                    const py = this.height - (y + 1) * this.pixelperpixel;
                    this.ctx.fillRect(px, py, this.pixelperpixel, this.pixelperpixel);
                    this.ctx.fillStyle = color2;
                    this.ctx.fillRect(px, py, this.pixelperpixel, this.pixelperpixel);
                    this.ctx.fillStyle = "white";
                    this.ctx.font = (cell.temperature<10?1.6*this.pixelperpixel:cell.temperature<100?0.8*this.pixelperpixel:0.4*this.pixelperpixel)+"px monospace";
                    this.ctx.fillText(cell.temperature || 0, px, py + this.pixelperpixel);
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
                this.gravityTest(block, x, y, this.materials[block.name].gravity, -1)
            } else if (this.materials[block.name].gravity < 0) {
                this.gravityTest(block, x, y, this.materials[block.name].gravity, +1)
            }
        }
    }

    temperatureTest()
    {
        const tempMap = JSON.parse(JSON.stringify(this.map))
        for (let y = 0; y < this.height / this.pixelperpixel; y++) {
            for (let x = 0; x < this.width / this.pixelperpixel; x++) {
                const block = tempMap[y][x];
                const current = tempMap[y]?.[x];
                if (!current || current.temperature == null) return;
                const neighbors = [
                    [x, y - 1],
                    [x + 1, y],
                ];
                for (const [nx, ny] of neighbors) {
                    const neighbor = tempMap[ny]?.[nx];
                    if (!neighbor || neighbor.temperature == null) continue;

                    const tempA = neighbor.temperature;
                    const tempB = current.temperature; 
                    const transA = neighbor.transmutator ?? 1;
                    const transB = block.transmutator ?? 1;
                    const conductivity = (transA + transB) / 2;
                    const delta = (tempA - tempB) * conductivity;
                    neighbor.temperature -= delta;
                    current.temperature += delta;
                }
            }
        }
        this.map = tempMap
    }

    gravityTest(block, x, y, density, dirY)
    {
        const below = this.map[y + dirY]?.[x];
        const belowLeft = this.map[y + dirY]?.[x - 1];
        const belowRight = this.map[y + dirY]?.[x + 1];
        const left = this.map[y]?.[x - 1];
        const right = this.map[y]?.[x + 1];
        if (!below && this.map[y + dirY]) {
            this.map[y + dirY][x] = { ...block };
            this.map[y][x] = { ...this.materials["air"], temperature: block.temperature };
            return;
        }
        if (this.map[y + dirY] && this.materials[below.name]?.gravity < density) {
            this.map[y + dirY][x] = { ...block };
            if (block.name != "lava") {
                this.map[y][x] = below;
            } else {
                this.map[y][x] = { ...this.materials["air"], temperature: block.temperature };
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
            this.map[y][x] = side || { ...this.materials["air"], temperature: block.temperature };
            this.map[y][x + dir] = { ...block };
            return;
        }
    }


    gameLoop(now)
    {
        if (this.globalTime > 10) {
            this.globalTime -= 10
            this.temperatureTest()
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