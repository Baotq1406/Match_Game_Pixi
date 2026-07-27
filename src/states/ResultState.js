import { Container, Sprite, Text } from "pixi.js";
import { GameplayState } from "./GameplayState.js";
import { StartState } from "./StartState.js";
import { ImageButton } from "../ui/components/ImageButton.js";
import { HUD_COLORS } from "../ui/components/HudStyles.js";
import { AssetId, AssetLoader } from "../services/AssetLoader.js";
import { MusicTrack } from "../services/AudioManager.js";
import { GameConfig } from "../config/GameConfig.js";

const POPUP_VISIBLE_BOUNDS = Object.freeze({
    x: 302,
    y: 54,
    width: 948,
    height: 843,
});

/**
 * Hiển thị điểm kết thúc và cho phép retry hoặc quay về main menu.
 */
export class ResultState {
    constructor(game) {
        this.game = game;
        this.view = null;
        this.background = null;
        this.backgroundAssetId = null;
        this.popup = null;
        this.scoreLabel = null;
        this.finalScore = null;
        this.isChangingState = false;
    }

    async enter({ score = 0 } = {}) {
        this.game.audioManager.playMusic(MusicTrack.RESULT);
        this.createBackground();
        this.view = new Container();

        this.popup = new Sprite(AssetLoader.get(AssetId.POPUP_GAME_OVER));
        this.scoreLabel = this.createText("SCORE", 20, HUD_COLORS.mutedText);
        this.finalScore = this.createText(String(score), 52, HUD_COLORS.border);
        const retryButton = new ImageButton({
            normalTexture: AssetLoader.get(AssetId.BUTTON_RETRY_NORMAL),
            hoverTexture: AssetLoader.get(AssetId.BUTTON_RETRY_HOVER),
            normalFrame: { x: 79, y: 40, width: 1173, height: 1016 },
            hoverFrame: { x: 36, y: 79, width: 1193, height: 1068 },
            width: 110,
            height: 96,
            fitMode: "contain",
            onPress: () => void this.changeState(GameplayState),
        });
        const homeButton = new ImageButton({
            normalTexture: AssetLoader.get(AssetId.BUTTON_HOME_NORMAL),
            hoverTexture: AssetLoader.get(AssetId.BUTTON_HOME_HOVER),
            normalFrame: { x: 198, y: 79, width: 1029, height: 901 },
            hoverFrame: { x: 189, y: 52, width: 1164, height: 926 },
            width: 110,
            height: 96,
            fitMode: "contain",
            onPress: () => void this.changeState(StartState),
        });

        this.retryButton = retryButton;
        this.homeButton = homeButton;
        this.view.addChild(
            this.popup,
            this.scoreLabel,
            this.finalScore,
            this.homeButton,
            this.retryButton
        );
        // Result nằm trên stage để layout trực tiếp theo kích thước viewport.
        this.game.app.stage.addChild(this.view);
        this.resize();
    }

    createText(text, fontSize, fill) {
        const label = new Text({
            text,
            style: {
                fill,
                fontFamily: "Arial, sans-serif",
                fontSize,
                fontWeight: "900",
                letterSpacing: fontSize > 30 ? 2 : 0.6,
            },
        });

        label.anchor.set(0.5);
        return label;
    }

    createBackground() {
        const assetId = this.getBackgroundAssetId();
        this.background = new Sprite(AssetLoader.get(assetId));
        this.backgroundAssetId = assetId;
        this.background.eventMode = "none";
        this.game.app.stage.addChildAt(this.background, 0);
    }

    getBackgroundAssetId() {
        const { width, height } = this.game.app.screen;
        const isPhonePortrait =
            width < GameConfig.mobileBreakpoint && height > width;

        return isPhonePortrait
            ? AssetId.BACKGROUND_GAME_OVER_MOBILE
            : AssetId.BACKGROUND_GAME_OVER;
    }

    resize() {
        if (!this.background || !this.view) {
            return;
        }

        this.layoutBackground();
        this.layoutResult();
        // Canvas Pixi có thể resize ở frame tiếp theo khi browser zoom.
        requestAnimationFrame(() => {
            this.layoutBackground();
            this.layoutResult();
        });
    }

    layoutBackground() {
        const assetId = this.getBackgroundAssetId();
        if (assetId !== this.backgroundAssetId) {
            this.background.texture = AssetLoader.get(assetId);
            this.backgroundAssetId = assetId;
        }

        const { width, height } = this.game.app.screen;
        const texture = this.background.texture;
        const scale = Math.max(
            width / texture.width,
            height / texture.height
        );

        // Cover giữ đúng tỉ lệ ảnh và cắt đều phần dư ở hai cạnh.
        this.background.scale.set(scale);
        this.background.position.set(
            (width - texture.width * scale) / 2,
            (height - texture.height * scale) / 2
        );
    }

    layoutResult() {
        if (!this.popup) {
            return;
        }

        const { width, height } = this.game.app.screen;
        const isPhonePortrait =
            width < GameConfig.mobileBreakpoint && height > width;
        const maxVisibleWidth = isPhonePortrait
            ? width * 0.94
            : Math.min(width * 0.68, 720);
        const maxVisibleHeight = height * (isPhonePortrait ? 0.58 : 0.82);
        const popupScale = Math.min(
            maxVisibleWidth / POPUP_VISIBLE_BOUNDS.width,
            maxVisibleHeight / POPUP_VISIBLE_BOUNDS.height
        );
        const visibleWidth = POPUP_VISIBLE_BOUNDS.width * popupScale;
        const visibleHeight = POPUP_VISIBLE_BOUNDS.height * popupScale;
        const visibleLeft = (width - visibleWidth) / 2;
        const visibleTop = (height - visibleHeight) / 2;
        const centerX = width / 2;

        this.popup.scale.set(popupScale);
        this.popup.position.set(
            visibleLeft - POPUP_VISIBLE_BOUNDS.x * popupScale,
            visibleTop - POPUP_VISIBLE_BOUNDS.y * popupScale
        );

        const contentScale = isPhonePortrait ? 0.78 : 1;
        this.scoreLabel.scale.set(contentScale);
        this.finalScore.scale.set(contentScale);
        this.scoreLabel.position.set(
            centerX,
            visibleTop + visibleHeight * 0.49
        );
        this.finalScore.position.set(
            centerX,
            visibleTop + visibleHeight * 0.59
        );

        const gap = isPhonePortrait ? 12 : 18;
        const availableButtonWidth = (visibleWidth - gap - 28) / 2;
        const buttonScale = Math.min(
            isPhonePortrait ? 0.82 : 1,
            availableButtonWidth / this.retryButton.buttonWidth
        );
        const displayedButtonWidth =
            this.retryButton.buttonWidth * buttonScale;
        const buttonsWidth = displayedButtonWidth * 2 + gap;
        const buttonY = visibleTop + visibleHeight * 0.73;

        this.homeButton.scale.set(buttonScale);
        this.retryButton.scale.set(buttonScale);
        this.homeButton.position.set(
            centerX - buttonsWidth / 2,
            buttonY
        );
        this.retryButton.position.set(
            centerX - buttonsWidth / 2 + displayedButtonWidth + gap,
            buttonY
        );
    }

    async changeState(StateClass) {
        if (this.isChangingState) {
            return;
        }

        // Khóa cả hai nút trong lúc state machine đang dọn dẹp màn cũ.
        this.isChangingState = true;
        this.retryButton.setEnabled(false);
        this.homeButton.setEnabled(false);
        await this.game.stateMachine.changeState(StateClass);
    }

    exit() {
        if (!this.view) {
            return;
        }

        this.game.app.stage.removeChild(this.view);
        this.view.destroy({ children: true });
        this.view = null;
        this.popup = null;
        this.scoreLabel = null;
        this.finalScore = null;
        this.retryButton = null;
        this.homeButton = null;

        if (this.background) {
            this.game.app.stage.removeChild(this.background);
            this.background.destroy();
            this.background = null;
            this.backgroundAssetId = null;
        }
    }

    destroy() {}
}
