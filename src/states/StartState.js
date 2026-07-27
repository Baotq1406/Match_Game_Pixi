import { Container, Graphics, Sprite, Text } from "pixi.js";
import { GameplayState } from "./GameplayState.js";
import { ImageButton } from "../ui/components/ImageButton.js";
import { MenuButton } from "../ui/components/MenuButton.js";
import { HUD_COLORS, createPanel } from "../ui/components/HudStyles.js";
import { AssetId, AssetLoader } from "../services/AssetLoader.js";
import { MusicTrack } from "../services/AudioManager.js";
import { GameConfig } from "../config/GameConfig.js";

/**
 * Main menu hien thi nut Start va huong dan bang asset co san.
 */
export class StartState {
    constructor(game) {
        this.game = game;
        this.view = null;
        this.background = null;
        this.backgroundAssetId = null;
        this.guide = null;
        this.isChangingState = false;
    }

    async enter() {
        this.game.audioManager.playMusic(MusicTrack.GAME);
        this.createBackground();
        this.view = new Container();

        const startButton = new ImageButton({
            normalTexture: AssetLoader.get(AssetId.BUTTON_START_NORMAL),
            hoverTexture: AssetLoader.get(AssetId.BUTTON_START_HOVER),
            width: 300,
            onPress: () => void this.startGame(),
        });
        const guideButton = new ImageButton({
            normalTexture: AssetLoader.get(AssetId.BUTTON_GUIDE_NORMAL),
            hoverTexture: AssetLoader.get(AssetId.BUTTON_GUIDE_HOVER),
            // Cat vien trong suot cua hai file de icon sach co cung kich thuoc.
            normalFrame: { x: 557, y: 109, width: 658, height: 655 },
            hoverFrame: { x: 162, y: 148, width: 928, height: 916 },
            width: 92,
            height: 92,
            onPress: () => this.showGuide(),
        });

        startButton.position.set(
            (this.game.designWidth - startButton.buttonWidth) / 2,
            470
        );

        this.startButton = startButton;
        this.guideButton = guideButton;
        this.layoutControls();
        this.view.addChild(startButton);
        // Nut guide nam tren stage de bam sat goc viewport, khong bi scale theo root vuong.
        this.game.app.stage.addChild(guideButton);
        this.game.root.addChild(this.view);
    }

    createBackground() {
        const assetId = this.getBackgroundAssetId();
        this.background = new Sprite(
            AssetLoader.get(assetId)
        );
        this.backgroundAssetId = assetId;
        this.background.eventMode = "none";
        // Background nam tren stage nen co the phu het viewport ma khong sua ti le board.
        this.game.app.stage.addChildAt(this.background, 0);
        this.resize();
    }

    resize() {
        if (!this.background) {
            return;
        }

        this.layoutBackground();
        this.layoutControls();
        // Pixi resize canvas o frame ke tiep, nen can layout lai sau khi zoom/resize.
        requestAnimationFrame(() => {
            this.layoutBackground();
            this.layoutControls();
        });
    }

    layoutBackground() {
        if (!this.background) {
            return;
        }

        const assetId = this.getBackgroundAssetId();
        if (this.backgroundAssetId !== assetId) {
            this.background.texture = AssetLoader.get(assetId);
            this.backgroundAssetId = assetId;
        }

        // Stretch nen theo canvas de khong con vien trong o man hinh ngang hoac doc.
        this.background.position.set(0, 0);
        this.background.width = this.game.app.screen.width;
        this.background.height = this.game.app.screen.height;
    }

    getBackgroundAssetId() {
        const { width, height } = this.game.app.screen;
        const isPhonePortrait =
            width < GameConfig.mobileBreakpoint && height > width;

        // Anh Android chi dung cho man hinh doc de khong bi keo ngang o landscape.
        return isPhonePortrait
            ? AssetId.BACKGROUND_GAME_START_MOBILE
            : AssetId.BACKGROUND_GAME_START;
    }

    layoutControls() {
        if (!this.guideButton) {
            return;
        }

        const { width, height } = this.game.app.screen;
        const isPhonePortrait =
            width < GameConfig.mobileBreakpoint && height > width;
        const guideScale = isPhonePortrait ? 0.72 : 1;
        const guideWidth = this.guideButton.buttonWidth * guideScale;
        const guideHeight = this.guideButton.buttonHeight * guideScale;
        const margin = isPhonePortrait ? 18 : 24;
        const guideY = isPhonePortrait
            ? height - guideHeight - margin
            : margin;

        // Toa do stage dung pixel viewport, nen icon luon sat goc man hinh.
        this.guideButton.scale.set(guideScale);
        this.guideButton.position.set(
            width - guideWidth - margin,
            guideY
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
                letterSpacing: fontSize > 20 ? 2 : 0.8,
                align: "center",
            },
        });

        label.anchor.set(0.5);
        return label;
    }

    async startGame() {
        if (this.isChangingState) {
            return;
        }

        // Khoa nut de tranh double click tao hai GameplayState cung luc.
        this.isChangingState = true;
        this.startButton.setEnabled(false);
        this.guideButton.setEnabled(false);
        await this.game.stateMachine.changeState(GameplayState);
    }

    showGuide() {
        if (this.guide) {
            return;
        }

        const overlay = new Container();
        const shade = new Graphics()
            .rect(0, 0, this.game.designWidth, this.game.designHeight)
            .fill({ color: 0x000000, alpha: 0.58 });
        const panelWidth = 470;
        const panelHeight = 390;
        const panel = createPanel(panelWidth, panelHeight, 20, 3);
        const title = this.createText("HOW TO PLAY", 28, HUD_COLORS.border);
        const content = new Text({
            text:
                "1. Link at least 3 matching monsters.\n\n" +
                "2. Fill a target to activate its skill.\n\n" +
                "3. CAT adds time, PIG adds points.\n" +
                "SHEEP x2, RABBIT clears, OWL is a wildcard.",
            style: {
                fill: 0xffffff,
                fontFamily: "Arial, sans-serif",
                fontSize: 18,
                fontWeight: "600",
                lineHeight: 29,
            },
        });
        const closeButton = new MenuButton({
            label: "CLOSE",
            width: 170,
            height: 48,
            onPress: () => this.closeGuide(),
        });

        // Chan click xuong cac nut menu khi popup dang mo.
        shade.eventMode = "static";
        shade.cursor = "default";

        panel.position.set(
            (this.game.designWidth - panelWidth) / 2,
            (this.game.designHeight - panelHeight) / 2
        );
        title.position.set(this.game.designWidth / 2, 205);
        content.position.set(145, 255);
        closeButton.position.set(
            (this.game.designWidth - closeButton.buttonWidth) / 2,
            455
        );

        overlay.addChild(shade, panel, title, content, closeButton);
        this.guide = overlay;
        // An nut guide tren stage de popup nhan click dung thu tu uu tien.
        this.guideButton.visible = false;
        this.view.addChild(overlay);
    }

    closeGuide() {
        if (!this.guide) {
            return;
        }

        this.view.removeChild(this.guide);
        this.guide.destroy({ children: true });
        this.guide = null;
        this.guideButton.visible = true;
    }

    exit() {
        if (!this.view) {
            return;
        }

        this.game.root.removeChild(this.view);
        this.view.destroy({ children: true });
        this.view = null;
        this.startButton = null;

        if (this.guideButton) {
            this.game.app.stage.removeChild(this.guideButton);
            this.guideButton.destroy({ children: true });
        }

        this.guideButton = null;
        this.guide = null;

        if (this.background) {
            this.game.app.stage.removeChild(this.background);
            this.background.destroy();
            this.background = null;
            this.backgroundAssetId = null;
        }
    }

    destroy() {}
}
