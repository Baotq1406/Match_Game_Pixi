import { Container } from "pixi.js";
import { layoutHud } from "./HudLayout.js";
import { GameInfoPanel } from "./components/GameInfoPanel.js";
import { TargetPanel } from "./components/TargetPanel.js";

/**
 * Singleton dieu phoi cac thanh phan HUD va bo cuc responsive.
 */
export class UIManager extends Container {
    static instance = null;

    static getInstance(options) {
        // Ticker chi can truyen vao khi tao instance dau tien.
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

        this.infoPanel = new GameInfoPanel({ ticker });
        this.targetPanel = new TargetPanel({ ticker });
        this.mobileBoardTop = 0;
        this.mobileBoardBottom = 0;
        this.addChild(this.infoPanel, this.targetPanel);
        UIManager.instance = this;
    }

    collect(monsters) {
        // Tra ve danh sach skill vua duoc kich hoat sau lan thu thap.
        return this.targetPanel.collect(monsters);
    }

    setTime(seconds) {
        this.infoPanel.setTime(seconds);
    }

    setScore(score) {
        this.infoPanel.setScore(score);
    }

    showTimeIncrease(previousValue, amount) {
        this.infoPanel.showTimeIncrease(previousValue, amount);
    }

    showScoreIncrease(previousValue, amount) {
        this.infoPanel.showScoreIncrease(previousValue, amount);
    }

    setSkillCountdown(monsterType, multiplier, seconds) {
        this.targetPanel.setSkillCountdown(
            monsterType,
            multiplier,
            seconds
        );
    }

    setSkillTimer(monsterType, label, seconds) {
        this.targetPanel.setSkillTimer(monsterType, label, seconds);
    }

    showTargetSkillFeedback(monsterType, text) {
        this.targetPanel.showSkillFeedback(monsterType, text);
    }

    layout(screenWidth, screenHeight, boardBounds) {
        layoutHud(this, screenWidth, screenHeight, boardBounds);
    }

    destroy(options) {
        UIManager.instance = null;
        super.destroy(options);
    }
}
