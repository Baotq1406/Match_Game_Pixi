import { Container, Graphics, Text } from "pixi.js";
import { HUD_COLORS } from "./HudStyles.js";

/**
 * Nút menu dùng chung cho Start và Result scene.
 */
export class MenuButton extends Container {
    constructor({
        label,
        width = 240,
        height = 54,
        fontSize = 18,
        primary = false,
        onPress,
        onVisualChange,
    }) {
        super();

        this.buttonWidth = width;
        this.buttonHeight = height;
        this.primary = primary;
        this.onPress = onPress;
        this.onVisualChange = onVisualChange;
        this.isEnabled = true;
        this.isHovered = false;
        this.background = new Graphics();
        this.label = new Text({
            text: label,
            style: {
                fill: primary ? 0x173b24 : HUD_COLORS.mutedText,
                fontFamily: "Arial, sans-serif",
                fontSize,
                fontWeight: "900",
                letterSpacing: 1,
            },
        });

        this.label.anchor.set(0.5);
        this.label.position.set(width / 2, height / 2);
        this.eventMode = "static";
        this.cursor = "pointer";
        this.addChild(this.background, this.label);
        this.redraw();

        this.on("pointerover", () => this.setHovered(true));
        this.on("pointerout", () => this.setHovered(false));
        this.on("pointertap", () => {
            if (this.isEnabled) {
                this.onPress?.();
            }
        });
    }

    setEnabled(isEnabled) {
        this.isEnabled = isEnabled;
        this.eventMode = isEnabled ? "static" : "none";
        this.cursor = isEnabled ? "pointer" : "default";
        this.alpha = isEnabled ? 1 : 0.55;
        this.setHovered(false);
    }

    setHovered(isHovered) {
        if (!this.isEnabled || this.isHovered === isHovered) {
            return;
        }

        this.isHovered = isHovered;
        this.scale.set(isHovered ? 1.04 : 1);
        this.redraw();
        this.onVisualChange?.();
    }

    redraw() {
        // Nút primary nổi bật hành động chính, nút thứ cấp giữ độ tương phản nhẹ.
        const fillColor = this.primary ? HUD_COLORS.targetFill : HUD_COLORS.panel;
        const fillAlpha = this.isHovered ? 1 : this.primary ? 0.94 : 0.98;

        this.background.clear();

        if (this.primary && this.isHovered) {
            // Glow vàng làm rõ trạng thái có thể bấm của nút hành động chính.
            this.background
                .roundRect(
                    -3,
                    -3,
                    this.buttonWidth + 6,
                    this.buttonHeight + 6,
                    15
                )
                .fill({ color: HUD_COLORS.border, alpha: 0.22 });
        }

        this.background
            .roundRect(0, 0, this.buttonWidth, this.buttonHeight, 12)
            .fill({ color: fillColor, alpha: fillAlpha })
            .stroke({
                color: HUD_COLORS.border,
                width: this.isHovered ? 3 : 2,
            });
    }
}
