import { Rectangle } from "pixi.js";

const NEIGHBOR_DISTANCE = 1;

export class InputController {
    constructor(board, linkRenderer) {
        this.board = board;
        this.linkRenderer = linkRenderer;
        this.chain = [];
        this.isDragging = false;

        this.board.eventMode = "static";
        this.board.hitArea = new Rectangle(
            0,
            0,
            this.board.layoutWidth,
            this.board.layoutHeight
        );

        this.board.on("pointerdown", this.onPointerDown, this);
        this.board.on("pointermove", this.onPointerMove, this);
        this.board.on("pointerup", this.onPointerUp, this);
        this.board.on("pointerupoutside", this.onPointerUp, this);
    }

    onPointerDown(event) {
        if (this.board.isBusy || !this.board.isReady) {
            return;
        }

        const monster = this.getMonsterAt(event.global);

        if (!monster) {
            return;
        }

        this.isDragging = true;
        this.chain = [monster];
        this.linkRenderer.render(
            this.chain,
            this.toBoardPosition(event.global)
        );
        this.board.emit("chainStarted", {
            monsters: [...this.chain],
        });
    }

    onPointerMove(event) {
        if (!this.isDragging) {
            return;
        }

        const pointerPosition = this.toBoardPosition(event.global);
        const monster = this.getMonsterAt(event.global);

        if (monster) {
            this.tryExtendChain(monster);
        }

        this.linkRenderer.render(this.chain, pointerPosition);
    }

    onPointerUp() {
        if (!this.isDragging) {
            return;
        }

        const monsters = [...this.chain];
        const isValid = monsters.length >= 3;

        this.linkRenderer.clear();
        this.chain = [];
        this.isDragging = false;

        this.board.emit(isValid ? "chainCompleted" : "chainCancelled", {
            monsters,
        });
    }

    tryExtendChain(monster) {
        const lastMonster = this.chain[this.chain.length - 1];
        const previousMonster = this.chain[this.chain.length - 2];

        if (monster === lastMonster) {
            return;
        }

        if (monster === previousMonster) {
            this.chain.pop();
            return;
        }

        if (
            monster.type !== this.chain[0].type ||
            !this.isNeighbor(lastMonster, monster) ||
            this.chain.includes(monster)
        ) {
            return;
        }

        this.chain.push(monster);
    }

    isNeighbor(firstMonster, secondMonster) {
        const rowDistance = Math.abs(firstMonster.row - secondMonster.row);
        const columnDistance = Math.abs(
            firstMonster.column - secondMonster.column
        );

        return (
            rowDistance <= NEIGHBOR_DISTANCE &&
            columnDistance <= NEIGHBOR_DISTANCE &&
            (rowDistance !== 0 || columnDistance !== 0)
        );
    }

    getMonsterAt(globalPosition) {
        const position = this.toBoardPosition(globalPosition);
        const row = Math.floor(position.y / this.board.cellSize);
        const column = Math.floor(position.x / this.board.cellSize);

        if (
            row < 0 ||
            row >= this.board.rows ||
            column < 0 ||
            column >= this.board.columns
        ) {
            return null;
        }

        return this.board.getMonster(row, column);
    }

    toBoardPosition(globalPosition) {
        return this.board.toLocal(globalPosition);
    }

    destroy() {
        this.board.off("pointerdown", this.onPointerDown, this);
        this.board.off("pointermove", this.onPointerMove, this);
        this.board.off("pointerup", this.onPointerUp, this);
        this.board.off("pointerupoutside", this.onPointerUp, this);
        this.linkRenderer.clear();
        this.chain = [];
        this.isDragging = false;
    }
}
