import { Container, Rectangle, Sprite } from "pixi.js";

/**
 * Nut tu asset anh voi texture thuong va texture khi re chuot.
 */
export class ImageButton extends Container {
    constructor({
        normalTexture,
        hoverTexture,
        width,
        height,
        normalFrame,
        hoverFrame,
        onPress,
    }) {
        super();

        this.buttonWidth = width;
        this.normalTexture = normalTexture;
        this.hoverTexture = hoverTexture;
        this.normalFrame = normalFrame;
        this.hoverFrame = hoverFrame;
        this.onPress = onPress;
        this.isEnabled = true;
        this.isHovered = false;
        this.sprite = new Sprite(normalTexture);

        const visibleSize = normalFrame ?? normalTexture;
        const aspectRatio = visibleSize.width / visibleSize.height;
        this.buttonHeight = height ?? width / aspectRatio;
        this.applyTexture(this.normalTexture, this.normalFrame);
        this.hitArea = new Rectangle(0, 0, this.buttonWidth, this.buttonHeight);
        this.eventMode = "static";
        this.cursor = "pointer";
        this.addChild(this.sprite);

        this.on("pointerover", () => this.setHovered(true));
        this.on("pointerout", () => this.setHovered(false));
        this.on("pointertap", () => {
            if (this.isEnabled) {
                this.onPress?.();
            }
        });
    }

    applyTexture(texture, visibleFrame) {
        this.sprite.texture = texture;

        if (!visibleFrame) {
            this.sprite.position.set(0, 0);
            this.sprite.width = this.buttonWidth;
            this.sprite.height = this.buttonHeight;
            return;
        }

        // Asset guide co canvas trong suot lon. Scale theo phan icon thuc te.
        const scaleX = this.buttonWidth / visibleFrame.width;
        const scaleY = this.buttonHeight / visibleFrame.height;
        this.sprite.width = texture.width * scaleX;
        this.sprite.height = texture.height * scaleY;
        this.sprite.position.set(
            -visibleFrame.x * scaleX,
            -visibleFrame.y * scaleY
        );
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
        // Doi dung texture hover de giu hieu ung glow do asset da thiet ke.
        this.applyTexture(
            isHovered ? this.hoverTexture : this.normalTexture,
            isHovered ? this.hoverFrame : this.normalFrame
        );
    }
}
