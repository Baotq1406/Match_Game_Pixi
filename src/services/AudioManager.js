export const MusicTrack = Object.freeze({
    GAME: "/sounds/Background music/Background_music.mp3",
    RESULT: "/sounds/Background music/Background_music_for_game_over.mp3",
});

export const SoundEffect = Object.freeze({
    MATCH: "/sounds/Sound effect/Match_sound.mp3",
    MATCH_FAIL: "/sounds/Sound effect/Match_Fail_sound.mp3",
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
        this.music.preload = "auto";
        this.soundEffectVolume = soundEffectVolume;
        this.currentTrack = null;
        this.unlockHandler = null;
        this.activeEffects = new Set();
        this.warningSound = null;
        this.effectPools = new Map();

        this.preloadSoundEffects();
    }

    preloadSoundEffects() {
        for (const effect of Object.values(SoundEffect)) {
            // Nhiều audio được chuẩn bị sẵn để các match liên tiếp có thể chồng âm
            // mà không phải tạo, tải và decode file ngay tại thời điểm match.
            this.effectPools.set(
                effect,
                Array.from({ length: 3 }, () =>
                    this.createSoundEffectAudio(effect)
                )
            );
        }
    }

    createSoundEffectAudio(effect) {
        const sound = new Audio();
        sound.preload = "auto";
        sound.volume = this.soundEffectVolume;
        sound.src = effect;
        sound.addEventListener("ended", () => {
            this.activeEffects.delete(sound);
        });
        sound.load();
        return sound;
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
        const pool = this.effectPools.get(effect) ?? [];
        let sound = pool.find((candidate) => candidate.paused);

        // Pool ba phần tử đủ cho thao tác thông thường; vẫn cho phép chồng thêm
        // nếu người chơi tạo hiệu ứng nhanh hơn thời lượng của file âm thanh.
        if (!sound) {
            sound = this.createSoundEffectAudio(effect);
            pool.push(sound);
            this.effectPools.set(effect, pool);
        }

        sound.currentTime = 0;
        this.activeEffects.add(sound);
        void sound.play().catch(() => this.activeEffects.delete(sound));
    }

    startTimeWarning() {
        if (!this.warningSound) {
            this.warningSound = new Audio(SoundEffect.TIME_WARNING);
            this.warningSound.preload = "auto";
            this.warningSound.loop = true;
            this.warningSound.volume = this.soundEffectVolume * 0.5;
            this.warningSound.load();
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

        for (const pool of this.effectPools.values()) {
            for (const sound of pool) {
                sound.pause();
                sound.removeAttribute("src");
            }
        }
        this.effectPools.clear();

        if (this.unlockHandler) {
            window.removeEventListener("pointerdown", this.unlockHandler);
            window.removeEventListener("keydown", this.unlockHandler);
            this.unlockHandler = null;
        }

        this.music.removeAttribute("src");
        this.currentTrack = null;
    }
}
