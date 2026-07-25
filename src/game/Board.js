import { Container, Graphics, Rectangle } from "pixi.js";
import { GameConfig } from "../config/GameConfig.js";

export class Board extends Container {
    constructor(config = GameConfig.board) {
        super();

        this.rows = config.rows;
        this.columns = config.columns;
        this.cellSize = config.cellSize;
        this.cells = [];
        this.layoutWidth = this.columns * this.cellSize;
        this.layoutHeight = this.rows * this.cellSize;

        this.createGrid(config);
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
    }

    createCell(row, column, config) {
        const cell = new Container();
        const background = new Graphics();
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

        cell.addChild(background);

        cell.background = background;
        cell.row = row;
        cell.column = column;

        cell.on("pointertap", () => {
            this.emit("cellSelected", {
                row,
                column,
                cell,
            });
        });

        return cell;
    }

    getCell(row, column) {
        return this.cells[row]?.[column] ?? null;
    }

    getCellCenter(row, column) {
        return {
            x: column * this.cellSize + this.cellSize / 2,
            y: row * this.cellSize + this.cellSize / 2,
        };
    }
}
