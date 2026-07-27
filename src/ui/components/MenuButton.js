import { Container, Graphics, Text } from "pixi.js";
import { HUD_COLORS } from "./HudStyles.js";

/**
 * Nut menu dung chung cho Start va Result scene.
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
        // Nut primary noi bat hanh dong chinh, nut thu cap giu do tuong phan nhe.
        const fillColor = this.primary ? HUD_COLORS.targetFill : HUD_COLORS.panel;
        const fillAlpha = this.isHovered ? 1 : this.primary ? 0.94 : 0.98;

        this.background.clear();

        if (this.primary && this.isHovered) {
            // Glow vang lam ro trang thai co the bam cua nut hanh dong chinh.
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
