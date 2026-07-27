/**
 * Sắp xếp HUD theo ba nhóm màn hình: mobile, compact và desktop rộng.
 */
export function layoutHud(ui, screenWidth, screenHeight, boardBounds) {
    if (screenWidth < 900) {
        // Mobile đặt thông tin ở trên, target ở dưới và board ở giữa.
        ui.infoPanel.setMobile(true);
        ui.targetPanel.setVertical(false);
        ui.scale.set(
            Math.max(
                0.58,
                Math.min(
                    0.9,
                    (screenWidth - 24) /
                        Math.max(
                            ui.infoPanel.panelWidth,
                            ui.targetPanel.panelWidth
                        )
                )
            )
        );

        const scale = ui.scale.x;
        ui.infoPanel.position.set(
            screenWidth / scale / 2 - ui.infoPanel.panelWidth / 2,
            12 / scale
        );
        ui.targetPanel.position.set(
            screenWidth / scale / 2 - ui.targetPanel.panelWidth / 2,
            screenHeight / scale - ui.targetPanel.panelHeight - 12 / scale
        );
        ui.mobileBoardTop = 12 + ui.infoPanel.panelHeight * scale + 12;
        ui.mobileBoardBottom =
            screenHeight - ui.targetPanel.panelHeight * scale - 12;
        return;
    }

    ui.infoPanel.setMobile(false);
    const sideGap = 24;
    const canUseVerticalTargets =
        screenWidth >= 1500 &&
        boardBounds.left >= ui.infoPanel.panelWidth * 0.8 &&
        screenWidth - boardBounds.right >= ui.targetPanel.verticalWidth * 0.8;
    ui.targetPanel.setVertical(canUseVerticalTargets);

    const scale = canUseVerticalTargets
        ? Math.min(
              1.1,
              (boardBounds.left - sideGap) / ui.infoPanel.panelWidth,
              (screenWidth - boardBounds.right - sideGap) /
                  ui.targetPanel.panelWidth
          )
        : Math.min(
              1,
              (screenWidth - 24) /
                  (ui.infoPanel.panelWidth + 12 + ui.targetPanel.panelWidth)
          );
    ui.scale.set(Math.max(0.65, scale));

    if (canUseVerticalTargets) {
        // Desktop rộng đặt hai panel hai bên board.
        const boardCenterY = (boardBounds.y + boardBounds.height / 2) / scale;
        ui.infoPanel.position.set(
            (boardBounds.left - sideGap) / scale - ui.infoPanel.panelWidth,
            boardCenterY - ui.infoPanel.panelHeight / 2
        );
        ui.targetPanel.position.set(
            boardBounds.right / scale + sideGap / scale,
            boardCenterY - ui.targetPanel.panelHeight / 2
        );
        return;
    }

    // Màn hình compact đặt hai panel trên cùng một hàng.
    const compactWidth =
        ui.infoPanel.panelWidth + 12 + ui.targetPanel.panelWidth;
    const compactX = screenWidth / ui.scale.x / 2 - compactWidth / 2;
    ui.infoPanel.position.set(compactX, 12 / ui.scale.x);
    ui.targetPanel.position.set(
        compactX + ui.infoPanel.panelWidth + 12,
        12 / ui.scale.x
    );
}
