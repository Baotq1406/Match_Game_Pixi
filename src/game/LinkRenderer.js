import { Container, Graphics } from "pixi.js";

/**
 * Ve duong noi va glow giua cac quai dang duoc chon.
 */
export class LinkRenderer extends Container {
    constructor({ cellSize, config }) {
        super();

        this.cellSize = cellSize;
        this.config = config;
        this.glow = new Graphics();
        this.core = new Graphics();
        this.vfx = new Graphics();
        this.points = [];
        this.elapsedMilliseconds = 0;

        this.glow.eventMode = "none";
        this.core.eventMode = "none";
        this.vfx.eventMode = "none";

        this.addChild(this.glow);
        this.addChild(this.core);
        this.addChild(this.vfx);
    }

    render(monsters, pointerPosition = null) {
        // Ve hai lop de tao loi trang va glow ben ngoai.
        const points = monsters.map((monster) => this.getMonsterCenter(monster));

        if (pointerPosition) {
            points.push(pointerPosition);
        }

        this.points = points;

        this.draw(this.glow, points, {
            color: this.config.linkGlowColor,
            alpha: this.config.linkGlowAlpha,
            width: this.config.linkGlowWidth,
        });
        this.draw(this.core, points, {
            color: this.config.linkCoreColor,
            alpha: this.config.linkCoreAlpha,
            width: this.config.linkCoreWidth,
        });
        this.drawVfx();
    }

    update(deltaMilliseconds) {
        if (this.points.length === 0) {
            return;
        }

        // Hat sang chay doc duong noi nen VFX van song khi nguoi choi giu chuot.
        this.elapsedMilliseconds += deltaMilliseconds;
        this.drawVfx();
    }

    clear() {
        this.glow.clear();
        this.core.clear();
        this.vfx.clear();
        this.points = [];
        this.elapsedMilliseconds = 0;
    }

    getMonsterCenter(monster) {
        return {
            x: monster.x + this.cellSize / 2,
            y: monster.y + this.cellSize / 2,
        };
    }

    draw(graphics, points, style) {
        graphics.clear();

        if (points.length === 0) {
            return;
        }

        if (points.length === 1) {
            graphics
                .circle(points[0].x, points[0].y, style.width / 2)
                .fill(style);
            return;
        }

        graphics.moveTo(points[0].x, points[0].y);

        for (let index = 1; index < points.length; index++) {
            graphics.lineTo(points[index].x, points[index].y);
        }

        graphics.stroke({
            ...style,
            cap: "round",
            join: "round",
        });

        for (const point of points.slice(0, -1)) {
            graphics.circle(point.x, point.y, style.width / 2).fill(style);
        }
    }

    drawVfx() {
        this.vfx.clear();

        if (this.points.length === 0) {
            return;
        }

        if (this.points.length === 1) {
            const pulse = 0.75 + Math.sin(this.elapsedMilliseconds / 120) * 0.15;

            this.vfx
                .circle(
                    this.points[0].x,
                    this.points[0].y,
                    this.config.linkGlowWidth * pulse
                )
                .fill({ color: this.config.linkGlowColor, alpha: 0.14 });
            return;
        }

        // Ba hat nho chay lap de duong noi de nhin thay dang co nang luong.
        const particleCount = 3;
        const travel = this.elapsedMilliseconds / 700;

        for (let index = 0; index < particleCount; index++) {
            const position = this.getPathPosition(
                (travel + index / particleCount) % 1
            );
            const pulse =
                0.85 +
                Math.sin(this.elapsedMilliseconds / 90 + index * 2) * 0.15;

            this.vfx
                .circle(position.x, position.y, 8 * pulse)
                .fill({ color: this.config.linkGlowColor, alpha: 0.2 })
                .circle(position.x, position.y, 3 * pulse)
                .fill({ color: 0xffffff, alpha: 0.95 });
        }
    }

    getPathPosition(progress) {
        const segments = [];
        let totalLength = 0;

        for (let index = 1; index < this.points.length; index++) {
            const start = this.points[index - 1];
            const end = this.points[index];
            const length = Math.hypot(end.x - start.x, end.y - start.y);

            segments.push({ start, end, length });
            totalLength += length;
        }

        let remainingLength = totalLength * progress;

        for (const segment of segments) {
            if (remainingLength <= segment.length || segment === segments.at(-1)) {
                const ratio = segment.length === 0 ? 0 : remainingLength / segment.length;

                return {
                    x: segment.start.x + (segment.end.x - segment.start.x) * ratio,
                    y: segment.start.y + (segment.end.y - segment.start.y) * ratio,
                };
            }

            remainingLength -= segment.length;
        }

        return this.points.at(-1);
    }
}
