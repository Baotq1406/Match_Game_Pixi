import { Container, Sprite } from "pixi.js";
import { ScoreMultiplierBadge } from "./ScoreMultiplierBadge.js";

export class Monster extends Container {
    constructor({ type, texture, row, column, cellSize, sizeRatio }) {
        super();

        // Cell owns pointer interaction; monster art must not block its hit area.
        this.eventMode = "none";

        this.type = type;
        this.row = row;
        this.column = column;
        this.cellSize = cellSize;

        this.sprite = new Sprite(texture);
        this.sprite.eventMode = "none";
        this.sprite.anchor.set(0.5);

        const maximumSize = cellSize * sizeRatio;
        const scale = Math.min(
            maximumSize / texture.width,
            maximumSize / texture.height
        );

        this.sprite.scale.set(scale);
        this.sprite.position.set(cellSize / 2, cellSize / 2);

        this.multiplierBadge = new ScoreMultiplierBadge(cellSize);
        this.addChild(this.sprite, this.multiplierBadge);
        this.setGridPosition(row, column);
    }

    setScoreMultiplier(multiplier) {
        this.multiplierBadge.setMultiplier(multiplier);
    }

    setGridPosition(row, column) {
        this.row = row;
        this.column = column;
        this.position.set(
            column * this.cellSize,
            row * this.cellSize
        );
    }
}
