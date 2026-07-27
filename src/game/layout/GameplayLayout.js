import { GameConfig } from "../../config/GameConfig.js";

const MOBILE_BREAKPOINT = 900;
const COMPACT_BREAKPOINT = 1500;

/**
 * Tính scale và vị trí của board, HUD và giao diện Pause theo viewport.
 */
export class GameplayLayout {
    constructor({ game, board, hud }) {
        this.game = game;
        this.board = board;
        this.hud = hud;
    }

    resize({
        pauseButton = null,
        pauseOverlay = null,
        isPaused = false,
    } = {}) {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const isMobile = width < MOBILE_BREAKPOINT;
        const isCompact = width < COMPACT_BREAKPOINT;
        const rootScale = this.game.root.scale.x;
        const rootOffsetY = this.game.root.position.y;

        if (isMobile) {
            this.layoutMobileBoard(
                width,
                height,
                rootScale,
                rootOffsetY
            );
        } else if (isCompact) {
            this.layoutCompactBoard(
                width,
                height,
                rootScale,
                rootOffsetY
            );
        } else {
            this.layoutDesktopBoard();
        }

        // HUD cần board bounds cuối cùng để chọn kiểu ngang hay dọc.
        this.hud.layout(
            width,
            height,
            this.board.getBounds()
        );
        this.layoutPauseUI(pauseButton, pauseOverlay, width, height);

        // Khi Pause, ticker dừng nên resize phải vẽ lại một frame.
        if (isPaused) {
            this.game.app.render();
        }
    }

    layoutMobileBoard(width, height, rootScale, rootOffsetY) {
        // Layout HUD lần đầu để lấy khoảng trống dành cho board.
        this.hud.layout(
            width,
            height,
            this.board.getBounds()
        );

        const boardTop = this.hud.mobileBoardTop;
        const availableHeight = Math.max(
            1,
            this.hud.mobileBoardBottom - boardTop
        );
        const boardScale = Math.min(
            1,
            (width - 24) /
                (this.board.layoutWidth * rootScale),
            availableHeight /
                (this.board.layoutHeight * rootScale)
        );
        const displayedBoardScale = Math.max(0.5, boardScale);
        const boardX =
            (this.game.designWidth -
                this.board.layoutWidth * displayedBoardScale) /
            2;
        const boardY = Math.max(
            0,
            (boardTop - rootOffsetY) / rootScale
        );

        this.board.scale.set(displayedBoardScale);
        this.board.position.set(boardX, boardY);
    }

    layoutCompactBoard(width, height, rootScale, rootOffsetY) {
        // Compact đặt HUD ở trên và co board vào chiều cao còn lại.
        this.hud.layout(
            width,
            height,
            this.board.getBounds()
        );

        const hudHeight =
            this.hud.infoPanel.panelHeight * this.hud.scale.x;
        const boardTop = 12 + hudHeight + 12;
        const availableHeight = Math.max(
            1,
            height - boardTop - 12
        );
        const boardScale = Math.min(
            1,
            (width - 24) /
                (this.board.layoutWidth * rootScale),
            availableHeight /
                (this.board.layoutHeight * rootScale)
        );
        const displayedBoardScale = Math.max(
            0.5,
            Math.min(0.68, boardScale)
        );
        const boardX =
            (this.game.designWidth -
                this.board.layoutWidth * displayedBoardScale) /
            2;
        const boardY = Math.max(
            0,
            (boardTop - rootOffsetY) / rootScale
        );

        this.board.scale.set(displayedBoardScale);
        this.board.position.set(boardX, boardY);
    }

    layoutDesktopBoard() {
        this.board.scale.set(1);
        this.board.position.set(
            (this.game.designWidth - this.board.layoutWidth) / 2,
            (this.game.designHeight - this.board.layoutHeight) / 2
        );
    }

    layoutPauseUI(
        pauseButton,
        pauseOverlay,
        width = window.innerWidth,
        height = window.innerHeight
    ) {
        if (!pauseButton) {
            pauseOverlay?.layout(width, height);
            return;
        }

        const isMobile = width < GameConfig.mobileBreakpoint;

        if (isMobile && this.hud.infoPanel) {
            // Bounds đã gồm HUD scale nên icon nằm đúng trong ô Pause.
            const infoBounds = this.hud.infoPanel.getBounds();
            const hudScale = this.hud.scale.x;
            const pauseSlotWidth =
                this.hud.infoPanel.mobilePauseSlotWidth * hudScale;
            const pauseSlotLeft =
                infoBounds.x +
                (this.hud.infoPanel.mobileWidth -
                    this.hud.infoPanel.mobilePauseSlotWidth) *
                    hudScale;
            const pauseScale = Math.min(
                1,
                Math.max(
                    0.7,
                    (pauseSlotWidth - 4) /
                        pauseButton.buttonWidth
                )
            );
            const displayedWidth =
                pauseButton.buttonWidth * pauseScale;
            const displayedHeight =
                pauseButton.buttonHeight * pauseScale;

            pauseButton.scale.set(pauseScale);
            pauseButton.position.set(
                pauseSlotLeft +
                    (pauseSlotWidth - displayedWidth) / 2,
                infoBounds.y +
                    (infoBounds.height - displayedHeight) / 2
            );
        } else {
            const margin = 18;
            const desktopPauseScale = 1.5;

            pauseButton.scale.set(desktopPauseScale);
            pauseButton.position.set(
                width -
                    pauseButton.buttonWidth *
                        desktopPauseScale -
                    margin,
                margin
            );
        }

        pauseOverlay?.layout(width, height);
    }
}
