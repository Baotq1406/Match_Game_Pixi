/**
 * Skill RABBIT xóa toàn bộ Rabbit trên board và cộng điểm theo số lượng.
 */
export class RabbitClearSkill {
    constructor({
        monsterType,
        pointsPerMonster,
        getMonstersByType,
        addScore,
        showFeedback,
    }) {
        this.monsterType = monsterType;
        this.pointsPerMonster = pointsPerMonster;
        this.getMonstersByType = getMonstersByType;
        this.addScore = addScore;
        this.showFeedback = showFeedback;
    }

    activate({ claimedMonsters = new Set() } = {}) {
        // claimedMonsters ngăn một Rabbit bị tính điểm hai lần trong cùng lượt.
        const monstersToClear = this.getMonstersByType(
            this.monsterType
        ).filter((monster) => !claimedMonsters.has(monster));
        monstersToClear.forEach((monster) => {
            claimedMonsters.add(monster);
        });
        const removedCount = monstersToClear.length;
        const earnedScore = removedCount * this.pointsPerMonster;

        if (earnedScore > 0) {
            this.addScore(earnedScore);
        }
        this.showFeedback(this.monsterType, `+${earnedScore}`);

        // Gameplay sẽ gộp danh sách này với chuỗi gốc và refill chỉ một lần.
        return { monstersToClear };
    }

    update() {}

    getScoreMultiplier() {
        return 1;
    }

    destroy() {}
}
