import { Ticker } from "pixi.js";
import {
    AssetId,
    AssetLoader,
} from "../../services/AssetLoader.js";
import { ImageButton } from "../../ui/components/ImageButton.js";
import { PauseOverlay } from "../../ui/components/PauseOverlay.js";

/**
 * Quản lý pause thủ công, pause khi rời tab và vòng đời popup Pause.
 */
export class PauseController {
    constructor({
        game,
        inputController,
        canPause,
        layout,
        onResume,
    }) {
        this.game = game;
        this.inputController = inputController;
        this.canPause = canPause;
        this.layout = layout;
        this.onResume = onResume;
        this.isPaused = false;
        this.pauseButton = null;
        this.pauseOverlay = null;
        this.pausedTickerState = null;

        this.handleVisibilityChange =
            this.handleVisibilityChange.bind(this);
        this.handleWindowBlur = () => this.pause();
    }

    initialize() {
        this.pauseButton = new ImageButton({
            normalTexture: AssetLoader.get(
                AssetId.BUTTON_PAUSE_NORMAL
            ),
            hoverTexture: AssetLoader.get(
                AssetId.BUTTON_PAUSE_HOVER
            ),
            // Cắt khoảng trong suốt để icon không đổi size khi hover.
            normalFrame: {
                x: 227,
                y: 41,
                width: 1101,
                height: 886,
            },
            hoverFrame: {
                x: 219,
                y: 39,
                width: 1116,
                height: 902,
            },
            width: 40,
            height: 34,
            fitMode: "contain",
            onPress: () => this.pause(),
        });
        this.game.app.stage.addChild(this.pauseButton);
        document.addEventListener(
            "visibilitychange",
            this.handleVisibilityChange
        );
        window.addEventListener("blur", this.handleWindowBlur);
        this.layout();
    }

    handleVisibilityChange() {
        if (document.hidden) {
            this.pause();
            return;
        }

        // Khi quay lại tab, popup vẫn cho người chơi bấm Continue.
        if (this.isPaused) {
            this.game.app.render();
        }
    }

    pause() {
        if (
            this.isPaused ||
            !this.canPause() ||
            !this.pauseButton
        ) {
            return;
        }

        this.isPaused = true;
        this.game.audioManager.stopTimeWarning();
        this.inputController.setEnabled(false);
        this.pauseButton.visible = false;
        this.pauseButton.setEnabled(false);
        this.pauseOverlay = new PauseOverlay({
            onContinue: () => this.resume(),
            // Ticker dừng nên hover cần yêu cầu render trực tiếp.
            onVisualChange: () => this.game.app.render(),
        });
        this.game.app.stage.addChild(this.pauseOverlay);
        this.layout();

        // Vẽ popup trước khi dừng ticker để giao diện không bị mất.
        this.game.app.render();
        this.pausedTickerState = {
            app: this.game.app.ticker.started,
            shared: Ticker.shared.started,
        };
        this.game.app.ticker.stop();
        Ticker.shared.stop();
    }

    resume() {
        if (!this.isPaused) {
            return;
        }

        this.removeOverlay();
        this.isPaused = false;
        this.inputController.setEnabled(true);
        this.pauseButton.visible = true;
        this.pauseButton.setEnabled(true);
        this.layout();
        this.onResume();
        this.restoreTickers();
    }

    removeOverlay() {
        if (!this.pauseOverlay) {
            return;
        }

        this.game.app.stage.removeChild(this.pauseOverlay);
        this.pauseOverlay.destroy({ children: true });
        this.pauseOverlay = null;
    }

    restoreTickers() {
        if (this.pausedTickerState?.shared) {
            Ticker.shared.start();
        }
        if (this.pausedTickerState?.app) {
            this.game.app.ticker.start();
        }
        this.pausedTickerState = null;
    }

    destroy() {
        document.removeEventListener(
            "visibilitychange",
            this.handleVisibilityChange
        );
        window.removeEventListener("blur", this.handleWindowBlur);
        this.removeOverlay();
        this.restoreTickers();
        this.inputController.setEnabled(false);
        this.isPaused = false;

        if (this.pauseButton) {
            this.game.app.stage.removeChild(this.pauseButton);
            this.pauseButton.destroy({ children: true });
            this.pauseButton = null;
        }
    }
}
