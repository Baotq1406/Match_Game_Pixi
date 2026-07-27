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
 * Đăng ký, kích hoạt và cập nhật các skill theo loại quái.
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

        // Registry giúp thêm skill mới mà không chèn logic vào gameplay state.
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
        // Owl được giữ riêng vì nó tham gia cả luật nối chuỗi và tính điểm.
        this.owlSkill = this.skills.get(AssetId.MONSTER_OWL);
    }

    activate(monsterType, context) {
        // Một skill có thể trả về hiệu ứng phụ, ví dụ danh sách Rabbit cần xóa.
        return this.skills.get(monsterType)?.activate(context);
    }

    canConnect(chain, candidate) {
        // Bình thường chỉ nối cùng loại; Owl active mở thêm luật wildcard.
        return (
            candidate.type === chain[0]?.type ||
            this.owlSkill.canConnect(chain, candidate)
        );
    }

    getTargetCollectibleMonsters(monsters) {
        // Mỗi skill có thể tự từ chối nạp target mà không sửa GameplayState.
        return monsters.filter((monster) =>
            [...this.skills.values()].every(
                (skill) => skill.canAddToTarget?.(monster.type) ?? true
            )
        );
    }

    calculateCollectionScore(monsters) {
        // Owl lấy loại chính của chuỗi trước khi tra cứu multiplier.
        // Nhờ vậy Owl trong chuỗi Sheep sẽ nhận cùng hệ số x2 của Sheep.
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
        // Lấy buff cao nhất thay vì nhân chồng các buff ngoài ý muốn.
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
