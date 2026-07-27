import { Container, Graphics, Text } from "pixi.js";

/**
 * Badge điểm nhân cho quái đang được hưởng hệ số điểm.
 */
export class ScoreMultiplierBadge extends Container {
    constructor(cellSize) {
        super();

        const background = new Graphics()
            .roundRect(0, 0, 30, 20, 8)
            .fill({ color: 0x72d992, alpha: 0.96 })
            .stroke({ color: 0xffffff, width: 2 });
        this.label = new Text({
            text: "×2",
            style: {
                fill: 0x173b24,
                fontFamily: "Arial, sans-serif",
                fontSize: 13,
                fontWeight: "900",
            },
        });

        this.label.anchor.set(0.5);
        this.label.position.set(15, 10);
        this.position.set(cellSize - 34, 5);
        this.addChild(background, this.label);
        this.visible = false;
    }

    setMultiplier(multiplier) {
        this.label.text = `×${multiplier}`;
        this.visible = multiplier > 1;
    }
}
