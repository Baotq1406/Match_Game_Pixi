import { Container, Text } from "pixi.js";
import { HUD_COLORS, createPanel } from "./HudStyles.js";

export class MetricPanel extends Container {
    constructor({ label, value, valueColor, width }) {
        super();

        this.background = createPanel(width, 70, 12, 2);
        const labelText = new Text({
            text: label,
            style: {
                fill: HUD_COLORS.mutedText,
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

        labelText.position.set(14, 8);
        this.valueText.position.set(14, 28);
        this.addChild(this.background, labelText, this.valueText);
    }

    setValue(value) {
        this.valueText.text = String(value);
    }
}
