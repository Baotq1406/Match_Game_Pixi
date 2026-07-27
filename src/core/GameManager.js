import { Container } from "pixi.js";
import { GameConfig } from "../config/GameConfig.js";
import { StartState } from "../states/StartState.js";
import { AssetLoader } from "../services/AssetLoader.js";
import { StateMachine } from "./StateMachine.js";

/**
 * Quan ly vong doi game, root hien thi va state dang hoat dong.
 * Chi cho phep mot instance ton tai trong cung mot thoi diem.
 */
export class GameManager {
    static instance = null;

    static getInstance(app) {
        // Lan khoi tao dau tien bat buoc phai co PixiJS Application.
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
        // Tai tai nguyen truoc khi hien thi main menu.
        this.resize();
        await AssetLoader.load();
        await this.stateMachine.changeState(StartState);
    }

    resize() {
        // Giu ti le thiet ke va can game vao giua man hinh.
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const shortestSide = Math.min(screenWidth, screenHeight);
        const padding = shortestSide * GameConfig.viewportPaddingRatio;
        const availableWidth = Math.max(1, screenWidth - padding * 2);
        const availableHeight = Math.max(1, screenHeight - padding * 2);

        // Dong bo renderer truoc khi state layout de tranh app.screen con kich thuoc cu.
        if (
            this.app.screen.width !== screenWidth ||
            this.app.screen.height !== screenHeight
        ) {
            this.app.renderer.resize(screenWidth, screenHeight);
        }

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
        // Go toan bo listener de singleton co the duoc tao lai an toan.
        window.removeEventListener("resize", this.handleResize);
        this.app.ticker.remove(this.handleTick);
        this.stateMachine.currentState?.exit?.();
        this.stateMachine.currentState?.destroy?.();
        this.stateMachine.currentState = null;
        this.root.destroy({ children: true });
        GameManager.instance = null;
    }
}
