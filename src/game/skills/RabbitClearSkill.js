/**
 * Skill RABBIT xoa toan bo Rabbit tren board va cong diem theo so luong.
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
        // claimedMonsters ngan mot Rabbit bi tinh diem hai lan trong cung luot.
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

        // Gameplay se gop danh sach nay voi chuoi goc va refill chi mot lan.
        return { monstersToClear };
    }

    update() {}

    getScoreMultiplier() {
        return 1;
    }

    destroy() {}
}
