import { Container, Sprite } from "pixi.js";
import { ScoreMultiplierBadge } from "./ScoreMultiplierBadge.js";

/**
 * Dai dien cho mot quai tren board va cac trang thai hien thi cua no.
 */
export class Monster extends Container {
    constructor({ type, texture, row, column, cellSize, sizeRatio }) {
        super();

        // Cell xu ly input, hinh quai khong duoc chan vung tuong tac.
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
        // Owl doi qua nhieu texture co kich thuoc khac nhau nen phai scale lai.
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
