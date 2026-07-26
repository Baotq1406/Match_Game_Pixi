import { Container, Graphics, Sprite, Text } from "pixi.js";
import { AssetId, AssetLoader } from "../../services/AssetLoader.js";
import { HUD_COLORS, createPanel, fitSprite } from "./HudStyles.js";
import { TargetCharge } from "./TargetCharge.js";
import { TargetSkillBadge } from "./TargetSkillBadge.js";

export class TargetCard extends Container {
    constructor({ monsterType, ticker, targetLimit, cardSize }) {
        super();

        this.monsterType = monsterType;
        this.ticker = ticker;
        this.targetLimit = targetLimit;
        this.cardSize = cardSize;
        this.value = 0;
        this.charge = new TargetCharge(targetLimit);
        this.animation = null;

        const background = createPanel(cardSize, cardSize, 10, 2);
        this.progressFill = new Graphics();
        const basket = new Sprite(AssetLoader.get(AssetId.BASKET));
        const monster = new Sprite(AssetLoader.get(monsterType));
        this.countText = new Text({
            text: `0 / ${targetLimit}`,
            style: {
                fill: HUD_COLORS.border,
                fontFamily: "Arial, sans-serif",
                fontSize: 14,
                fontWeight: "800",
            },
        });
        this.skillBadge = new TargetSkillBadge({
            ticker,
            cardSize,
        });

        basket.anchor.set(0.5);
        basket.position.set(cardSize / 2, cardSize / 2 + 2);
        fitSprite(basket, cardSize * 0.78);
        basket.alpha = 0.92;

        monster.anchor.set(0.5);
        monster.position.set(cardSize / 2, cardSize / 2 - 1);
        fitSprite(monster, cardSize * 0.5);
        this.countText.anchor.set(0.5);
        this.countText.position.set(cardSize / 2, cardSize + 13);

        this.addChild(
            background,
            this.progressFill,
            basket,
            monster,
            this.skillBadge,
            this.countText
        );
        this.renderProgress(0);
    }

    add(amount, canActivate = true) {
        const { activationCount, value } = this.charge.add(
            amount,
            canActivate
        );

        if (activationCount > 0) {
            this.stopProgressAnimation();
            this.renderProgress(value);
        } else {
            this.animateToTarget();
        }

        return activationCount;
    }

    showSkillFeedback(text) {
        this.skillBadge.showTemporary(text);
    }

    setSkillCountdown(multiplier, seconds) {
        this.skillBadge.setCountdown(multiplier, seconds);
    }

    animateToTarget() {
        if (this.animation) {
            this.stopProgressAnimation();
        }
        const start = this.value;
        const difference = this.charge.value - start;
        if (difference <= 0 || !this.ticker) {
            this.renderProgress(this.charge.value);
            return;
        }

        let elapsed = 0;
        this.animation = (ticker) => {
            elapsed += ticker.deltaMS;
            const progress = Math.min(1, elapsed / 420);
            this.renderProgress(start + difference * (1 - (1 - progress) ** 3));

            if (progress === 1) {
                this.ticker.remove(this.animation);
                this.animation = null;
            }
        };
        this.ticker.add(this.animation);
    }

    stopProgressAnimation() {
        if (!this.animation) {
            return;
        }
        this.ticker?.remove(this.animation);
        this.animation = null;
    }

    renderProgress(value) {
        const inset = 3;
        const innerSize = this.cardSize - inset * 2;
        const fillHeight = innerSize * (value / this.targetLimit);

        this.value = value;
        this.progressFill.clear();
        if (fillHeight > 0) {
            this.progressFill
                .roundRect(
                    inset,
                    this.cardSize - inset - fillHeight,
                    innerSize,
                    fillHeight,
                    Math.min(8, fillHeight / 2)
                )
                .fill({ color: HUD_COLORS.targetFill, alpha: 0.82 });
        }
        this.countText.text = `${Math.floor(value)} / ${this.targetLimit}`;
    }

    destroy(options) {
        this.stopProgressAnimation();
        super.destroy(options);
    }
}
