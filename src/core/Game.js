import { Container } from "pixi.js";
import { StateMachine } from "../core/StateMachine.js";
import { GameplayState } from "../states/GameplayState.js";
import { StartState } from "../states/StartState.js";
import { GameConfig } from "../config/GameConfig.js";

export class Game {
    constructor(app) {
        this.app = app;

        this.designWidth = GameConfig.designWidth;
        this.designHeight = GameConfig.designHeight;

        this.root = new Container();
        this.app.stage.addChild(this.root);

        this.stateMachine = new StateMachine(this);

        window.addEventListener("resize", () => {
            this.resize();
        });
    }

    async start() {
        this.resize();
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
    }
}
