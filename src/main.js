import { Application } from "pixi.js";
import { GameManager } from "./core/GameManager.js";
import "../public/style.css";

// Điểm khởi động của ứng dụng PixiJS.
async function main() {
    const app = new Application();

    await app.init({
        resizeTo: window,
        backgroundColor: 0x17172f,
        antialias: true,
        resolution: Math.min(window.devicePixelRatio, 2),
        autoDensity: true,
    });

    document.body.appendChild(app.canvas);

    const gameManager = GameManager.getInstance(app);
    await gameManager.start();
}

main().catch((error) => {
    console.error("Không thể khởi động game:", error);
});
