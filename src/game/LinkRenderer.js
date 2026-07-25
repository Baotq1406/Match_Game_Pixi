import { Container, Graphics } from "pixi.js";

export class LinkRenderer extends Container {
    constructor({ cellSize, config }) {
        super();

        this.cellSize = cellSize;
        this.config = config;
        this.glow = new Graphics();
        this.core = new Graphics();

        this.glow.eventMode = "none";
        this.core.eventMode = "none";

        this.addChild(this.glow);
        this.addChild(this.core);
    }

    render(monsters, pointerPosition = null) {
        const points = monsters.map((monster) => this.getMonsterCenter(monster));

        if (pointerPosition) {
            points.push(pointerPosition);
        }

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
    }

    clear() {
        this.glow.clear();
        this.core.clear();
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
}
