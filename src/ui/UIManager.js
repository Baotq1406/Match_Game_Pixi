import { Container } from "pixi.js";
import { layoutHud } from "./HudLayout.js";
import { GameInfoPanel } from "./components/GameInfoPanel.js";
import { TargetPanel } from "./components/TargetPanel.js";

/** Coordinates the game's HUD components. */
export class UIManager extends Container {
    static instance = null;

    static getInstance(options) {
        if (!UIManager.instance && !options?.ticker) {
            throw new Error("UIManager needs a PixiJS ticker when it is created.");
        }
        return UIManager.instance ?? new UIManager(options);
    }

    constructor({ ticker } = {}) {
        super();
        if (UIManager.instance) {
            return UIManager.instance;
        }

        this.infoPanel = new GameInfoPanel();
        this.targetPanel = new TargetPanel({ ticker });
        this.mobileBoardTop = 0;
        this.mobileBoardBottom = 0;
        this.addChild(this.infoPanel, this.targetPanel);
        UIManager.instance = this;
    }

    collect(monsters) {
        return this.targetPanel.collect(monsters);
    }

    setTime(seconds) {
        this.infoPanel.setTime(seconds);
    }

    setScore(score) {
        this.infoPanel.setScore(score);
    }

    setSkillCountdown(monsterType, multiplier, seconds) {
        this.targetPanel.setSkillCountdown(
            monsterType,
            multiplier,
            seconds
        );
    }

    layout(screenWidth, screenHeight, boardBounds) {
        layoutHud(this, screenWidth, screenHeight, boardBounds);
    }

    destroy(options) {
        UIManager.instance = null;
        super.destroy(options);
    }
}
