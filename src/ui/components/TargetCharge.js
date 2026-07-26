export class TargetCharge {
    constructor(limit) {
        this.limit = limit;
        this.value = 0;
    }

    add(amount, canActivate = true) {
        const total = this.value + Math.max(0, amount);
        if (!canActivate) {
            this.value = Math.min(this.limit, total);
            return {
                activationCount: 0,
                value: this.value,
            };
        }

        const activationCount = Math.floor(total / this.limit);
        this.value = total % this.limit;

        return {
            activationCount,
            value: this.value,
        };
    }
}
