import { Container, Text } from "pixi.js";
import { HUD_COLORS, createPanel } from "./HudStyles.js";

/**
 * Thanh phan dung chung cho mot chi so co nhan va gia tri.
 */
export class MetricPanel extends Container {
    constructor({ label, value, valueColor, width }) {
        super();

        this.defaultValueColor = valueColor;
        this.defaultLabelColor = HUD_COLORS.mutedText;
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
        this.valueText.text = String(value);
    }

    setUrgency(seconds) {
        const isWarning = seconds <= 30;

        if (!isWarning) {
            this.labelText.style.fill = this.defaultLabelColor;
            this.valueText.style.fill = this.defaultValueColor;
            this.valueText.scale.set(1);
            this.valueText.alpha = 1;
            return;
        }

        const isCritical = seconds <= 10;
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
}
