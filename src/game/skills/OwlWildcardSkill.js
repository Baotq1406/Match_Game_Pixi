/**
 * Skill OWL biến Owl thành wildcard trong một khoảng thời gian.
 */
export class OwlWildcardSkill {
    constructor({
        monsterType,
        durationSeconds,
        cycleIntervalMilliseconds,
        cycleTypes,
        setMonsterDisplayType,
        setCountdown,
    }) {
        // monsterType là loại thật của Owl, cycleTypes chỉ dùng để đổi hình.
        this.monsterType = monsterType;
        this.durationSeconds = durationSeconds;
        this.cycleIntervalMilliseconds = cycleIntervalMilliseconds;
        this.cycleTypes = cycleTypes;
        this.setMonsterDisplayType = setMonsterDisplayType;
        this.setCountdown = setCountdown;
        this.remainingSeconds = 0;
        this.cycleElapsedMilliseconds = 0;
        this.cycleIndex = 0;
        this.lastDisplayedSecond = 0;
        this.isActive = false;
    }

    activate() {
        // Kích hoạt lại sẽ làm mới thời gian và bắt đầu chu kỳ hình từ CAT.
        this.remainingSeconds = this.durationSeconds;
        this.cycleElapsedMilliseconds = 0;
        this.cycleIndex = 0;
        this.lastDisplayedSecond = this.durationSeconds;
        this.isActive = true;
        this.applyCurrentAppearance();
        this.setCountdown(this.durationSeconds);
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

        // Chỉ cập nhật UI khi số giây thay đổi để tránh vẽ lại mỗi frame.
        if (displayedSecond !== this.lastDisplayedSecond) {
            this.lastDisplayedSecond = displayedSecond;
            this.setCountdown(displayedSecond);
        }

        if (this.remainingSeconds === 0) {
            this.deactivate();
            return;
        }

        // Dùng while để không bỏ qua bước đổi hình khi một frame bị chậm.
        this.cycleElapsedMilliseconds += deltaMilliseconds;
        while (
            this.cycleElapsedMilliseconds >=
            this.cycleIntervalMilliseconds
        ) {
            this.cycleElapsedMilliseconds -=
                this.cycleIntervalMilliseconds;
            this.cycleIndex =
                (this.cycleIndex + 1) % this.cycleTypes.length;
            this.applyCurrentAppearance();
        }
    }

    canConnect(chain, candidate) {
        if (!this.isActive) {
            return false;
        }

        // Quái đầu tiên không phải Owl sẽ quyết định loại chính của chuỗi.
        // Owl có thể thay loại đó, nhưng không thể trộn hai loại chính khác nhau.
        const monsters = [...chain, candidate];
        const baseType = monsters.find(
            (monster) => monster.type !== this.monsterType
        )?.type;

        return monsters.every(
            (monster) =>
                monster.type === this.monsterType ||
                !baseType ||
                monster.type === baseType
        );
    }

    canAddToTarget(monsterType) {
        // Owl đang là wildcard thì không được nạp lại target của chính nó.
        return !(
            this.isActive && monsterType === this.monsterType
        );
    }

    resolveScoreType(monsterType, chain) {
        if (!this.isActive || monsterType !== this.monsterType) {
            return monsterType;
        }

        // Khi Owl đi cùng Sheep, tính Owl như Sheep để cùng nhận buff x2.
        // Chuỗi chỉ có Owl thì vẫn tính theo loại Owl và nhận điểm mặc định.
        return (
            chain.find((monster) => monster.type !== this.monsterType)
                ?.type ?? monsterType
        );
    }

    applyCurrentAppearance() {
        // Callback này chỉ thay texture trên board, không thay đổi type thật.
        this.setMonsterDisplayType(
            this.monsterType,
            this.cycleTypes[this.cycleIndex]
        );
    }

    getScoreMultiplier() {
        return 1;
    }

    deactivate() {
        if (!this.isActive) {
            return;
        }

        // Hết buff phải trả texture về Owl và ẩn countdown trên target.
        this.isActive = false;
        this.remainingSeconds = 0;
        this.setMonsterDisplayType(this.monsterType, this.monsterType);
        this.setCountdown(0);
    }

    destroy() {
        this.deactivate();
    }
}
