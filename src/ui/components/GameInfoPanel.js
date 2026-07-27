import { Container, Text } from "pixi.js";
import { MetricPanel } from "./MetricPanel.js";
import { HUD_COLORS, createPanel, redrawPanel } from "./HudStyles.js";

/**
 * Hiển thị thời gian và điểm số của ván chơi.
 */
export class GameInfoPanel extends Container {
    constructor({ ticker } = {}) {
        super();

        this.panelWidth = 230;
        this.panelHeight = 232;
        this.metricWidth = this.panelWidth - 24;
        // Chừa một ô riêng bên phải cho nút Pause trên mobile.
        this.mobilePauseSlotWidth = 56;
        this.mobileWidth =
            this.metricWidth * 2 +
            8 +
            24 +
            this.mobilePauseSlotWidth;
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
            value: "0",
            valueColor: HUD_COLORS.accent,
            width: this.metricWidth,
            ticker,
        });
        this.score = new MetricPanel({
            label: "SCORE",
            value: "0",
            valueColor: HUD_COLORS.border,
            width: this.metricWidth,
            ticker,
        });

        this.title.position.set(14, 12);
        this.addChild(this.background, this.title, this.timer, this.score);
        this.setMobile(false);
    }

    setMobile(isMobile) {
        // Mobile đặt hai metric nằm ngang để tiết kiệm chiều cao.
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
        const displayedSeconds = Math.max(0, seconds);
        this.timer.setValue(displayedSeconds);
        this.timer.setUrgency(displayedSeconds);
    }

    setScore(score) {
        this.score.setValue(score);
    }

    showTimeIncrease(previousValue, amount) {
        this.timer.showIncrease(previousValue, amount);
    }

    showScoreIncrease(previousValue, amount) {
        this.score.showIncrease(previousValue, amount);
    }
}
