import { Board } from "../game/Board.js";
import { InputController } from "../game/InputController.js";
import { LinkRenderer } from "../game/LinkRenderer.js";
import { UIManager } from "../ui/UIManager.js";
import { GameConfig } from "../config/GameConfig.js";
import { ResultState } from "./ResultState.js";
import { MonsterSkillManager } from "../game/skills/MonsterSkillManager.js";

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
        this.score = 0;
        this.timeRemaining = GameConfig.roundDurationSeconds;
        this.isRunning = false;
        this.isGameOver = false;
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

        this.board.on("chainCompleted", ({ monsters }) => {
            if (this.isGameOver) {
                return;
            }

            // Tinh diem bang buff cu truoc, skill vua nap day ap dung tu sau do.
            const activatedSkills = this.hud.collect(monsters);
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
    }

    update(deltaMilliseconds) {
        if (!this.isRunning || this.isGameOver) {
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

    exit() {
        if (!this.board) {
            return;
        }

        // Skill phai duoc tat truoc khi board va HUD bi huy.
        this.inputController?.destroy();
        this.isRunning = false;
        this.skillManager?.destroy();
        this.skillManager = null;
        this.inputController = null;
        this.linkRenderer = null;
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
    }
}
