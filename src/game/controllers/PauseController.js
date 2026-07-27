import { Ticker } from "pixi.js";
import {
    AssetId,
    AssetLoader,
} from "../../services/AssetLoader.js";
import { ImageButton } from "../../ui/components/ImageButton.js";
import { PauseOverlay } from "../../ui/components/PauseOverlay.js";

/**
 * Quan ly pause thu cong, pause khi roi tab va vong doi popup Pause.
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
            // Cat khoang trong suot de icon khong doi size khi hover.
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

        // Khi quay lai tab, popup van cho nguoi choi bam Continue.
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
            // Ticker dung nen hover can yeu cau render truc tiep.
            onVisualChange: () => this.game.app.render(),
        });
        this.game.app.stage.addChild(this.pauseOverlay);
        this.layout();

        // Ve popup truoc khi dung ticker de giao dien khong bi mat.
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
