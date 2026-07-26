import { Container, Text } from "pixi.js";
import { GameConfig } from "../../config/GameConfig.js";
import { MetricPanel } from "./MetricPanel.js";
import { HUD_COLORS, createPanel, redrawPanel } from "./HudStyles.js";

/**
 * Hien thi thoi gian va diem so cua van choi.
 */
export class GameInfoPanel extends Container {
    constructor() {
        super();

        this.panelWidth = 230;
        this.panelHeight = 232;
        this.metricWidth = this.panelWidth - 24;
        this.mobileWidth = this.metricWidth * 2 + 8 + 24;
        this.mobileHeight = 82;
        this.background = createPanel(this.panelWidth, this.panelHeight, 18, 2);
        this.title = new Text({
            text: "GAME INFO",
            style: {
                fill: HUD_COLORS.mutedText,
                fontFamily: "Arial, sans-serif",
                fontSize: 13,
                fontWeight: "700",
                letterSpacing: 1.6,
            },
        });
        this.timer = new MetricPanel({
            label: "TIME",
            value: String(GameConfig.roundDurationSeconds),
            valueColor: HUD_COLORS.accent,
            width: this.metricWidth,
        });
        this.score = new MetricPanel({
            label: "AIM SCORE",
            value: `0 / ${GameConfig.targetScore}`,
            valueColor: HUD_COLORS.border,
            width: this.metricWidth,
        });

        this.title.position.set(14, 12);
        this.addChild(this.background, this.title, this.timer, this.score);
        this.setMobile(false);
    }

    setMobile(isMobile) {
        // Mobile dat hai metric nam ngang de tiet kiem chieu cao.
        this.panelWidth = isMobile ? this.mobileWidth : 230;
        this.panelHeight = isMobile ? this.mobileHeight : 232;
        redrawPanel(
            this.background,
            this.panelWidth,
            this.panelHeight,
            18,
            2
        );
        this.title.visible = !isMobile;
        this.timer.position.set(12, isMobile ? 6 : 42);
        this.score.position.set(
            isMobile ? this.metricWidth + 20 : 12,
            isMobile ? 6 : 128
        );
    }

    setTime(seconds) {
        this.timer.setValue(Math.max(0, seconds));
    }

    setScore(score) {
        this.score.setValue(`${score} / ${GameConfig.targetScore}`);
    }
}
