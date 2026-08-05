import { MONSTER_ASSET_IDS } from "../services/AssetLoader.js";

/**
 * Loại bỏ chuỗi đã thu thập, dồn quái xuống và tạo quái mới.
 */
export class BoardRefillService {
    constructor({ board, createMonster, animator, config }) {
        this.board = board;
        this.createMonster = createMonster;
        this.animator = animator;
        this.config = config;
    }

    async resolveChain(chain) {
        // Khóa board trong lúc animation để tránh nhiều refill chồng lên nhau.
        if (this.board.isBusy || !chain?.length) {
            return;
        }

        this.board.isBusy = true;
        const selected = new Set(chain);
        const transitions = [];

        for (let column = 0; column < this.board.columns; column++) {
            // Xử lý từng cột độc lập để tính vị trí rơi.
            const survivors = [];

            for (let row = this.board.rows - 1; row >= 0; row--) {
                const monster = this.board.monsters[row][column];

                if (monster && !selected.has(monster)) {
                    survivors.push(monster);
                }
            }

            const missingCount = this.board.rows - survivors.length;
            const nextColumn = Array(this.board.rows).fill(null);

            survivors.forEach((monster, index) => {
                const targetRow = this.board.rows - 1 - index;
                const startX = monster.x;
                const startY = monster.y;

                monster.row = targetRow;
                monster.column = column;
                nextColumn[targetRow] = monster;
                transitions.push({
                    monster,
                    startX,
                    startY,
                    targetX: column * this.board.cellSize,
                    targetY: targetRow * this.board.cellSize,
                    delay: 0,
                });
            });

            for (let index = 0; index < missingCount; index++) {
                const targetRow = missingCount - 1 - index;
                const monster = this.createMonster(
                    this.getRandomMonsterType(),
                    targetRow,
                    column
                );
                const targetY = targetRow * this.board.cellSize;

                monster.position.set(
                    column * this.board.cellSize,
                    targetY -
                        this.board.cellSize * (missingCount - index)
                );
                monster.visible = false;
                this.board.monsterLayer.addChild(monster);
                nextColumn[targetRow] = monster;
                transitions.push({
                    monster,
                    startX: monster.x,
                    startY: monster.y,
                    targetX: column * this.board.cellSize,
                    targetY,
                    delay:
                        index * (this.config.monsterDropStagger ?? 20),
                });
            }

            for (let row = 0; row < this.board.rows; row++) {
                this.board.monsters[row][column] = nextColumn[row];
                this.board.cells[row][column].monster = nextColumn[row];
            }
        }

        selected.forEach((monster) => {
            // Chỉ hủy quái cũ sau khi ma trận board đã được cập nhật.
            this.board.monsterLayer.removeChild(monster);
            monster.destroy({ children: true });
        });

        await this.animator.animate(transitions);
        // Refill ngẫu nhiên có thể tạo board không còn chuỗi hợp lệ.
        // Xáo lại trước khi mở khóa input để người chơi luôn có nước đi.
        this.board.ensurePlayableBoard(
            this.config.minimumInitialChain
        );
        this.board.isBusy = false;
        this.board.emit("boardRefilled");
    }

    getRandomMonsterType() {
        const randomIndex = Math.floor(Math.random() * MONSTER_ASSET_IDS.length);
        return MONSTER_ASSET_IDS[randomIndex];
    }
}
