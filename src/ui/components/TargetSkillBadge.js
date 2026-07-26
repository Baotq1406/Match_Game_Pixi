import { Container, Graphics, Text } from "pixi.js";

export class TargetSkillBadge extends Container {
    constructor({ ticker, cardSize }) {
        super();

        this.ticker = ticker;
        this.hideAnimation = null;
        const width = 58;
        const height = 20;
        const background = new Graphics()
            .roundRect(0, 0, width, height, 8)
            .fill({ color: 0x72d992, alpha: 0.96 })
            .stroke({ color: 0xffffff, width: 1.5 });
        this.label = new Text({
            text: "",
            style: {
                fill: 0x173b24,
                fontFamily: "Arial, sans-serif",
                fontSize: 12,
                fontWeight: "900",
            },
        });

        this.label.anchor.set(0.5);
        this.label.position.set(width / 2, height / 2);
        this.position.set((cardSize - width) / 2, 4);
        this.addChild(background, this.label);
        this.visible = false;
    }

    showTemporary(text, durationMilliseconds = 900) {
        this.stopHideAnimation();
        this.show(text);

        if (!this.ticker) {
            return;
        }

        let elapsed = 0;
        this.hideAnimation = (ticker) => {
            elapsed += ticker.deltaMS;
            if (elapsed >= durationMilliseconds) {
                this.stopHideAnimation();
                this.visible = false;
            }
        };
        this.ticker.add(this.hideAnimation);
    }

    setCountdown(multiplier, seconds) {
        this.stopHideAnimation();
        if (seconds <= 0) {
            this.visible = false;
            return;
        }
        this.show(`×${multiplier} ${seconds}s`);
    }

    show(text) {
        this.label.text = text;
        this.visible = true;
    }

    stopHideAnimation() {
        if (!this.hideAnimation) {
            return;
        }
        this.ticker?.remove(this.hideAnimation);
        this.hideAnimation = null;
    }

    destroy(options) {
        this.stopHideAnimation();
        super.destroy(options);
    }
}
