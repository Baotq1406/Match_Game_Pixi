import { Container } from "pixi.js";
import { GameConfig } from "../config/GameConfig.js";
import { GameplayState } from "../states/GameplayState.js";
import { AssetLoader } from "../services/AssetLoader.js";
import { StateMachine } from "../core/StateMachine.js";

/**
 * Coordinates the game lifecycle, shared display root, and active state.
 * Only one instance is allowed to manage the game at a time.
 */
export class GameManager {
    static instance = null;

    static getInstance(app) {
        if (!GameManager.instance && !app) {
            throw new Error("GameManager cần một PixiJS Application khi khởi tạo.");
        }

        return GameManager.instance ?? new GameManager(app);
    }

    constructor(app) {
        if (GameManager.instance) {
            return GameManager.instance;
        }

        this.app = app;
        this.designWidth = GameConfig.designWidth;
        this.designHeight = GameConfig.designHeight;
        this.root = new Container();
        this.app.stage.addChild(this.root);
        this.stateMachine = new StateMachine(this);
        this.handleResize = () => this.resize();
        this.handleTick = (ticker) => this.stateMachine.update(ticker.deltaMS);

        window.addEventListener("resize", this.handleResize);
        this.app.ticker.add(this.handleTick);
        GameManager.instance = this;
    }

    async start() {
        this.resize();
        await AssetLoader.load();
        await this.stateMachine.changeState(GameplayState);
    }

    resize() {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const shortestSide = Math.min(screenWidth, screenHeight);
        const padding = shortestSide * GameConfig.viewportPaddingRatio;
        const availableWidth = Math.max(1, screenWidth - padding * 2);
        const availableHeight = Math.max(1, screenHeight - padding * 2);
        const scale = Math.min(
            availableWidth / this.designWidth,
            availableHeight / this.designHeight
        );

        this.root.scale.set(scale);
        this.root.position.set(
            (screenWidth - this.designWidth * scale) / 2,
            (screenHeight - this.designHeight * scale) / 2
        );
        this.stateMachine.currentState?.resize?.();
    }

    destroy() {
        window.removeEventListener("resize", this.handleResize);
        this.app.ticker.remove(this.handleTick);
        this.stateMachine.currentState?.exit?.();
        this.stateMachine.currentState?.destroy?.();
        this.stateMachine.currentState = null;
        this.root.destroy({ children: true });
        GameManager.instance = null;
    }
}
