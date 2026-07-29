import { Board } from "../game/Board.js";
import { LinkRenderer } from "../game/LinkRenderer.js";
import { MatchController } from "../game/controllers/MatchController.js";
import { PauseController } from "../game/controllers/PauseController.js";
import { GameplayLayout } from "../game/layout/GameplayLayout.js";
import { UIManager } from "../ui/UIManager.js";
import { GameConfig } from "../config/GameConfig.js";
import { ResultState } from "./ResultState.js";
import { MusicTrack, SoundEffect } from "../services/AudioManager.js";
import { AssetBundle, AssetLoader } from "../services/AssetLoader.js";
import { LoadingScreen } from "../ui/LoadingScreen.js";

function waitForNextFrame() {
    return new Promise((resolve) => requestAnimationFrame(resolve));
}

/**
 * State điều phối vòng đời của một ván chơi.
 * Match, Pause và responsive layout được giao cho các module riêng.
 */
export class GameplayState {
    constructor(game) {
        this.game = game;
        this.board = null;
        this.linkRenderer = null;
        this.hud = null;
        this.matchController = null;
        this.pauseController = null;
        this.layout = null;
        this.timeRemaining = GameConfig.roundDurationSeconds;
        this.isRunning = false;
        this.isGameOver = false;
    }

    async enter() {
        this.game.audioManager.playMusic(MusicTrack.GAME);
        this.createView();
        await this.board.ready;
        this.createControllers();

        this.hud.setTime(this.timeRemaining);
        this.hud.setScore(this.matchController.score);
        this.isRunning = true;
        this.pauseController.initialize();
        this.resize();

        if (document.hidden) {
            this.pauseController.pause();
        }

        // Result chỉ cần sau khi hết ván; tải ngầm trong lúc người chơi đang chơi.
        void AssetLoader.load(AssetBundle.RESULT).catch((error) => {
            console.error("Không thể tải trước tài nguyên kết quả:", error);
        });
    }

    createView() {
        // Tạo board và HUD trước để hiện loading animation và layout đúng.
        this.board = new Board();
        this.board.position.set(
            (this.game.designWidth - this.board.layoutWidth) / 2,
            (this.game.designHeight - this.board.layoutHeight) / 2
        );
        this.game.root.addChild(this.board);

        this.hud = UIManager.getInstance({ ticker: this.game.app.ticker });
        this.game.app.stage.addChild(this.hud);
        this.layout = new GameplayLayout({
            game: this.game,
            board: this.board,
            hud: this.hud,
        });
        this.resize();
    }

    createControllers() {
        this.linkRenderer = new LinkRenderer({
            cellSize: this.board.cellSize,
            config: GameConfig.board,
        });
        this.board.addChild(this.linkRenderer);

        this.matchController = new MatchController({
            board: this.board,
            hud: this.hud,
            linkRenderer: this.linkRenderer,
            audioManager: this.game.audioManager,
            isBlocked: () =>
                this.isGameOver || Boolean(this.pauseController?.isPaused),
            addTime: (seconds) => this.addTime(seconds),
        });
        this.pauseController = new PauseController({
            game: this.game,
            inputController: this.matchController.inputController,
            canPause: () => this.isRunning && !this.isGameOver,
            layout: () => this.layoutPauseUI(),
            onResume: () => this.updateTimeWarningSound(),
        });
    }

    update(deltaMilliseconds) {
        if (!this.isRunning || this.isGameOver || this.pauseController?.isPaused) {
            return;
        }

        this.linkRenderer?.update(deltaMilliseconds);
        this.matchController?.update(deltaMilliseconds);

        // Đồng hồ dùng delta của Pixi ticker để độc lập với FPS.
        this.timeRemaining = Math.max(
            0,
            this.timeRemaining - deltaMilliseconds / 1000
        );
        this.hud.setTime(Math.ceil(this.timeRemaining));
        this.updateTimeWarningSound();

        if (this.timeRemaining === 0) {
            void this.finishGame();
        }
    }

    addTime(seconds) {
        const previousDisplayedTime = Math.ceil(this.timeRemaining);
        this.timeRemaining += seconds;
        const nextDisplayedTime = Math.ceil(this.timeRemaining);

        this.hud.showTimeIncrease(
            previousDisplayedTime,
            nextDisplayedTime - previousDisplayedTime
        );
        this.updateTimeWarningSound();
    }

    async finishGame() {
        this.isGameOver = true;
        this.isRunning = false;
        this.game.audioManager.stopTimeWarning();
        this.game.audioManager.playSoundEffect(SoundEffect.GAME_OVER);

        const needsLoading = !AssetLoader.isLoaded(AssetBundle.RESULT);
        if (needsLoading) {
            LoadingScreen.show("Đang tổng kết điểm...");
        }

        try {
            await AssetLoader.load(AssetBundle.RESULT, (progress) => {
                if (needsLoading) {
                    LoadingScreen.update(progress, "Đang tổng kết điểm...");
                }
            });
            await this.game.stateMachine.changeState(ResultState, {
                score: this.matchController.score,
            });
            await waitForNextFrame();

            if (needsLoading) {
                LoadingScreen.hide();
            }
        } catch (error) {
            console.error("Không thể mở màn hình kết quả:", error);
            LoadingScreen.showError();
        }
    }

    resize() {
        if (!this.layout) {
            return;
        }

        this.layout.resize({
            pauseButton: this.pauseController?.pauseButton,
            pauseOverlay: this.pauseController?.pauseOverlay,
            isPaused: this.pauseController?.isPaused,
        });
    }

    layoutPauseUI() {
        this.layout?.layoutPauseUI(
            this.pauseController?.pauseButton,
            this.pauseController?.pauseOverlay
        );
    }

    updateTimeWarningSound() {
        const isLowTime =
            this.timeRemaining > 0 &&
            this.timeRemaining <= GameConfig.lowTimeWarningSeconds;

        if (isLowTime && !this.pauseController?.isPaused && !this.isGameOver) {
            this.game.audioManager.startTimeWarning();
            return;
        }

        this.game.audioManager.stopTimeWarning();
    }

    exit() {
        if (!this.board) {
            return;
        }

        // Controller phải hủy listener trước khi board và HUD bị destroy.
        this.pauseController?.destroy();
        this.matchController?.destroy();
        this.game.audioManager.stopTimeWarning();
        this.isRunning = false;

        this.pauseController = null;
        this.matchController = null;
        this.linkRenderer = null;
        this.layout = null;

        if (this.hud) {
            this.game.app.stage.removeChild(this.hud);
            this.hud.destroy({ children: true });
            this.hud = null;
        }

        this.game.root.removeChild(this.board);
        this.board.destroy({ children: true });
        this.board = null;
    }

    destroy() {}
}
