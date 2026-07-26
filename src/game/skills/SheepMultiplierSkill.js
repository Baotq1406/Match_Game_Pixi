export class SheepMultiplierSkill {
    constructor({
        monsterType,
        durationSeconds,
        multiplier,
        setBoardMultiplier,
        setCountdown,
    }) {
        this.monsterType = monsterType;
        this.durationSeconds = durationSeconds;
        this.multiplier = multiplier;
        this.setBoardMultiplier = setBoardMultiplier;
        this.setCountdown = setCountdown;
        this.remainingSeconds = 0;
        this.isActive = false;
        this.lastDisplayedSecond = 0;
    }

    activate() {
        this.remainingSeconds = this.durationSeconds;
        this.lastDisplayedSecond = this.durationSeconds;
        this.setCountdown(
            this.monsterType,
            this.multiplier,
            this.durationSeconds
        );

        if (!this.isActive) {
            this.isActive = true;
            this.setBoardMultiplier(this.monsterType, this.multiplier);
        }
    }

    update(deltaMilliseconds) {
        if (!this.isActive) {
            return;
        }

        this.remainingSeconds = Math.max(
            0,
            this.remainingSeconds - deltaMilliseconds / 1000
        );
        const displayedSecond = Math.ceil(this.remainingSeconds);

        if (displayedSecond !== this.lastDisplayedSecond) {
            this.lastDisplayedSecond = displayedSecond;
            this.setCountdown(
                this.monsterType,
                this.multiplier,
                displayedSecond
            );
        }

        if (this.remainingSeconds === 0) {
            this.deactivate();
        }
    }

    getScoreMultiplier(monsterType) {
        return this.isActive && monsterType === this.monsterType
            ? this.multiplier
            : 1;
    }

    deactivate() {
        if (!this.isActive) {
            return;
        }

        this.isActive = false;
        this.setBoardMultiplier(this.monsterType, 1);
        this.setCountdown(this.monsterType, this.multiplier, 0);
    }

    destroy() {
        this.deactivate();
    }
}
