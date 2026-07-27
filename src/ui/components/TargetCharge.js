/**
 * Lưu tiến độ của một target và tính số lần skill được kích hoạt.
 */
export class TargetCharge {
    constructor(limit) {
        this.limit = limit;
        this.value = 0;
    }

    add(amount, canActivate = true) {
        // Target chưa có skill sẽ dừng tại giới hạn thay vì tự reset.
        const total = this.value + Math.max(0, amount);
        if (!canActivate) {
            this.value = Math.min(this.limit, total);
            return {
                activationCount: 0,
                value: this.value,
            };
        }

        // Phần dư được giữ lại cho chu kỳ nạp skill tiếp theo.
        const activationCount = Math.floor(total / this.limit);
        this.value = total % this.limit;

        return {
            activationCount,
            value: this.value,
        };
    }
}
