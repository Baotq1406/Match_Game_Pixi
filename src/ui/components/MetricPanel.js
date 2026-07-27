import { Container, Text } from "pixi.js";
import { GameConfig } from "../../config/GameConfig.js";
import { HUD_COLORS, createPanel } from "./HudStyles.js";

/**
 * Thanh phan dung chung cho mot chi so co nhan va gia tri.
 */
export class MetricPanel extends Container {
    constructor({ label, value, valueColor, width, ticker }) {
        super();

        this.defaultValueColor = valueColor;
        this.defaultLabelColor = HUD_COLORS.mutedText;
        this.ticker = ticker;
        this.pendingValue = Number(value);
        this.urgencySeconds = Infinity;
        this.increaseFeedback = null;
        this.background = createPanel(width, 70, 12, 2);
        this.labelText = new Text({
            text: label,
            style: {
                fill: this.defaultLabelColor,
                fontFamily: "Arial, sans-serif",
                fontSize: 13,
                fontWeight: "700",
                letterSpacing: 1.5,
            },
        });
        this.valueText = new Text({
            text: value,
            style: {
                fill: valueColor,
                fontFamily: "Arial, sans-serif",
                fontSize: 28,
                fontWeight: "800",
            },
        });

        this.labelText.position.set(14, 8);
        this.valueText.position.set(14, 28);
        this.addChild(this.background, this.labelText, this.valueText);
    }

    setValue(value) {
        this.pendingValue = Number(value);

        // Dong ho van cap nhat gia tri that khi hieu ung cong diem dang chay.
        if (!this.increaseFeedback) {
            this.valueText.text = String(this.pendingValue);
        }
    }

    showIncrease(previousValue, amount) {
        if (amount <= 0) {
            this.setValue(previousValue + amount);
            return;
        }

        const needsTicker = !this.increaseFeedback;
        const activeFeedback = this.increaseFeedback;
        const activeTarget = activeFeedback
            ? activeFeedback.baseValue + activeFeedback.amount
            : null;

        if (activeFeedback && previousValue === activeTarget) {
            // Gop bonus cung mot luot, vi du diem match va Rabbit clear.
            activeFeedback.amount += amount;
            activeFeedback.elapsedMilliseconds = 0;
        } else {
            this.increaseFeedback = {
                baseValue: previousValue,
                amount,
                elapsedMilliseconds: 0,
            };
        }

        this.pendingValue = previousValue + amount;
        this.valueText.text = `${this.increaseFeedback.baseValue} +${this.increaseFeedback.amount}`;
        this.valueText.style.fill = 0x74e79a;
        this.valueText.alpha = 1;
        if (needsTicker) {
            this.ticker?.add(this.updateIncreaseFeedback, this);
        }
    }

    updateIncreaseFeedback(ticker) {
        if (!this.increaseFeedback) {
            return;
        }

        const previewDuration = 380;
        const totalDuration = 650;
        const feedback = this.increaseFeedback;

        feedback.elapsedMilliseconds += ticker.deltaMS;

        if (feedback.elapsedMilliseconds < previewDuration) {
            const pulse =
                1 +
                Math.sin(feedback.elapsedMilliseconds / 55) * 0.06;
            this.valueText.scale.set(pulse);
            return;
        }

        const settleProgress = Math.min(
            1,
            (feedback.elapsedMilliseconds - previewDuration) /
                (totalDuration - previewDuration)
        );
        const settleScale = 1.16 - settleProgress * 0.16;

        this.valueText.text = String(this.pendingValue);
        this.valueText.scale.set(settleScale);
        this.valueText.alpha = 0.82 + settleProgress * 0.18;

        if (settleProgress === 1) {
            this.increaseFeedback = null;
            this.valueText.scale.set(1);
            this.valueText.alpha = 1;
            this.applyUrgencyStyle();
            this.ticker?.remove(this.updateIncreaseFeedback, this);
        }
    }

    setUrgency(seconds) {
        this.urgencySeconds = seconds;

        // Khong de canh bao thoi gian ghi de mau cua bonus dang hien thi.
        if (this.increaseFeedback) {
            return;
        }

        this.applyUrgencyStyle();
    }

    applyUrgencyStyle() {
        const isWarning =
            this.urgencySeconds <= GameConfig.lowTimeWarningSeconds;

        if (!isWarning) {
            this.labelText.style.fill = this.defaultLabelColor;
            this.valueText.style.fill = this.defaultValueColor;
            this.valueText.scale.set(1);
            this.valueText.alpha = 1;
            return;
        }

        const isCritical = this.urgencySeconds <= 10;
        const elapsedSeconds = Date.now() / 1000;
        const frequency = isCritical ? 6 : 3;
        const pulse = (Math.sin(elapsedSeconds * Math.PI * frequency) + 1) / 2;
        const scaleAmount = isCritical ? 0.14 : 0.07;

        // 30 giay cuoi canh bao bang mau do; 10 giay cuoi dap nhanh hon.
        this.labelText.style.fill = 0xff9b9b;
        this.valueText.style.fill = 0xff4f4f;
        this.valueText.scale.set(1 + pulse * scaleAmount);
        this.valueText.alpha = 0.8 + pulse * 0.2;
    }

    destroy(options) {
        this.ticker?.remove(this.updateIncreaseFeedback, this);
        super.destroy(options);
    }
}
