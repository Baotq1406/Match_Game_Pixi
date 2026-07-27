import { Container, Sprite } from "pixi.js";
import { ScoreMultiplierBadge } from "./ScoreMultiplierBadge.js";

/**
 * Đại diện cho một quái trên board và các trạng thái hiển thị của nó.
 */
export class Monster extends Container {
    constructor({ type, texture, row, column, cellSize, sizeRatio }) {
        super();

        // Cell xử lý input, hình quái không được chặn vùng tương tác.
        this.eventMode = "none";

        this.type = type;
        this.row = row;
        this.column = column;
        this.cellSize = cellSize;
        this.maximumSize = cellSize * sizeRatio;

        this.sprite = new Sprite(texture);
        this.sprite.eventMode = "none";
        this.sprite.anchor.set(0.5);
        this.sprite.position.set(cellSize / 2, cellSize / 2);
        this.setDisplayTexture(texture);

        this.multiplierBadge = new ScoreMultiplierBadge(cellSize);
        this.addChild(this.sprite, this.multiplierBadge);
        this.setGridPosition(row, column);
    }

    setDisplayTexture(texture) {
        // Owl đổi qua nhiều texture có kích thước khác nhau nên phải scale lại.
        this.sprite.texture = texture;
        const scale = Math.min(
            this.maximumSize / texture.width,
            this.maximumSize / texture.height
        );
        this.sprite.scale.set(scale);
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
