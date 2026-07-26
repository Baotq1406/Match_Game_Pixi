export class CatTimeSkill {
    constructor({ bonusSeconds, addTime }) {
        this.bonusSeconds = bonusSeconds;
        this.addTime = addTime;
    }

    activate() {
        this.addTime(this.bonusSeconds);
    }

    update() {}

    getScoreMultiplier() {
        return 1;
    }

    destroy() {}
}
