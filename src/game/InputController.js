import { Rectangle } from "pixi.js";

const NEIGHBOR_DISTANCE = 1;

/**
 * Chuyển pointer input thành chuỗi quái liền kề hợp lệ.
 */
export class InputController {
    constructor(board, linkRenderer, { canConnect } = {}) {
        this.board = board;
        this.linkRenderer = linkRenderer;
        // Nếu không có skill cung cấp rule riêng, chỉ cho nối cùng loại.
        this.canConnect =
            canConnect ??
            ((chain, monster) => monster.type === chain[0]?.type);
        this.chain = [];
        this.isDragging = false;
        this.isEnabled = true;

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
        // Không nhận input khi board đang tạo hoặc refill quái.
        if (
            !this.isEnabled ||
            this.board.isBusy ||
            !this.board.isReady
        ) {
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
        if (!this.isEnabled || !this.isDragging) {
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
        // Chuỗi từ ba quái trở lên mới được tính là một lần thu thập.
        if (!this.isEnabled || !this.isDragging) {
            return;
        }

        const monsters = [...this.chain];
        const isValid = monsters.length >= 3;

        this.linkRenderer.clear();
        this.chain = [];
        this.isDragging = false;

        this.board.emit(isValid ? "chainCompleted" : "chainCancelled", {
            monsters,
            reason: "released",
        });
    }

    tryExtendChain(monster) {
        // Quy tắc loại được inject để skill wildcard không làm controller phình to.
        const lastMonster = this.chain[this.chain.length - 1];
        const previousMonster = this.chain[this.chain.length - 2];

        if (monster === lastMonster) {
            return;
        }

        if (monster === previousMonster) {
            // Kéo ngược về quái trước để bỏ quái cuối khỏi chuỗi.
            this.chain.pop();
            return;
        }

        if (
            !this.canConnect(this.chain, monster) ||
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

    setEnabled(isEnabled) {
        this.isEnabled = isEnabled;
        this.board.eventMode = isEnabled ? "static" : "none";

        if (isEnabled || !this.isDragging) {
            return;
        }

        // Hủy chuỗi đang kéo để sau khi resume không thu thập nhầm.
        const monsters = [...this.chain];
        this.linkRenderer.clear();
        this.chain = [];
        this.isDragging = false;
        this.board.emit("chainCancelled", {
            monsters,
            reason: "interrupted",
        });
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
