import {
    AssetId,
    MONSTER_ASSET_IDS,
} from "../../services/AssetLoader.js";
import { GameConfig } from "../../config/GameConfig.js";
import { CatTimeSkill } from "./CatTimeSkill.js";
import { PigScoreSkill } from "./PigScoreSkill.js";
import { SheepMultiplierSkill } from "./SheepMultiplierSkill.js";
import { RabbitClearSkill } from "./RabbitClearSkill.js";
import { OwlWildcardSkill } from "./OwlWildcardSkill.js";

/**
 * Dang ky, kich hoat va cap nhat cac skill theo loai quai.
 */
export class MonsterSkillManager {
    constructor({
        addTime,
        addScore,
        setBoardMultiplier,
        setCountdown,
        setSkillTimer,
        setMonsterDisplayType,
        getMonstersByType,
        showFeedback,
    }) {
        const skillConfig = GameConfig.monsterSkills;

        // Registry giup them skill moi ma khong chen logic vao gameplay state.
        this.skills = new Map([
            [
                AssetId.MONSTER_CAT,
                new CatTimeSkill({
                    bonusSeconds: skillConfig.cat.bonusSeconds,
                    addTime,
                }),
            ],
            [
                AssetId.MONSTER_PIG,
                new PigScoreSkill({
                    bonusScore: skillConfig.pig.bonusScore,
                    addScore,
                }),
            ],
            [
                AssetId.MONSTER_SHEEP,
                new SheepMultiplierSkill({
                    monsterType: AssetId.MONSTER_SHEEP,
                    durationSeconds: skillConfig.sheep.durationSeconds,
                    multiplier: skillConfig.sheep.scoreMultiplier,
                    setBoardMultiplier,
                    setCountdown,
                }),
            ],
            [
                AssetId.MONSTER_RABBIT,
                new RabbitClearSkill({
                    monsterType: AssetId.MONSTER_RABBIT,
                    pointsPerMonster:
                        skillConfig.rabbit.pointsPerMonster,
                    getMonstersByType,
                    addScore,
                    showFeedback,
                }),
            ],
            [
                AssetId.MONSTER_OWL,
                new OwlWildcardSkill({
                    monsterType: AssetId.MONSTER_OWL,
                    durationSeconds: skillConfig.owl.durationSeconds,
                    cycleIntervalMilliseconds:
                        skillConfig.owl.cycleIntervalMilliseconds,
                    cycleTypes: MONSTER_ASSET_IDS,
                    setMonsterDisplayType,
                    setCountdown: (seconds) => {
                        setSkillTimer(
                            AssetId.MONSTER_OWL,
                            "ANY",
                            seconds
                        );
                    },
                }),
            ],
        ]);
        // Owl duoc giu rieng vi no tham gia ca luat noi chuoi va tinh diem.
        this.owlSkill = this.skills.get(AssetId.MONSTER_OWL);
    }

    activate(monsterType, context) {
        // Mot skill co the tra ve hieu ung phu, vi du danh sach Rabbit can xoa.
        return this.skills.get(monsterType)?.activate(context);
    }

    canConnect(chain, candidate) {
        // Binh thuong chi noi cung loai; Owl active mo them luat wildcard.
        return (
            candidate.type === chain[0]?.type ||
            this.owlSkill.canConnect(chain, candidate)
        );
    }

    calculateCollectionScore(monsters) {
        // Owl lay loai chinh cua chuoi truoc khi tra cuu multiplier.
        // Nho vay Owl trong chuoi Sheep se nhan cung he so x2 cua Sheep.
        return monsters.reduce(
            (score, monster) => {
                const scoreType = this.owlSkill.resolveScoreType(
                    monster.type,
                    monsters
                );
                return score + this.getScoreMultiplier(scoreType);
            },
            0
        );
    }

    getScoreMultiplier(monsterType) {
        // Lay buff cao nhat thay vi nhan chong cac buff ngoai y muon.
        let multiplier = 1;
        this.skills.forEach((skill) => {
            multiplier = Math.max(
                multiplier,
                skill.getScoreMultiplier(monsterType)
            );
        });
        return multiplier;
    }

    update(deltaMilliseconds) {
        this.skills.forEach((skill) => skill.update(deltaMilliseconds));
    }

    destroy() {
        this.skills.forEach((skill) => skill.destroy());
        this.skills.clear();
    }
}
