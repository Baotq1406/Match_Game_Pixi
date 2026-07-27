import { Container, Text } from "pixi.js";
import {
    AssetId,
    MONSTER_ASSET_IDS,
} from "../../services/AssetLoader.js";
import { GameConfig } from "../../config/GameConfig.js";
import { createPanel, HUD_COLORS, redrawPanel } from "./HudStyles.js";
import { TargetCard } from "./TargetCard.js";

/**
 * Quản lý danh sách target và phát hiện target nào vừa nạp đầy skill.
 */
export class TargetPanel extends Container {
    constructor({ ticker }) {
        super();

        this.cardSize = 80;
        this.cardGap = 8;
        this.countGap = 22;
        this.targetLimit = GameConfig.targetMonsterCount;
        this.cards = new Map();
        // Map này vừa lưu feedback vừa đánh dấu target đã có skill hoàn chỉnh.
        this.skillFeedback = new Map([
            [
                AssetId.MONSTER_CAT,
                `+${GameConfig.monsterSkills.cat.bonusSeconds}s`,
            ],
            [
                AssetId.MONSTER_PIG,
                `+${GameConfig.monsterSkills.pig.bonusScore}`,
            ],
            [
                AssetId.MONSTER_SHEEP,
                `×${GameConfig.monsterSkills.sheep.scoreMultiplier} ${GameConfig.monsterSkills.sheep.durationSeconds}s`,
            ],
            [AssetId.MONSTER_RABBIT, "CLEAR!"],
            [
                AssetId.MONSTER_OWL,
                `ANY ${GameConfig.monsterSkills.owl.durationSeconds}s`,
            ],
        ]);
        this.horizontalWidth =
            MONSTER_ASSET_IDS.length * this.cardSize +
            (MONSTER_ASSET_IDS.length - 1) * this.cardGap +
            24;
        this.horizontalHeight = 30 + this.cardSize + this.countGap + 12;
        this.verticalWidth = this.cardSize + 24;
        this.verticalHeight =
            30 +
            MONSTER_ASSET_IDS.length * this.cardSize +
            MONSTER_ASSET_IDS.length * this.countGap +
            12;
        this.panelWidth = this.horizontalWidth;
        this.panelHeight = this.horizontalHeight;
        this.background = createPanel(
            this.panelWidth,
            this.panelHeight,
            16,
            2
        );
        this.label = new Text({
            text: `TARGETS · ${this.targetLimit} EACH`,
            style: {
                fill: HUD_COLORS.mutedText,
                fontFamily: "Arial, sans-serif",
                fontSize: 13,
                fontWeight: "700",
                letterSpacing: 1.6,
            },
        });
        this.label.position.set(12, 9);
        this.addChild(this.background, this.label);

        MONSTER_ASSET_IDS.forEach((monsterType) => {
            const card = new TargetCard({
                monsterType,
                ticker,
                targetLimit: this.targetLimit,
                cardSize: this.cardSize,
            });
            this.cards.set(monsterType, card);
            this.addChild(card);
        });
        this.setVertical(false);
    }

    collect(monsters) {
        // Đếm theo type thật, vì Owl đổi hình nhưng type vẫn là Owl.
        // Gom theo loại để một chuỗi wildcard có thể nạp nhiều target.
        const collected = new Map();
        const activatedSkills = [];

        monsters.forEach((monster) => {
            collected.set(monster.type, (collected.get(monster.type) ?? 0) + 1);
        });
        collected.forEach((amount, monsterType) => {
            const card = this.cards.get(monsterType);
            const hasImplementedSkill =
                this.skillFeedback.has(monsterType);
            const activationCount =
                card?.add(amount, hasImplementedSkill) ?? 0;

            for (let index = 0; index < activationCount; index++) {
                // Một lần thu thập lớn có thể kích hoạt nhiều chu kỳ skill.
                activatedSkills.push(monsterType);
            }

            if (activationCount > 0 && hasImplementedSkill) {
                card.showSkillFeedback(
                    this.skillFeedback.get(monsterType)
                );
            }
        });

        return activatedSkills;
    }

    setSkillCountdown(monsterType, multiplier, seconds) {
        this.cards
            .get(monsterType)
            ?.setSkillCountdown(multiplier, seconds);
    }

    setSkillTimer(monsterType, label, seconds) {
        this.cards.get(monsterType)?.setSkillTimer(label, seconds);
    }

    showSkillFeedback(monsterType, text) {
        this.cards.get(monsterType)?.showSkillFeedback(text);
    }

    setVertical(isVertical) {
        // Desktop rộng dùng cột dọc, các kích thước còn lại dùng hàng ngang.
        this.panelWidth = isVertical
            ? this.verticalWidth
            : this.horizontalWidth;
        this.panelHeight = isVertical
            ? this.verticalHeight
            : this.horizontalHeight;
        this.label.text = isVertical
            ? "TARGETS"
            : `TARGETS · ${this.targetLimit} EACH`;
        redrawPanel(
            this.background,
            this.panelWidth,
            this.panelHeight,
            16,
            2
        );

        [...this.cards.values()].forEach((card, index) => {
            card.position.set(
                isVertical ? 12 : 12 + index * (this.cardSize + this.cardGap),
                isVertical ? 30 + index * (this.cardSize + this.countGap) : 30
            );
        });
    }
}
