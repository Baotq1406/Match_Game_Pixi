import { Assets } from "pixi.js";

export const AssetId = Object.freeze({
    BASKET: "basket",
    BACKGROUND_GAME_START: "background-game-start",
    BACKGROUND_GAME_START_MOBILE: "background-game-start-mobile",
    BACKGROUND_GAME_OVER: "background-game-over",
    BACKGROUND_GAME_OVER_MOBILE: "background-game-over-mobile",
    POPUP_GAME_OVER: "popup-game-over",
    BUTTON_START_NORMAL: "button-start-normal",
    BUTTON_START_HOVER: "button-start-hover",
    BUTTON_GUIDE_NORMAL: "button-guide-normal",
    BUTTON_GUIDE_HOVER: "button-guide-hover",
    BUTTON_HOME_NORMAL: "button-home-normal",
    BUTTON_HOME_HOVER: "button-home-hover",
    BUTTON_RETRY_NORMAL: "button-retry-normal",
    BUTTON_RETRY_HOVER: "button-retry-hover",
    BUTTON_PAUSE_NORMAL: "button-pause-normal",
    BUTTON_PAUSE_HOVER: "button-pause-hover",
    MONSTER_CAT: "monster-cat",
    MONSTER_PIG: "monster-pig",
    MONSTER_SHEEP: "monster-sheep",
    MONSTER_RABBIT: "monster-rabbit",
    MONSTER_OWL: "monster-owl",
});

export const AssetBundle = Object.freeze({
    START: "start",
    GAMEPLAY: "gameplay",
    RESULT: "result",
});

export const MONSTER_ASSET_IDS = Object.freeze([
    AssetId.MONSTER_CAT,
    AssetId.MONSTER_PIG,
    AssetId.MONSTER_SHEEP,
    AssetId.MONSTER_RABBIT,
    AssetId.MONSTER_OWL,
]);

const TARGET_ANIMATION_FRAME_COUNT = 13;

// Thư mục và tiền tố frame của từng quái đã được normalize cùng kích thước.
const MONSTER_ANIMATION_SOURCES = Object.freeze({
    [AssetId.MONSTER_CAT]: { folder: "Cam", frameName: "Cat" },
    [AssetId.MONSTER_PIG]: { folder: "Hong", frameName: "Pig" },
    [AssetId.MONSTER_SHEEP]: { folder: "Tim", frameName: "Sheep" },
    [AssetId.MONSTER_RABBIT]: { folder: "Trang", frameName: "Rabbit" },
    [AssetId.MONSTER_OWL]: { folder: "Xanh_la", frameName: "Owl" },
});

function getMonsterFrameAssetId(monsterType, frameNumber) {
    return `${monsterType}-frame-${frameNumber}`;
}

function createTargetAnimationAssets() {
    // Frame 1 dùng alias monsterType có sẵn; chỉ cần tải thêm frame 2 đến 13.
    return MONSTER_ASSET_IDS.flatMap((monsterType) => {
        const source = MONSTER_ANIMATION_SOURCES[monsterType];

        return Array.from(
            { length: TARGET_ANIMATION_FRAME_COUNT - 1 },
            (_, index) => {
                const frameNumber = index + 2;

                return {
                    alias: getMonsterFrameAssetId(
                        monsterType,
                        frameNumber
                    ),
                    src: `/assets/MonsterNormalized/${source.folder}/${source.frameName}_${frameNumber}.webp`,
                };
            }
        );
    });
}

const START_ASSETS = [
    {
        alias: AssetId.BACKGROUND_GAME_START,
        src: "/assets/Background/Background_Game_Start.webp",
    },
    {
        alias: AssetId.BACKGROUND_GAME_START_MOBILE,
        src: "/assets/Background/Background_For_Mobile_Game_Start.webp",
    },
    {
        alias: AssetId.BUTTON_START_NORMAL,
        src: "/assets/Button/Button_start_normal.webp",
    },
    {
        alias: AssetId.BUTTON_START_HOVER,
        src: "/assets/Button/Button_start_hover.webp",
    },
    {
        alias: AssetId.BUTTON_GUIDE_NORMAL,
        src: "/assets/Button/Button_guide_normal.webp",
    },
    {
        alias: AssetId.BUTTON_GUIDE_HOVER,
        src: "/assets/Button/Button_guide_hover.webp",
    },
];

const GAMEPLAY_ASSETS = [
    {
        alias: AssetId.BASKET,
        src: "/assets/Basket.webp",
    },
    {
        alias: AssetId.BUTTON_PAUSE_NORMAL,
        src: "/assets/Button/Button_pause_normal.webp",
    },
    {
        alias: AssetId.BUTTON_PAUSE_HOVER,
        src: "/assets/Button/Button_pause_hover.webp",
    },
    {
        alias: AssetId.MONSTER_CAT,
        src: "/assets/MonsterNormalized/Cam/Cat_1.webp",
    },
    {
        alias: AssetId.MONSTER_PIG,
        src: "/assets/MonsterNormalized/Hong/Pig_1.webp",
    },
    {
        alias: AssetId.MONSTER_SHEEP,
        src: "/assets/MonsterNormalized/Tim/Sheep_1.webp",
    },
    {
        alias: AssetId.MONSTER_RABBIT,
        src: "/assets/MonsterNormalized/Trang/Rabbit_1.webp",
    },
    {
        alias: AssetId.MONSTER_OWL,
        src: "/assets/MonsterNormalized/Xanh_la/Owl_1.webp",
    },
    ...createTargetAnimationAssets(),
];

const RESULT_ASSETS = [
    {
        alias: AssetId.BACKGROUND_GAME_OVER,
        src: "/assets/Background/Background_game_over.webp",
    },
    {
        alias: AssetId.BACKGROUND_GAME_OVER_MOBILE,
        src: "/assets/Background/Background_game_over_for_mobile.webp",
    },
    {
        alias: AssetId.POPUP_GAME_OVER,
        src: "/assets/Pop_up/Pop_up_game_over.webp",
    },
    {
        alias: AssetId.BUTTON_HOME_NORMAL,
        src: "/assets/Button/button_home_normal.webp",
    },
    {
        alias: AssetId.BUTTON_HOME_HOVER,
        src: "/assets/Button/button_home_hover.webp",
    },
    {
        alias: AssetId.BUTTON_RETRY_NORMAL,
        src: "/assets/Button/button_retry_normal.webp",
    },
    {
        alias: AssetId.BUTTON_RETRY_HOVER,
        src: "/assets/Button/button_retry_hover.webp",
    },
];

const ASSET_BUNDLES = Object.freeze({
    [AssetBundle.START]: START_ASSETS,
    [AssetBundle.GAMEPLAY]: GAMEPLAY_ASSETS,
    [AssetBundle.RESULT]: RESULT_ASSETS,
});

/**
 * Tải asset một lần và cung cấp texture theo alias.
 */
export class AssetLoader {
    static loadPromises = new Map();
    static bundleProgress = new Map();
    static progressListeners = new Map();

    static load(bundle = AssetBundle.START, onProgress) {
        const assets = ASSET_BUNDLES[bundle];

        if (!assets) {
            return Promise.reject(new Error(`Unknown asset bundle: ${bundle}`));
        }

        if (onProgress) {
            const listeners = this.progressListeners.get(bundle) ?? new Set();
            listeners.add(onProgress);
            this.progressListeners.set(bundle, listeners);
            onProgress(this.bundleProgress.get(bundle) ?? 0);
        }
        // Dùng chung promise để tránh tải trùng asset khi gọi nhiều lần.
        if (!this.loadPromises.has(bundle)) {
            const loadPromise = Assets.load(assets, (progress) => {
                this.updateBundleProgress(bundle, progress);
            }).then((loadedAssets) => {
                this.updateBundleProgress(bundle, 1);
                return loadedAssets;
            }).catch((error) => {
                // Cho phép thử tải lại nếu mạng chập chờn ở lần đầu.
                this.loadPromises.delete(bundle);
                this.updateBundleProgress(bundle, 0);
                throw error;
            });

            this.loadPromises.set(bundle, loadPromise);
        }

        const loadPromise = this.loadPromises.get(bundle);
        return loadPromise.finally(() => {
            this.progressListeners.get(bundle)?.delete(onProgress);
        });
    }

    static updateBundleProgress(bundle, progress) {
        this.bundleProgress.set(bundle, progress);
        this.progressListeners.get(bundle)?.forEach((listener) => {
            listener(progress);
        });
    }

    static isLoaded(bundle) {
        return this.bundleProgress.get(bundle) === 1;
    }

    static get(assetId) {
        const asset = Assets.get(assetId);

        if (!asset) {
            throw new Error(
                `Asset "${assetId}" is not loaded. Call AssetLoader.load() first.`
            );
        }

        return asset;
    }

    static getAnimationFrames(monsterType) {
        // Trả về đúng thứ tự frame để AnimatedSprite lặp animation từ 1 đến 13.
        return Array.from(
            { length: TARGET_ANIMATION_FRAME_COUNT },
            (_, index) => {
                const frameNumber = index + 1;
                const assetId =
                    frameNumber === 1
                        ? monsterType
                        : getMonsterFrameAssetId(monsterType, frameNumber);

                return this.get(assetId);
            }
        );
    }
}
