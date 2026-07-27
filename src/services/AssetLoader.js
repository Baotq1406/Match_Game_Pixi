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

export const MONSTER_ASSET_IDS = Object.freeze([
    AssetId.MONSTER_CAT,
    AssetId.MONSTER_PIG,
    AssetId.MONSTER_SHEEP,
    AssetId.MONSTER_RABBIT,
    AssetId.MONSTER_OWL,
]);

const TARGET_ANIMATION_FRAME_COUNT = 13;

// Thu muc va tien to frame cua tung quai da duoc normalize cung kich thuoc.
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
    // Frame 1 dung alias monsterType co san; chi can tai them frame 2 den 13.
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
                    src: `/assets/MonsterNormalized/${source.folder}/${source.frameName}_${frameNumber}.png`,
                };
            }
        );
    });
}

const GAME_ASSETS = [
    {
        alias: AssetId.BASKET,
        src: "/assets/Basket.png",
    },
    {
        alias: AssetId.BACKGROUND_GAME_START,
        src: "/assets/Background/Background_Game_Start.png",
    },
    {
        alias: AssetId.BACKGROUND_GAME_START_MOBILE,
        src: "/assets/Background/Background_For_Mobile_Game_Start.png",
    },
    {
        alias: AssetId.BACKGROUND_GAME_OVER,
        src: "/assets/Background/Background_game_over.png",
    },
    {
        alias: AssetId.BACKGROUND_GAME_OVER_MOBILE,
        src: "/assets/Background/Background_game_over_for_mobile.png",
    },
    {
        alias: AssetId.POPUP_GAME_OVER,
        src: "/assets/Pop_up/Pop_up_game_over.png",
    },
    {
        alias: AssetId.BUTTON_START_NORMAL,
        src: "/assets/Button/Button_start_normal.png",
    },
    {
        alias: AssetId.BUTTON_START_HOVER,
        src: "/assets/Button/Button_start_hover.png",
    },
    {
        alias: AssetId.BUTTON_GUIDE_NORMAL,
        src: "/assets/Button/Button_guide_normal.png",
    },
    {
        alias: AssetId.BUTTON_GUIDE_HOVER,
        src: "/assets/Button/Button_guide_hover.png",
    },
    {
        alias: AssetId.BUTTON_HOME_NORMAL,
        src: "/assets/Button/button_home_normal.png",
    },
    {
        alias: AssetId.BUTTON_HOME_HOVER,
        src: "/assets/Button/button_home_hover.png",
    },
    {
        alias: AssetId.BUTTON_RETRY_NORMAL,
        src: "/assets/Button/button_retry_normal.png",
    },
    {
        alias: AssetId.BUTTON_RETRY_HOVER,
        src: "/assets/Button/button_retry_hover.png",
    },
    {
        alias: AssetId.BUTTON_PAUSE_NORMAL,
        src: "/assets/Button/Button_pause_normal.png",
    },
    {
        alias: AssetId.BUTTON_PAUSE_HOVER,
        src: "/assets/Button/Button_pause_hover.png",
    },
    {
        alias: AssetId.MONSTER_CAT,
        src: "/assets/MonsterNormalized/Cam/Cat_1.png",
    },
    {
        alias: AssetId.MONSTER_PIG,
        src: "/assets/MonsterNormalized/Hong/Pig_1.png",
    },
    {
        alias: AssetId.MONSTER_SHEEP,
        src: "/assets/MonsterNormalized/Tim/Sheep_1.png",
    },
    {
        alias: AssetId.MONSTER_RABBIT,
        src: "/assets/MonsterNormalized/Trang/Rabbit_1.png",
    },
    {
        alias: AssetId.MONSTER_OWL,
        src: "/assets/MonsterNormalized/Xanh_la/Owl_1.png",
    },
    ...createTargetAnimationAssets(),
];

/**
 * Tai asset mot lan va cung cap texture theo alias.
 */
export class AssetLoader {
    static loadPromise = null;

    static load() {
        // Dung chung promise de tranh tai trung asset khi goi nhieu lan.
        if (!this.loadPromise) {
            this.loadPromise = Assets.load(GAME_ASSETS);
        }

        return this.loadPromise;
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
        // Tra ve dung thu tu frame de AnimatedSprite lap animation tu 1 den 13.
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
