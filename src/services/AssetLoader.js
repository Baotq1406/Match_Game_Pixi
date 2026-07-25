import { Assets } from "pixi.js";

export const AssetId = Object.freeze({
    BASKET: "basket",
});

const GAME_ASSETS = [
    {
        alias: AssetId.BASKET,
        src: "/assets/Basket.png",
    },
];

export class AssetLoader {
    static loadPromise = null;

    static load() {
        if (!this.loadPromise) {
            this.loadPromise = Assets.load(GAME_ASSETS);
        }

        return this.loadPromise;
    }

    static get(assetId) {
        const asset = Assets.get(assetId);

        if (!asset) {
            throw new Error(
                `Asset "${assetId}" chưa được tải. Hãy gọi AssetLoader.load() trước.`
            );
        }

        return asset;
    }
}

