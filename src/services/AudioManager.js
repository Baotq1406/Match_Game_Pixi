export const MusicTrack = Object.freeze({
    GAME: "/sounds/Background music/Background_music.wav",
    RESULT: "/sounds/Background music/Background_music_for_game_over.mp3",
});

export const SoundEffect = Object.freeze({
    MATCH: "/sounds/Sound effect/Match_sound.wav",
    MATCH_FAIL: "/sounds/Sound effect/Match_Fail_sound.wav",
    TIME_WARNING:
        "/sounds/Sound effect/Time_passing_sound_effect_fast_clock.mp3",
    GAME_OVER: "/sounds/Sound effect/Sound_game_over.mp3",
});

/**
 * Quan ly nhac nen va xu ly gioi han autoplay cua trinh duyet.
 */
export class AudioManager {
    constructor({ musicVolume = 0.2, soundEffectVolume = 0.55 } = {}) {
        this.music = new Audio();
        this.music.loop = true;
        this.music.volume = musicVolume;
        this.soundEffectVolume = soundEffectVolume;
        this.currentTrack = null;
        this.unlockHandler = null;
        this.activeEffects = new Set();
        this.warningSound = null;
    }

    playMusic(track) {
        if (this.currentTrack !== track) {
            // Doi track phai dung va dua nhac cu ve dau truoc khi phat nhac moi.
            this.music.pause();
            this.music.currentTime = 0;
            this.music.src = track;
            this.currentTrack = track;
        }

        this.tryPlay();
    }

    tryPlay() {
        void this.music.play().catch(() => this.waitForUserGesture());
    }

    waitForUserGesture() {
        if (this.unlockHandler) {
            return;
        }

        // Trinh duyet chi cho phep bat nhac sau thao tac cua nguoi choi.
        this.unlockHandler = () => {
            window.removeEventListener("pointerdown", this.unlockHandler);
            window.removeEventListener("keydown", this.unlockHandler);
            this.unlockHandler = null;
            this.tryPlay();
        };
        window.addEventListener("pointerdown", this.unlockHandler, {
            once: true,
        });
        window.addEventListener("keydown", this.unlockHandler, {
            once: true,
        });
    }

    stopMusic() {
        this.music.pause();
        this.music.currentTime = 0;
    }

    playSoundEffect(effect) {
        // Tao audio rieng de cac lan match lien tiep khong cat am thanh cua nhau.
        const sound = new Audio(effect);
        sound.volume = this.soundEffectVolume;
        this.activeEffects.add(sound);
        sound.addEventListener(
            "ended",
            () => this.activeEffects.delete(sound),
            { once: true }
        );
        void sound.play().catch(() => this.activeEffects.delete(sound));
    }

    startTimeWarning() {
        if (!this.warningSound) {
            this.warningSound = new Audio(SoundEffect.TIME_WARNING);
            this.warningSound.loop = true;
            this.warningSound.volume = this.soundEffectVolume * 0.5;
        }

        void this.warningSound.play().catch(() => this.waitForUserGesture());
    }

    stopTimeWarning() {
        if (!this.warningSound) {
            return;
        }

        this.warningSound.pause();
        this.warningSound.currentTime = 0;
    }

    destroy() {
        this.stopMusic();
        this.stopTimeWarning();

        for (const sound of this.activeEffects) {
            sound.pause();
        }
        this.activeEffects.clear();

        if (this.unlockHandler) {
            window.removeEventListener("pointerdown", this.unlockHandler);
            window.removeEventListener("keydown", this.unlockHandler);
            this.unlockHandler = null;
        }

        this.music.removeAttribute("src");
        this.currentTrack = null;
    }
}
