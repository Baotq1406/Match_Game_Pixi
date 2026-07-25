import { Board } from "../game/Board.js";
import { InputController } from "../game/InputController.js";
import { LinkRenderer } from "../game/LinkRenderer.js";
import { GameConfig } from "../config/GameConfig.js";

export class GameplayState {
    constructor(game) {
        this.game = game;
        this.board = null;
        this.inputController = null;
        this.linkRenderer = null;
    }

    async enter() {
        this.board = new Board();

        this.board.position.set(
            (this.game.designWidth - this.board.layoutWidth) / 2,
            (this.game.designHeight - this.board.layoutHeight) / 2
        );

        this.linkRenderer = new LinkRenderer({
            cellSize: this.board.cellSize,
            config: GameConfig.board,
        });
        this.board.addChild(this.linkRenderer);
        this.inputController = new InputController(this.board, this.linkRenderer);

        this.board.on("chainCompleted", ({ monsters }) => {
            console.log(`Link ${monsters.length}`, monsters[0].type);
        });

        this.game.root.addChild(this.board);
    }

    exit() {
        if (!this.board) {
            return;
        }

        this.inputController?.destroy();
        this.inputController = null;
        this.linkRenderer = null;
        this.game.root.removeChild(this.board);
        this.board.destroy({ children: true });
        this.board = null;
    }

    destroy() {}
}
