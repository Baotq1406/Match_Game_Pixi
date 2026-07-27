import { Container, Graphics, Text } from "pixi.js";
import { MenuButton } from "./MenuButton.js";
import {
    HUD_COLORS,
    createPanel,
    redrawPanel,
} from "./HudStyles.js";

/**
 * Popup pause nằm trên stage và chặn mọi input xuống gameplay.
 */
export class PauseOverlay extends Container {
    constructor({ onContinue, onVisualChange }) {
        super();

        this.panelWidth = 380;
        this.panelHeight = 250;
        this.shade = new Graphics();
        this.panel = createPanel(
            this.panelWidth,
            this.panelHeight,
            22,
            3
        );
        this.title = this.createText("PAUSED", 42, HUD_COLORS.border);
        this.message = this.createText(
            "The game is waiting for you",
            18,
            0xffffff
        );
        this.continueButton = new MenuButton({
            label: "CONTINUE",
            width: 210,
            height: 56,
            primary: true,
            onPress: onContinue,
            onVisualChange,
        });

        // Shade nhận pointer để popup không làm lọt click xuống board.
        this.shade.eventMode = "static";
        this.shade.cursor = "default";
        this.addChild(
            this.shade,
            this.panel,
            this.title,
            this.message,
            this.continueButton
        );
    }

    createText(text, fontSize, fill) {
        const label = new Text({
            text,
            style: {
                fill,
                fontFamily: "Arial, sans-serif",
                fontSize,
                fontWeight: "900",
                align: "center",
                letterSpacing: fontSize > 30 ? 2 : 0.5,
            },
        });

        label.anchor.set(0.5);
        return label;
    }

    layout(screenWidth, screenHeight) {
        const isMobile = screenWidth < 900;
        this.panelWidth = Math.min(
            isMobile ? screenWidth - 28 : 380,
            380
        );
        this.panelHeight = isMobile ? 230 : 250;

        this.shade
            .clear()
            .rect(0, 0, screenWidth, screenHeight)
            .fill({ color: 0x080611, alpha: 0.72 });
        redrawPanel(
            this.panel,
            this.panelWidth,
            this.panelHeight,
            22,
            3
        );

        const left = (screenWidth - this.panelWidth) / 2;
        const top = (screenHeight - this.panelHeight) / 2;
        const centerX = screenWidth / 2;

        this.panel.position.set(left, top);
        this.title.position.set(centerX, top + 58);
        this.message.position.set(centerX, top + 108);

        this.continueButton.scale.set(1);
        this.continueButton.position.set(
            centerX - this.continueButton.buttonWidth / 2,
            top + this.panelHeight - 82
        );
    }
}
