import { Board } from "../game/Board.js";
import { InputController } from "../game/InputController.js";
import { LinkRenderer } from "../game/LinkRenderer.js";
import { UIManager } from "../ui/UIManager.js";
import { GameConfig } from "../config/GameConfig.js";
import { ResultState } from "./ResultState.js";
import { MonsterSkillManager } from "../game/skills/MonsterSkillManager.js";
import { ImageButton } from "../ui/components/ImageButton.js";
import { PauseOverlay } from "../ui/components/PauseOverlay.js";
import { AssetId, AssetLoader } from "../services/AssetLoader.js";
import { Ticker } from "pixi.js";

/**
 * Dieu phoi board, HUD, diem, thoi gian va skill trong mot van choi.
 */
export class GameplayState {
    constructor(game) {
        this.game = game;
        this.board = null;
        this.inputController = null;
        this.linkRenderer = null;
        this.hud = null;
        this.skillManager = null;
        this.pauseButton = null;
        this.pauseOverlay = null;
        this.score = 0;
        this.timeRemaining = GameConfig.roundDurationSeconds;
        this.isRunning = false;
        this.isGameOver = false;
        this.isPaused = false;
        this.pausedTickerState = null;
        this.handleVisibilityChange = () =>
            this.onVisibilityChange();
        this.handleWindowBlur = () => this.pause();
    }

    async enter() {
        // Tao board va HUD truoc, sau do moi mo input cho nguoi choi.
        this.board = new Board();

        this.board.position.set(
            (this.game.designWidth - this.board.layoutWidth) / 2,
            (this.game.designHeight - this.board.layoutHeight) / 2
        );

        this.game.root.addChild(this.board);
        this.hud = UIManager.getInstance({ ticker: this.game.app.ticker });
        this.game.app.stage.addChild(this.hud);
        this.resize();
        await this.board.ready;

        this.linkRenderer = new LinkRenderer({
            cellSize: this.board.cellSize,
            config: GameConfig.board,
        });
        this.board.addChild(this.linkRenderer);
        this.skillManager = new MonsterSkillManager({
            // Skill chi giao tiep voi state qua cac callback nay.
            addTime: (seconds) => {
                this.timeRemaining += seconds;
                this.hud.setTime(Math.ceil(this.timeRemaining));
            },
            addScore: (score) => {
                this.score += score;
                this.hud.setScore(this.score);
            },
            setBoardMultiplier: (monsterType, multiplier) => {
                this.board.setMonsterScoreMultiplier(
                    monsterType,
                    multiplier
                );
            },
            setCountdown: (monsterType, multiplier, seconds) => {
                this.hud.setSkillCountdown(
                    monsterType,
                    multiplier,
                    seconds
                );
            },
            setSkillTimer: (monsterType, label, seconds) => {
                this.hud.setSkillTimer(monsterType, label, seconds);
            },
            setMonsterDisplayType: (monsterType, displayType) => {
                this.board.setMonsterDisplayType(
                    monsterType,
                    displayType
                );
            },
            getMonstersByType: (monsterType) =>
                this.board.getMonstersByType(monsterType),
            showFeedback: (monsterType, text) => {
                this.hud.showTargetSkillFeedback(monsterType, text);
            },
        });
        this.inputController = new InputController(
            this.board,
            this.linkRenderer,
            {
                // Input chi hoi rule, khong can biet Owl active hay con bao lau.
                canConnect: (chain, candidate) =>
                    this.skillManager.canConnect(chain, candidate),
            }
        );
        this.pauseButton = new ImageButton({
            normalTexture: AssetLoader.get(AssetId.BUTTON_PAUSE_NORMAL),
            hoverTexture: AssetLoader.get(AssetId.BUTTON_PAUSE_HOVER),
            // Cat khoang trong suot de icon Pause co kich thuoc on dinh khi hover.
            normalFrame: { x: 227, y: 41, width: 1101, height: 886 },
            hoverFrame: { x: 219, y: 39, width: 1116, height: 902 },
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

        this.board.on("chainCompleted", ({ monsters }) => {
            if (this.isGameOver || this.isPaused) {
                return;
            }

            // Owl active van tinh diem, nhung Owl khong duoc nap lai target.
            const targetCollectibleMonsters =
                this.skillManager.getTargetCollectibleMonsters(monsters);
            // Tinh diem bang buff cu truoc, skill vua nap day ap dung tu sau do.
            const activatedSkills = this.hud.collect(
                targetCollectibleMonsters
            );
            this.score +=
                this.skillManager.calculateCollectionScore(monsters);
            // Context dung chung giup cac skill trong mot luot khong xu ly trung.
            const activationContext = {
                claimedMonsters: new Set(),
            };
            // Set loai bo quai trung khi Rabbit clear trung quai trong chuoi goc.
            const monstersToClear = new Set(monsters);
            activatedSkills.forEach((monsterType) => {
                const result = this.skillManager.activate(
                    monsterType,
                    activationContext
                );
                result?.monstersToClear?.forEach((monster) => {
                    monstersToClear.add(monster);
                });
            });

            this.hud.setScore(this.score);
            // Chi refill mot lan de tranh hai animation cung sua board mot luc.
            void this.board.resolveChain([...monstersToClear]);
        });

        this.hud.setTime(this.timeRemaining);
        this.hud.setScore(this.score);
        this.isRunning = true;
        this.resize();

        if (document.hidden) {
            this.pause();
        }
    }

    update(deltaMilliseconds) {
        if (!this.isRunning || this.isGameOver || this.isPaused) {
            return;
        }

        this.skillManager?.update(deltaMilliseconds);

        //Dong ho game dung delta cua Pixi ticker.
        this.timeRemaining = Math.max(
            0,
            this.timeRemaining - deltaMilliseconds / 1000
        );
        this.hud.setTime(Math.ceil(this.timeRemaining));

        if (this.timeRemaining === 0) {
            this.isGameOver = true;
            this.isRunning = false;
            void this.game.stateMachine.changeState(ResultState, {
                score: this.score,
            });
        }
    }

    onVisibilityChange() {
        if (document.hidden) {
            this.pause();
            return;
        }

        // Khi quay lai tab, popup van hien va cho nguoi choi tu tiep tuc.
        if (this.isPaused) {
            this.game.app.render();
        }
    }

    pause() {
        if (
            this.isPaused ||
            !this.isRunning ||
            this.isGameOver ||
            !this.pauseButton
        ) {
            return;
        }

        this.isPaused = true;
        this.inputController?.setEnabled(false);
        this.pauseButton.visible = false;
        this.pauseButton.setEnabled(false);
        this.pauseOverlay = new PauseOverlay({
            onContinue: () => this.resume(),
            // Ticker dang dung, can render ngay khi nut Continue doi trang thai hover.
            onVisualChange: () => this.game.app.render(),
        });
        this.game.app.stage.addChild(this.pauseOverlay);
        this.layoutPauseUI();

        // Ve popup mot lan truoc khi dung ticker de nut Continue van hien.
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

        this.removePauseOverlay();
        this.isPaused = false;
        this.inputController?.setEnabled(true);
        this.pauseButton.visible = true;
        this.pauseButton.setEnabled(true);
        this.layoutPauseUI();
        this.restoreTickers();
    }

    removePauseOverlay() {
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

    exit() {
        if (!this.board) {
            return;
        }

        // Skill phai duoc tat truoc khi board va HUD bi huy.
        document.removeEventListener(
            "visibilitychange",
            this.handleVisibilityChange
        );
        window.removeEventListener("blur", this.handleWindowBlur);
        this.removePauseOverlay();
        this.restoreTickers();
        this.isPaused = false;
        this.inputController?.destroy();
        this.isRunning = false;
        this.skillManager?.destroy();
        this.skillManager = null;
        this.inputController = null;
        this.linkRenderer = null;
        if (this.pauseButton) {
            this.game.app.stage.removeChild(this.pauseButton);
            this.pauseButton.destroy({ children: true });
            this.pauseButton = null;
        }
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

    resize() {
        if (!this.board || !this.hud) {
            return;
        }

        const isMobile = window.innerWidth < 900;
        const isCompact = window.innerWidth < 1500;
        const rootScale = this.game.root.scale.x;
        const rootOffsetY = this.game.root.position.y;
        let displayedBoardScale = 1;

        if (isMobile) {
            // Mobile danh khoang trong giua hai panel cho board.
            this.hud.layout(
                window.innerWidth,
                window.innerHeight,
                this.board.getBounds()
            );

            const boardTop = this.hud.mobileBoardTop;
            const boardBottom = this.hud.mobileBoardBottom;
            const availableHeight = Math.max(
                1,
                boardBottom - boardTop
            );
            const boardScale = Math.min(
                1,
                (window.innerWidth - 24) /
                    (this.board.layoutWidth * rootScale),
                availableHeight /
                    (this.board.layoutHeight * rootScale)
            );
            displayedBoardScale = Math.max(0.5, boardScale);
            const boardX =
                (this.game.designWidth -
                    this.board.layoutWidth * displayedBoardScale) /
                2;
            const boardY = Math.max(
                0,
                (boardTop - rootOffsetY) / rootScale
            );

            this.board.scale.set(displayedBoardScale);
            this.board.position.set(boardX, boardY);
        } else if (isCompact) {
            // Compact dat HUD o tren va co board de vua chieu cao con lai.
            this.hud.layout(
                window.innerWidth,
                window.innerHeight,
                this.board.getBounds()
            );

            const hudHeight =
                this.hud.infoPanel.panelHeight * this.hud.scale.x;
            const boardTop = 12 + hudHeight + 12;
            const availableHeight = Math.max(
                1,
                window.innerHeight - boardTop - 12
            );
            const boardScale = Math.min(
                1,
                (window.innerWidth - 24) /
                    (this.board.layoutWidth * rootScale),
                availableHeight /
                    (this.board.layoutHeight * rootScale)
            );
            displayedBoardScale = Math.max(0.5, Math.min(0.68, boardScale));
            const boardX =
                (this.game.designWidth -
                    this.board.layoutWidth * displayedBoardScale) /
                2;
            const boardY = Math.max(
                0,
                (boardTop - rootOffsetY) / rootScale
            );

            this.board.scale.set(displayedBoardScale);
            this.board.position.set(boardX, boardY);
        } else {
            this.board.scale.set(1);
            this.board.position.set(
                (this.game.designWidth - this.board.layoutWidth) / 2,
                (this.game.designHeight - this.board.layoutHeight) / 2
            );
        }

        this.hud.layout(
            window.innerWidth,
            window.innerHeight,
            this.board.getBounds()
        );
        this.layoutPauseUI();

        // Ticker dang dung khi Pause nen can ve lai mot frame sau resize.
        if (this.isPaused) {
            this.game.app.render();
        }
    }

    layoutPauseUI() {
        if (!this.pauseButton) {
            return;
        }

        // Dung viewport hien tai de khong phu thuoc thu tu resize cua Pixi.
        const width = window.innerWidth;
        const height = window.innerHeight;
        const isMobile = width < GameConfig.mobileBreakpoint;

        if (isMobile && this.hud?.infoPanel) {
            // Bounds da bao gom scale cua HUD, vi vay icon luon nam dung o Pause.
            const infoBounds = this.hud.infoPanel.getBounds();
            const hudScale = this.hud.scale.x;
            const pauseSlotWidth =
                this.hud.infoPanel.mobilePauseSlotWidth * hudScale;
            const pauseSlotLeft =
                infoBounds.x +
                (this.hud.infoPanel.mobileWidth -
                    this.hud.infoPanel.mobilePauseSlotWidth) *
                    hudScale;
            const pauseScale = Math.min(
                1,
                Math.max(0.7, (pauseSlotWidth - 4) / this.pauseButton.buttonWidth)
            );
            const displayedWidth = this.pauseButton.buttonWidth * pauseScale;
            const displayedHeight = this.pauseButton.buttonHeight * pauseScale;

            this.pauseButton.scale.set(pauseScale);
            this.pauseButton.position.set(
                pauseSlotLeft + (pauseSlotWidth - displayedWidth) / 2,
                infoBounds.y +
                    (infoBounds.height - displayedHeight) / 2
            );
        } else {
            const margin = 18;
            // Desktop co nhieu khoang trong nen tang nhe kich thuoc de de nhan ra.
            const desktopPauseScale = 1.5;
            this.pauseButton.scale.set(desktopPauseScale);
            this.pauseButton.position.set(
                width -
                    this.pauseButton.buttonWidth * desktopPauseScale -
                    margin,
                margin
            );
        }

        this.pauseOverlay?.layout(width, height);
    }
}
