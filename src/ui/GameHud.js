import { Container, Graphics, Sprite, Text } from "pixi.js";
import {
    AssetId,
    AssetLoader,
    MONSTER_ASSET_IDS,
} from "../services/AssetLoader.js";

const COLORS = Object.freeze({
    panel: 0x241a2c,
    panelAlpha: 0.94,
    border: 0xf0b64d,
    accent: 0x64f4ff,
    text: 0xffffff,
    mutedText: 0xe5c98b,
});

export class GameHud extends Container {
    constructor() {
        super();

        this.cardSize = 80;
        this.cardGap = 8;
        this.infoWidth = 230;
        this.infoHeight = 232;
        this.metricWidth = this.infoWidth - 24;
        this.mobileInfoWidth = this.metricWidth * 2 + 8 + 24;
        this.mobileInfoHeight = 82;
        this.targetCards = [];
        this.targetCountGap = 22;

        this.targetWidth =
            MONSTER_ASSET_IDS.length * this.cardSize +
            (MONSTER_ASSET_IDS.length - 1) * this.cardGap;
        this.horizontalTargetPanelWidth = this.targetWidth + 24;
        this.horizontalTargetPanelHeight =
            30 + this.cardSize + this.targetCountGap + 12;
        this.verticalTargetPanelWidth = this.cardSize + 24;
        this.verticalTargetPanelHeight =
            30 +
            MONSTER_ASSET_IDS.length * this.cardSize +
            MONSTER_ASSET_IDS.length * this.targetCountGap +
            12;
        this.targetPanelWidth = this.targetWidth + 24;
        this.targetPanelHeight = 108;

        this.infoPanel = this.createPanel(
            this.infoWidth,
            this.infoHeight,
            18,
            2
        );
        this.infoPanel.alpha = 0.96;
        this.addChild(this.infoPanel);

        this.infoTitle = new Text({
            text: "GAME INFO",
            style: {
                fill: COLORS.mutedText,
                fontFamily: "Arial, sans-serif",
                fontSize: 13,
                fontWeight: "700",
                letterSpacing: 1.6,
            },
        });
        this.infoTitle.position.set(14, 12);
        this.addChild(this.infoTitle);

        this.targetPanel = this.createPanel(
            this.targetPanelWidth,
            this.targetPanelHeight,
            16,
            2
        );
        this.targetPanel.alpha = 0.96;
        this.addChild(this.targetPanel);

        this.targetLabel = new Text({
            text: "TARGETS",
            style: {
                fill: COLORS.mutedText,
                fontFamily: "Arial, sans-serif",
                fontSize: 13,
                fontWeight: "700",
                letterSpacing: 1.6,
            },
        });
        this.targetLabel.position.set(12, 9);
        this.addChild(this.targetLabel);

        this.targets = new Container();
        this.targets.position.set(12, 30);
        this.addChild(this.targets);
        this.createTargetCards();

        this.info = new Container();
        this.info.position.set(12, 42);
        this.addChild(this.info);
        this.createInfoPanels();
    }

    createTargetCards() {
        MONSTER_ASSET_IDS.forEach((monsterType, index) => {
            const card = new Container();
            const background = this.createPanel(
                this.cardSize,
                this.cardSize,
                10,
                2
            );
            const basket = new Sprite(AssetLoader.get(AssetId.BASKET));
            const monster = new Sprite(AssetLoader.get(monsterType));
            const count = new Text({
                text: "0 / 20",
                style: {
                    fill: COLORS.border,
                    fontFamily: "Arial, sans-serif",
                    fontSize: 14,
                    fontWeight: "800",
                },
            });

            basket.anchor.set(0.5);
            basket.position.set(this.cardSize / 2, this.cardSize / 2 + 2);
            this.fitSprite(basket, this.cardSize * 0.78);
            basket.alpha = 0.92;

            monster.anchor.set(0.5);
            monster.position.set(this.cardSize / 2, this.cardSize / 2 - 1);
            this.fitSprite(monster, this.cardSize * 0.5);
            count.anchor.set(0.5);
            count.position.set(this.cardSize / 2, this.cardSize + 13);

            card.addChild(background, basket, monster, count);
            card.position.x = index * (this.cardSize + this.cardGap);
            this.targets.addChild(card);
            this.targetCards.push(card);
        });
    }

    setTargetsLayout(isVertical) {
        this.targetLabel.text = isVertical
            ? "TARGETS"
            : "TARGETS · 20 EACH";
        this.targetPanelWidth = isVertical
            ? this.verticalTargetPanelWidth
            : this.horizontalTargetPanelWidth;
        this.targetPanelHeight = isVertical
            ? this.verticalTargetPanelHeight
            : this.horizontalTargetPanelHeight;

        this.targetCards.forEach((card, index) => {
            card.position.set(
                isVertical ? 0 : index * (this.cardSize + this.cardGap),
                isVertical ? index * (this.cardSize + this.targetCountGap) : 0
            );
        });

        this.targetPanel
            .clear()
            .roundRect(
                0,
                0,
                this.targetPanelWidth,
                this.targetPanelHeight,
                16
            )
            .fill({ color: COLORS.panel, alpha: 0.96 })
            .stroke({ color: COLORS.border, width: 2 });
    }

    setInfoLayout(isMobile) {
        const panelWidth = isMobile ? this.mobileInfoWidth : this.infoWidth;
        const panelHeight = isMobile ? this.mobileInfoHeight : this.infoHeight;

        this.infoPanel
            .clear()
            .roundRect(0, 0, panelWidth, panelHeight, 18)
            .fill({ color: COLORS.panel, alpha: 0.96 })
            .stroke({ color: COLORS.border, width: 2 });

        this.infoTitle.visible = !isMobile;
        this.timerPanel.position.set(0, 0);
        this.scorePanel.position.set(
            isMobile ? this.metricWidth + 8 : 0,
            isMobile ? 0 : 86
        );
    }

    createInfoPanels() {
        this.timerPanel = this.createMetricPanel(
            "TIME",
            "60",
            COLORS.accent
        );
        this.scorePanel = this.createMetricPanel(
            "AIM SCORE",
            "0 / 1000",
            COLORS.border
        );

        this.timerPanel.position.y = 0;
        this.scorePanel.position.y = 86;
        this.info.addChild(this.timerPanel, this.scorePanel);
    }

    createMetricPanel(label, value, valueColor) {
        const panel = new Container();
        const background = this.createPanel(this.metricWidth, 70, 12, 2);
        const labelText = new Text({
            text: label,
            style: {
                fill: COLORS.mutedText,
                fontFamily: "Arial, sans-serif",
                fontSize: 13,
                fontWeight: "700",
                letterSpacing: 1.5,
            },
        });
        const valueText = new Text({
            text: value,
            style: {
                fill: valueColor,
                fontFamily: "Arial, sans-serif",
                fontSize: 28,
                fontWeight: "800",
            },
        });

        labelText.position.set(14, 8);
        valueText.position.set(14, 28);
        panel.addChild(background, labelText, valueText);
        return panel;
    }

    createPanel(width, height, radius, borderWidth) {
        return new Graphics()
            .roundRect(0, 0, width, height, radius)
            .fill({ color: COLORS.panel, alpha: COLORS.panelAlpha })
            .stroke({ color: COLORS.border, width: borderWidth });
    }

    fitSprite(sprite, maximumSize) {
        const scale = Math.min(
            maximumSize / sprite.texture.width,
            maximumSize / sprite.texture.height
        );
        sprite.scale.set(scale);
    }

    layout(screenWidth, screenHeight, boardBounds) {
        if (screenWidth < 900) {
            this.setInfoLayout(true);
            this.setTargetsLayout(false);

            const mobileScale = Math.min(
                0.9,
                (screenWidth - 24) /
                    Math.max(this.mobileInfoWidth, this.targetPanelWidth)
            );
            this.scale.set(Math.max(0.58, mobileScale));

            const scale = this.scale.x;
            const infoX =
                screenWidth / scale / 2 - this.mobileInfoWidth / 2;
            const targetX =
                screenWidth / scale / 2 - this.targetPanelWidth / 2;
            const infoY = 12 / scale;
            const targetY =
                screenHeight / scale -
                this.targetPanelHeight -
                12 / scale;

            this.infoPanel.position.set(infoX, infoY);
            this.infoTitle.position.set(infoX + 14, infoY + 12);
            this.info.position.set(infoX + 12, infoY + 6);
            this.targetPanel.position.set(targetX, targetY);
            this.targetLabel.position.set(targetX + 12, targetY + 9);
            this.targets.position.set(targetX + 12, targetY + 30);
            this.mobileBoardTop =
                12 + this.mobileInfoHeight * scale + 12;
            this.mobileBoardBottom =
                screenHeight - this.targetPanelHeight * scale - 12;
            this.position.set(0, 0);
            return;
        }

        this.setInfoLayout(false);
        const sideGap = 24;
        const leftSpace = boardBounds.left;
        const rightSpace = screenWidth - boardBounds.right;
        const canUseVerticalTargets =
            screenWidth >= 1500 &&
            leftSpace >= this.infoWidth * 0.8 &&
            rightSpace >= this.verticalTargetPanelWidth * 0.8;

        this.setTargetsLayout(canUseVerticalTargets);

        const canUseSides = canUseVerticalTargets;
        const scale = canUseSides
            ? Math.min(
                  1.1,
                  (leftSpace - sideGap) / this.infoWidth,
                  (rightSpace - sideGap) / this.targetPanelWidth
              )
            : Math.min(
                  1,
                  (screenWidth - 24) /
                      Math.max(this.infoWidth, this.targetPanelWidth)
              );

        this.scale.set(Math.max(0.65, scale));

        if (canUseSides) {
            const boardCenterY =
                (boardBounds.y + boardBounds.height / 2) / scale;

            this.infoPanel.position.set(
                (boardBounds.left - sideGap) / scale - this.infoWidth,
                boardCenterY - this.infoHeight / 2
            );
            this.infoTitle.position.set(
                this.infoPanel.x + 14,
                this.infoPanel.y + 12
            );
            this.info.position.set(
                this.infoPanel.x + 12,
                this.infoPanel.y + 42
            );

            this.targetPanel.position.set(
                boardBounds.right / scale + sideGap / scale,
                boardCenterY - this.targetPanelHeight / 2
            );
            this.targetLabel.position.set(
                this.targetPanel.x + 12,
                this.targetPanel.y + 9
            );
            this.targets.position.set(
                this.targetPanel.x + 12,
                this.targetPanel.y + 30
            );
            this.position.set(0, 0);
            return;
        }

        const compactGap = 12;
        const compactWidth = this.infoWidth + compactGap + this.targetPanelWidth;
        const compactScale = Math.min(
            0.9,
            (screenWidth - 24) / compactWidth
        );

        this.scale.set(Math.max(0.58, compactScale));
        const compactX = screenWidth / this.scale.x / 2 - compactWidth / 2;

        this.position.set(0, 0);
        this.infoPanel.position.set(compactX, 12 / this.scale.x);
        this.infoTitle.position.set(
            this.infoPanel.x + 14,
            this.infoPanel.y + 12
        );
        this.info.position.set(this.infoPanel.x + 12, this.infoPanel.y + 42);
        this.targetPanel.position.set(
            this.infoPanel.x + this.infoWidth + compactGap,
            12 / this.scale.x
        );
        this.targetLabel.position.set(
            this.targetPanel.x + 12,
            this.targetPanel.y + 9
        );
        this.targets.position.set(
            this.targetPanel.x + 12,
            this.targetPanel.y + 30
        );

        this.targetLabel.y = this.targetPanel.y + 9;
        this.targets.y = this.targetPanel.y + 30;
    }
}
