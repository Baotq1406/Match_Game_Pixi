/**
 * Skill OWL bien Owl thanh wildcard trong mot khoang thoi gian.
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
        // monsterType la loai that cua Owl, cycleTypes chi dung de doi hinh.
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
        // Kich hoat lai se lam moi thoi gian va bat dau chu ky hinh tu CAT.
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

        // Chi cap nhat UI khi so giay thay doi de tranh ve lai moi frame.
        if (displayedSecond !== this.lastDisplayedSecond) {
            this.lastDisplayedSecond = displayedSecond;
            this.setCountdown(displayedSecond);
        }

        if (this.remainingSeconds === 0) {
            this.deactivate();
            return;
        }

        // Dung while de khong bo qua buoc doi hinh khi mot frame bi cham.
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

        // Quai dau tien khong phai Owl se quyet dinh loai chinh cua chuoi.
        // Owl co the thay loai do, nhung khong the tron hai loai chinh khac nhau.
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

    resolveScoreType(monsterType, chain) {
        if (!this.isActive || monsterType !== this.monsterType) {
            return monsterType;
        }

        // Khi Owl di cung Sheep, tinh Owl nhu Sheep de cung nhan buff x2.
        // Chuoi chi co Owl thi van tinh theo loai Owl va nhan diem mac dinh.
        return (
            chain.find((monster) => monster.type !== this.monsterType)
                ?.type ?? monsterType
        );
    }

    applyCurrentAppearance() {
        // Callback nay chi thay texture tren board, khong thay doi type that.
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

        // Het buff phai tra texture ve Owl va an countdown tren target.
        this.isActive = false;
        this.remainingSeconds = 0;
        this.setMonsterDisplayType(this.monsterType, this.monsterType);
        this.setCountdown(0);
    }

    destroy() {
        this.deactivate();
    }
}
