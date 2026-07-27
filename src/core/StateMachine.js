/**
 * Điều phối việc chuyển đổi và cập nhật các state của game.
 */
export class StateMachine {
    constructor(game) {
        this.game = game;
        this.currentState = null;
    }

    async changeState(StateClass, data = null) {
        // State cũ phải được dọn dẹp trước khi state mới được tạo.
        if (this.currentState) {
            this.currentState.exit();
            this.currentState.destroy();
        }

        this.currentState = new StateClass(this.game);

        await this.currentState.enter(data);
    }

    update(deltaTime) {
        this.currentState?.update?.(deltaTime);
    }
}
