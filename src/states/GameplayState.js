import { Board } from "../game/Board.js";
import { InputController } from "../game/InputController.js";
import { LinkRenderer } from "../game/LinkRenderer.js";
import { GameHud } from "../ui/GameHud.js";
import { GameConfig } from "../config/GameConfig.js";

export class GameplayState {
    constructor(game) {
        this.game = game;
        this.board = null;
        this.inputController = null;
        this.linkRenderer = null;
        this.hud = null;
    }

    async enter() {
        this.board = new Board();

        this.board.position.set(
            (this.game.designWidth - this.board.layoutWidth) / 2,
            (this.game.designHeight - this.board.layoutHeight) / 2
        );

        this.game.root.addChild(this.board);
        this.hud = new GameHud();
        this.game.app.stage.addChild(this.hud);
        this.resize();
        await this.board.ready;

        this.linkRenderer = new LinkRenderer({
            cellSize: this.board.cellSize,
            config: GameConfig.board,
        });
        this.board.addChild(this.linkRenderer);
        this.inputController = new InputController(this.board, this.linkRenderer);

        this.board.on("chainCompleted", ({ monsters }) => {
            void this.board.resolveChain(monsters);
        });

    }

    exit() {
        if (!this.board) {
            return;
        }

        this.inputController?.destroy();
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
            const compactScale = Math.min(
                0.9,
                (window.innerWidth - 24) /
                    (this.hud.infoWidth +
                        this.hud.targetPanelWidth +
                        12)
            );
            const hudHeight = this.hud.infoHeight * compactScale;
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
