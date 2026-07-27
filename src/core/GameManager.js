import { Container } from "pixi.js";
import { GameConfig } from "../config/GameConfig.js";
import { StartState } from "../states/StartState.js";
import { AssetLoader } from "../services/AssetLoader.js";
import { AudioManager } from "../services/AudioManager.js";
import { StateMachine } from "./StateMachine.js";

/**
 * Quản lý vòng đời game, root hiển thị và state đang hoạt động.
 * Chỉ cho phép một instance tồn tại trong cùng một thời điểm.
 */
export class GameManager {
    static instance = null;

    static getInstance(app) {
        // Lần khởi tạo đầu tiên bắt buộc phải có PixiJS Application.
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
        this.audioManager = new AudioManager();
        this.handleResize = () => this.resize();
        this.handleTick = (ticker) => this.stateMachine.update(ticker.deltaMS);

        window.addEventListener("resize", this.handleResize);
        this.app.ticker.add(this.handleTick);
        GameManager.instance = this;
    }

    async start() {
        // Tải tài nguyên trước khi hiển thị main menu.
        this.resize();
        await AssetLoader.load();
        await this.stateMachine.changeState(StartState);
    }

    resize() {
        // Giữ tỉ lệ thiết kế và căn game vào giữa màn hình.
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const shortestSide = Math.min(screenWidth, screenHeight);
        const padding = shortestSide * GameConfig.viewportPaddingRatio;
        const availableWidth = Math.max(1, screenWidth - padding * 2);
        const availableHeight = Math.max(1, screenHeight - padding * 2);

        // Đồng bộ renderer trước khi state layout để tránh app.screen còn kích thước cũ.
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
        // Gỡ toàn bộ listener để singleton có thể được tạo lại an toàn.
        window.removeEventListener("resize", this.handleResize);
        this.app.ticker.remove(this.handleTick);
        this.stateMachine.currentState?.exit?.();
        this.stateMachine.currentState?.destroy?.();
        this.stateMachine.currentState = null;
        this.audioManager.destroy();
        this.root.destroy({ children: true });
        GameManager.instance = null;
    }
}
