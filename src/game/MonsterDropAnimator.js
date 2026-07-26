import { Ticker } from "pixi.js";

/**
 * Dieu khien animation roi cua quai bang Pixi shared ticker.
 */
export class MonsterDropAnimator {
    constructor({ cellSize, config }) {
        this.cellSize = cellSize;
        this.config = config;
        this.animations = new Set();
    }

    animateInitial(monsters) {
        const startOffset = this.config.monsterDropStartOffset ?? 1;
        const stagger = this.config.monsterDropStagger ?? 20;
        const transitions = monsters.map((monster, index) => {
            const targetX = monster.x;
            const targetY = monster.y;

            monster.position.set(
                targetX,
                targetY - this.cellSize * startOffset
            );
            monster.visible = false;

            return {
                monster,
                startX: targetX,
                startY: monster.y,
                targetX,
                targetY,
                delay: index * stagger,
            };
        });

        return this.animate(transitions);
    }

    animate(transitions) {
        // Moi transition co delay rieng de tao hieu ung roi lan luot.
        if (transitions.length === 0) {
            return Promise.resolve();
        }

        const duration = this.config.monsterDropDuration ?? 240;
        const latestDelay = transitions.reduce(
            (maximum, transition) => Math.max(maximum, transition.delay),
            0
        );

        return new Promise((resolve) => {
            let elapsed = 0;
            const animation = { callback: null, resolve };

            animation.callback = (ticker) => {
                elapsed += ticker.deltaMS;

                transitions.forEach((transition) => {
                    const progress = Math.min(
                        1,
                        Math.max(0, (elapsed - transition.delay) / duration)
                    );
                    const easedProgress = 1 - (1 - progress) ** 3;

                    transition.monster.visible = progress > 0;
                    transition.monster.position.set(
                        transition.startX +
                            (transition.targetX - transition.startX) *
                                easedProgress,
                        transition.startY +
                            (transition.targetY - transition.startY) *
                                easedProgress
                    );
                });

                if (elapsed < duration + latestDelay) {
                    return;
                }

                transitions.forEach(({ monster, targetX, targetY }) => {
                    monster.position.set(targetX, targetY);
                    monster.visible = true;
                });
                this.finish(animation);
            };

            this.animations.add(animation);
            Ticker.shared.add(animation.callback);
        });
    }

    finish(animation) {
        Ticker.shared.remove(animation.callback);
        this.animations.delete(animation);
        animation.resolve();
    }

    destroy() {
        // Giai phong callback va resolve promise dang cho khi board bi huy.
        this.animations.forEach((animation) => {
            Ticker.shared.remove(animation.callback);
            animation.resolve();
        });
        this.animations.clear();
    }
}
