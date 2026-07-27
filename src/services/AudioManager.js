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
 * Quản lý nhạc nền và xử lý giới hạn autoplay của trình duyệt.
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
            // Đổi track phải dừng và đưa nhạc cũ về đầu trước khi phát nhạc mới.
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

        // Trình duyệt chỉ cho phép bật nhạc sau thao tác của người chơi.
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
        // Tạo audio riêng để các lần match liên tiếp không cắt âm thanh của nhau.
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
