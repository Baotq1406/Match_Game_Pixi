import { Container, Graphics, Rectangle } from "pixi.js";
import { GameConfig } from "../config/GameConfig.js";
import {
    AssetLoader,
    MONSTER_ASSET_IDS,
} from "../services/AssetLoader.js";
import { Monster } from "./Monster.js";
import { MonsterDropAnimator } from "./MonsterDropAnimator.js";
import { BoardRefillService } from "./BoardRefillService.js";

const NEIGHBOR_DIRECTIONS = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
];

export class Board extends Container {
    constructor(config = GameConfig.board) {
        super();

        this.rows = config.rows;
        this.columns = config.columns;
        this.cellSize = config.cellSize;
        this.cells = [];
        this.monsters = [];
        this.monsterScoreMultipliers = new Map();
        this.layoutWidth = this.columns * this.cellSize;
        this.layoutHeight = this.rows * this.cellSize;
        this.config = config;
        this.isReady = false;
        this.isBusy = true;
        this.animator = new MonsterDropAnimator({
            cellSize: this.cellSize,
            config,
        });
        this.refillService = new BoardRefillService({
            board: this,
            createMonster: (type, row, column) =>
                this.createMonster(type, row, column),
            animator: this.animator,
            config,
        });

        this.createGrid(config);
        this.ready = this.createInitialMonsters(config);
    }

    createGrid(config) {
        this.gridLayer = new Container();
        this.addChild(this.gridLayer);

        for (let row = 0; row < this.rows; row++) {
            this.cells[row] = [];

            for (let column = 0; column < this.columns; column++) {
                const cell = this.createCell(row, column, config);

                this.gridLayer.addChild(cell);
                this.cells[row][column] = cell;
            }
        }

        this.monsterLayer = new Container();
        this.addChild(this.monsterLayer);
    }

    createCell(row, column, config) {
        const cell = new Container();
        const background = new Graphics();
        const hoverGlow = new Graphics();
        const inset = config.cellGap / 2;
        const backgroundSize = this.cellSize - config.cellGap;

        cell.position.set(
            column * this.cellSize,
            row * this.cellSize
        );

        cell.hitArea = new Rectangle(0, 0, this.cellSize, this.cellSize);
        cell.eventMode = "static";
        cell.cursor = "pointer";

        background
            .roundRect(
                inset,
                inset,
                backgroundSize,
                backgroundSize,
                config.cellBorderRadius
            )
            .fill({
                color: config.cellBackgroundColor,
                alpha: config.cellBackgroundAlpha,
            })
            .stroke({
                color: config.cellBorderColor,
                width: config.cellBorderWidth,
                alpha: 1,
            });

        hoverGlow
            .roundRect(
                inset,
                inset,
                backgroundSize,
                backgroundSize,
                config.cellBorderRadius
            )
            .stroke({
                color: config.cellHoverGlowColor,
                width: config.cellHoverGlowWidth,
                alpha: config.cellHoverGlowAlpha,
            })
            .roundRect(
                inset + 1,
                inset + 1,
                backgroundSize - 2,
                backgroundSize - 2,
                Math.max(0, config.cellBorderRadius - 1)
            )
            .stroke({
                color: 0xffffff,
                width: 1,
                alpha: 0.9,
            });

        hoverGlow.visible = false;

        cell.addChild(background);
        cell.addChild(hoverGlow);

        cell.background = background;
        cell.hoverGlow = hoverGlow;
        cell.row = row;
        cell.column = column;
        cell.monster = null;

        cell.on("pointertap", () => {
            this.emit("cellSelected", {
                row,
                column,
                cell,
                monster: cell.monster,
            });
        });

        cell.on("pointerover", () => {
            hoverGlow.visible = true;
        });

        cell.on("pointerout", () => {
            hoverGlow.visible = false;
        });

        return cell;
    }

    createInitialMonsters(config) {
        const typeGrid = this.createPlayableTypeGrid(
            MONSTER_ASSET_IDS,
            config.minimumInitialChain
        );

        for (let row = 0; row < this.rows; row++) {
            this.monsters[row] = [];

            for (let column = 0; column < this.columns; column++) {
                const type = typeGrid[row][column];
                const monster = this.createMonster(type, row, column);

                this.monsterLayer.addChild(monster);
                this.monsters[row][column] = monster;
                this.cells[row][column].monster = monster;
            }
        }

        const animation = this.animator.animateInitial(this.monsters.flat());
        return animation.then(() => {
            this.isReady = true;
            this.isBusy = false;
        });
    }

    createMonster(type, row, column) {
        const monster = new Monster({
            type,
            texture: AssetLoader.get(type),
            row,
            column,
            cellSize: this.cellSize,
            sizeRatio: this.config.monsterSizeRatio,
        });

        monster.setScoreMultiplier(
            this.monsterScoreMultipliers.get(type) ?? 1
        );
        return monster;
    }

    setMonsterScoreMultiplier(monsterType, multiplier) {
        if (multiplier > 1) {
            this.monsterScoreMultipliers.set(monsterType, multiplier);
        } else {
            this.monsterScoreMultipliers.delete(monsterType);
        }

        this.monsters.flat().forEach((monster) => {
            if (monster?.type === monsterType) {
                monster.setScoreMultiplier(multiplier);
            }
        });
    }
    resolveChain(chain) {
        return this.refillService.resolveChain(chain);
    }

    createPlayableTypeGrid(types, minimumChainLength) {
        const maximumAttempts = 100;

        for (let attempt = 0; attempt < maximumAttempts; attempt++) {
            const grid = this.createBalancedTypeGrid(types);

            if (this.hasAvailableChain(grid, minimumChainLength)) {
                return grid;
            }
        }

        throw new Error("Unable to create a playable monster board.");
    }

    createBalancedTypeGrid(types) {
        const monsterCount = this.rows * this.columns;
        const deck = Array.from(
            { length: monsterCount },
            (_, index) => types[index % types.length]
        );

        for (let index = deck.length - 1; index > 0; index--) {
            const randomIndex = Math.floor(Math.random() * (index + 1));
            [deck[index], deck[randomIndex]] = [
                deck[randomIndex],
                deck[index],
            ];
        }

        return Array.from(
            { length: this.rows },
            (_, row) =>
                deck.slice(
                    row * this.columns,
                    (row + 1) * this.columns
                )
        );
    }

    hasAvailableChain(typeGrid, minimumChainLength) {
        const visited = new Set();

        for (let row = 0; row < this.rows; row++) {
            for (let column = 0; column < this.columns; column++) {
                const startKey = `${row}:${column}`;

                if (visited.has(startKey)) {
                    continue;
                }

                const type = typeGrid[row][column];
                const queue = [[row, column]];
                let groupSize = 0;

                visited.add(startKey);

                while (queue.length > 0) {
                    const [currentRow, currentColumn] = queue.shift();
                    groupSize++;

                    for (const [rowOffset, columnOffset] of NEIGHBOR_DIRECTIONS) {
                        const nextRow = currentRow + rowOffset;
                        const nextColumn = currentColumn + columnOffset;

                        if (
                            nextRow < 0 ||
                            nextRow >= this.rows ||
                            nextColumn < 0 ||
                            nextColumn >= this.columns ||
                            typeGrid[nextRow][nextColumn] !== type
                        ) {
                            continue;
                        }

                        const nextKey = `${nextRow}:${nextColumn}`;

                        if (visited.has(nextKey)) {
                            continue;
                        }

                        visited.add(nextKey);
                        queue.push([nextRow, nextColumn]);
                    }
                }

                if (groupSize >= minimumChainLength) {
                    return true;
                }
            }
        }

        return false;
    }

    getCell(row, column) {
        return this.cells[row]?.[column] ?? null;
    }

    getMonster(row, column) {
        return this.monsters[row]?.[column] ?? null;
    }

    getCellCenter(row, column) {
        return {
            x: column * this.cellSize + this.cellSize / 2,
            y: row * this.cellSize + this.cellSize / 2,
        };
    }

    destroy(options) {
        this.animator.destroy();
        super.destroy(options);
    }
}
