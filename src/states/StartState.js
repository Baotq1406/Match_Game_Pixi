import { Board } from "../game/Board.js";

export class StartState {
    constructor(game) {
        this.game = game;
        this.board = null;
    }

    async enter() {
        this.board = new Board();

        this.board.position.set(
            (this.game.designWidth - this.board.layoutWidth) / 2,
            (this.game.designHeight - this.board.layoutHeight) / 2
        );

        this.board.on("cellSelected", ({ row, column }) => {
            console.log(`Đã chọn ô [${row}, ${column}]`);
        });

        this.game.root.addChild(this.board);
    }

    exit() {
        if (!this.board) {
            return;
        }

        this.game.root.removeChild(this.board);
        this.board.destroy({ children: true });
        this.board = null;
    }

    destroy() {}
}
