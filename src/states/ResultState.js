import { Container, Graphics, Text } from "pixi.js";
import { GameplayState } from "./GameplayState.js";
import { StartState } from "./StartState.js";
import { MenuButton } from "../ui/components/MenuButton.js";
import { HUD_COLORS, createPanel } from "../ui/components/HudStyles.js";

/**
 * Hien thi diem ket thuc va cho phep retry hoac quay ve main menu.
 */
export class ResultState {
    constructor(game) {
        this.game = game;
        this.view = null;
        this.isChangingState = false;
    }

    async enter({ score = 0 } = {}) {
        this.view = new Container();

        const background = new Graphics()
            .rect(0, 0, this.game.designWidth, this.game.designHeight)
            .fill({ color: 0x17172f, alpha: 1 });
        const panelWidth = 420;
        const panelHeight = 360;
        const panel = createPanel(panelWidth, panelHeight, 20, 3);
        const title = this.createText("GAME OVER", 48, HUD_COLORS.border);
        const finalScore = this.createText(
            `DIEM CUA BAN: ${score}`,
            26,
            0xffffff
        );
        const retryButton = new MenuButton({
            label: "CHOI LAI",
            primary: true,
            onPress: () => void this.changeState(GameplayState),
        });
        const menuButton = new MenuButton({
            label: "VE MENU",
            onPress: () => void this.changeState(StartState),
        });

        panel.position.set(
            (this.game.designWidth - panelWidth) / 2,
            (this.game.designHeight - panelHeight) / 2
        );
        title.position.set(this.game.designWidth / 2, 245);
        finalScore.position.set(this.game.designWidth / 2, 310);
        retryButton.position.set(
            (this.game.designWidth - retryButton.buttonWidth) / 2,
            365
        );
        menuButton.position.set(
            (this.game.designWidth - menuButton.buttonWidth) / 2,
            435
        );

        this.retryButton = retryButton;
        this.menuButton = menuButton;
        this.view.addChild(
            background,
            panel,
            title,
            finalScore,
            retryButton,
            menuButton
        );
        this.game.root.addChild(this.view);
    }

    createText(text, fontSize, fill) {
        const label = new Text({
            text,
            style: {
                fill,
                fontFamily: "Arial, sans-serif",
                fontSize,
                fontWeight: "900",
                letterSpacing: fontSize > 30 ? 2 : 0.6,
            },
        });

        label.anchor.set(0.5);
        return label;
    }

    async changeState(StateClass) {
        if (this.isChangingState) {
            return;
        }

        // Khoa ca hai nut trong luc state machine dang don dep man cu.
        this.isChangingState = true;
        this.retryButton.setEnabled(false);
        this.menuButton.setEnabled(false);
        await this.game.stateMachine.changeState(StateClass);
    }

    exit() {
        if (!this.view) {
            return;
        }

        this.game.root.removeChild(this.view);
        this.view.destroy({ children: true });
        this.view = null;
        this.retryButton = null;
        this.menuButton = null;
    }

    destroy() {}
}
