/**
 * Skill PIG cộng điểm thưởng trực tiếp.
 */
export class PigScoreSkill {
    constructor({ bonusScore, addScore }) {
        this.bonusScore = bonusScore;
        this.addScore = addScore;
    }

    activate() {
        this.addScore(this.bonusScore);
    }

    update() {}

    getScoreMultiplier() {
        return 1;
    }

    destroy() {}
}
