// Cau hinh tap trung de gameplay, board va UI dung chung mot nguon gia tri.
export const GameConfig = Object.freeze({
    designWidth: 680,
    designHeight: 680,
    viewportPaddingRatio: 0.025,
    roundDurationSeconds: 120,
    targetScore: 500,
    targetMonsterCount: 20,

    monsterSkills: Object.freeze({
        cat: Object.freeze({
            bonusSeconds: 10,
        }),
        pig: Object.freeze({
            bonusScore: 20,
        }),
        sheep: Object.freeze({
            scoreMultiplier: 2,
            durationSeconds: 20,
        }),
        rabbit: Object.freeze({
            pointsPerMonster: 1,
        }),
        owl: Object.freeze({
            durationSeconds: 20,
            cycleIntervalMilliseconds: 500,
        }),
    }),

    board: Object.freeze({
        rows: 8,
        columns: 8,
        cellSize: 80,
        cellGap: 6,
        cellBackgroundColor: 0x3b2418,
        cellBackgroundAlpha: 0.82,
        cellBorderColor: 0xf0b64d,
        cellBorderWidth: 2,
        cellBorderRadius: 8,
        cellHoverGlowColor: 0x64f4ff,
        cellHoverGlowAlpha: 0.38,
        cellHoverGlowWidth: 6,
        linkGlowColor: 0x54f6ff,
        linkGlowAlpha: 0.36,
        linkGlowWidth: 12,
        linkCoreColor: 0xffffff,
        linkCoreAlpha: 0.95,
        linkCoreWidth: 3,
        monsterSizeRatio: 0.82,
        monsterDropDuration: 280,
        monsterDropStagger: 20,
        monsterDropStartOffset: 1,
        minimumInitialChain: 3,
    }),
});
