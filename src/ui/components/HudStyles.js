import { Graphics } from "pixi.js";

export const HUD_COLORS = Object.freeze({
    panel: 0x241a2c,
    panelAlpha: 0.94,
    border: 0xf0b64d,
    accent: 0x64f4ff,
    mutedText: 0xe5c98b,
    targetFill: 0x72d992,
});

export function createPanel(width, height, radius, borderWidth) {
    return new Graphics()
        .roundRect(0, 0, width, height, radius)
        .fill({ color: HUD_COLORS.panel, alpha: HUD_COLORS.panelAlpha })
        .stroke({ color: HUD_COLORS.border, width: borderWidth });
}

export function redrawPanel(graphics, width, height, radius, borderWidth) {
    graphics
        .clear()
        .roundRect(0, 0, width, height, radius)
        .fill({ color: HUD_COLORS.panel, alpha: HUD_COLORS.panelAlpha })
        .stroke({ color: HUD_COLORS.border, width: borderWidth });
}

export function fitSprite(sprite, maximumSize) {
    const scale = Math.min(
        maximumSize / sprite.texture.width,
        maximumSize / sprite.texture.height
    );
    sprite.scale.set(scale);
}
