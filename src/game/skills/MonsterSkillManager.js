import { AssetId } from "../../services/AssetLoader.js";
import { GameConfig } from "../../config/GameConfig.js";
import { CatTimeSkill } from "./CatTimeSkill.js";
import { PigScoreSkill } from "./PigScoreSkill.js";
import { SheepMultiplierSkill } from "./SheepMultiplierSkill.js";

export class MonsterSkillManager {
    constructor({
        addTime,
        addScore,
        setBoardMultiplier,
        setCountdown,
    }) {
        const skillConfig = GameConfig.monsterSkills;

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
        ]);
    }

    activate(monsterType) {
        this.skills.get(monsterType)?.activate();
    }

    calculateCollectionScore(monsters) {
        return monsters.reduce(
            (score, monster) =>
                score + this.getScoreMultiplier(monster.type),
            0
        );
    }

    getScoreMultiplier(monsterType) {
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
