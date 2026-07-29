import { Application } from "pixi.js";
import { GameManager } from "./core/GameManager.js";
import { LoadingScreen } from "./ui/LoadingScreen.js";
import "../public/style.css";

function waitForNextFrame() {
    return new Promise((resolve) => requestAnimationFrame(resolve));
}

// Điểm khởi động của ứng dụng PixiJS.
async function main() {
    LoadingScreen.show("Đang khởi tạo đồ họa...");
    LoadingScreen.update(0.02);

    const app = new Application();

    await app.init({
        resizeTo: window,
        backgroundColor: 0x17172f,
        antialias: true,
        resolution: Math.min(window.devicePixelRatio, 2),
        autoDensity: true,
    });

    document.body.appendChild(app.canvas);
    LoadingScreen.update(0.08, "Đang tải tài nguyên...");

    const gameManager = GameManager.getInstance(app);
    await gameManager.start((progress) => {
        LoadingScreen.update(
            0.08 + progress * 0.92,
            "Đang tải màn hình chính..."
        );
    });

    // Chờ canvas vẽ StartState ít nhất một frame rồi mới fade loader.
    await waitForNextFrame();
    LoadingScreen.update(1, "Sẵn sàng!");
    LoadingScreen.hide();
}

main().catch((error) => {
    LoadingScreen.showError();
    console.error("Không thể khởi động game:", error);
});
