/**
 * Luu tien do cua mot target va tinh so lan skill duoc kich hoat.
 */
export class TargetCharge {
    constructor(limit) {
        this.limit = limit;
        this.value = 0;
    }

    add(amount, canActivate = true) {
        // Target chua co skill se dung tai gioi han thay vi tu reset.
        const total = this.value + Math.max(0, amount);
        if (!canActivate) {
            this.value = Math.min(this.limit, total);
            return {
                activationCount: 0,
                value: this.value,
            };
        }

        // Phan du duoc giu lai cho chu ky nap skill tiep theo.
        const activationCount = Math.floor(total / this.limit);
        this.value = total % this.limit;

        return {
            activationCount,
            value: this.value,
        };
    }
}
