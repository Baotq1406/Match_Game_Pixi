import { Container, Graphics, Text } from "pixi.js";

export class ResultState {
    constructor(game) {
        this.game = game;
        this.view = null;
    }

    async enter({ score = 0 } = {}) {
        this.view = new Container();

        const background = new Graphics()
            .rect(0, 0, this.game.designWidth, this.game.designHeight)
            .fill({ color: 0x17172f, alpha: 0.92 });
        const title = new Text({
            text: "GAME OVER",
            style: {
                fill: 0xf0b64d,
                fontFamily: "Arial, sans-serif",
                fontSize: 54,
                fontWeight: "800",
            },
        });
        const finalScore = new Text({
            text: `AIM SCORE: ${score}`,
            style: {
                fill: 0xffffff,
                fontFamily: "Arial, sans-serif",
                fontSize: 28,
                fontWeight: "700",
            },
        });

        title.anchor.set(0.5);
        title.position.set(this.game.designWidth / 2, this.game.designHeight / 2 - 36);
        finalScore.anchor.set(0.5);
        finalScore.position.set(this.game.designWidth / 2, this.game.designHeight / 2 + 30);

        this.view.addChild(background, title, finalScore);
        this.game.root.addChild(this.view);
    }

    exit() {
        if (!this.view) {
            return;
        }

        this.game.root.removeChild(this.view);
        this.view.destroy({ children: true });
        this.view = null;
    }

    destroy() {}
}
