import { InputController } from "../InputController.js";
import { MonsterSkillManager } from "../skills/MonsterSkillManager.js";
import { SoundEffect } from "../../services/AudioManager.js";

/**
 * Dieu phoi mot luot noi quai, tinh diem, nap target va kich hoat skill.
 */
export class MatchController {
    constructor({
        board,
        hud,
        linkRenderer,
        audioManager,
        isBlocked,
        addTime,
    }) {
        this.board = board;
        this.hud = hud;
        this.audioManager = audioManager;
        this.isBlocked = isBlocked;
        this.addTime = addTime;
        this.score = 0;

        this.skillManager = this.createSkillManager();
        this.inputController = new InputController(
            board,
            linkRenderer,
            {
                // Input chi hoi rule, khong can biet skill Owl con bao lau.
                canConnect: (chain, candidate) =>
                    this.skillManager.canConnect(chain, candidate),
            }
        );

        this.handleChainCompleted =
            this.handleChainCompleted.bind(this);
        this.handleChainCancelled =
            this.handleChainCancelled.bind(this);
        this.board.on(
            "chainCompleted",
            this.handleChainCompleted
        );
        this.board.on(
            "chainCancelled",
            this.handleChainCancelled
        );
    }

    createSkillManager() {
        return new MonsterSkillManager({
            // Skill chi giao tiep voi gameplay qua cac callback nho.
            addTime: (seconds) => this.addTime(seconds),
            addScore: (score) => this.addScore(score),
            setBoardMultiplier: (monsterType, multiplier) => {
                this.board.setMonsterScoreMultiplier(
                    monsterType,
                    multiplier
                );
            },
            setCountdown: (monsterType, multiplier, seconds) => {
                this.hud.setSkillCountdown(
                    monsterType,
                    multiplier,
                    seconds
                );
            },
            setSkillTimer: (monsterType, label, seconds) => {
                this.hud.setSkillTimer(
                    monsterType,
                    label,
                    seconds
                );
            },
            setMonsterDisplayType: (monsterType, displayType) => {
                this.board.setMonsterDisplayType(
                    monsterType,
                    displayType
                );
            },
            getMonstersByType: (monsterType) =>
                this.board.getMonstersByType(monsterType),
            showFeedback: (monsterType, text) => {
                this.hud.showTargetSkillFeedback(
                    monsterType,
                    text
                );
            },
        });
    }

    handleChainCompleted({ monsters }) {
        if (this.isBlocked()) {
            return;
        }

        this.audioManager.playSoundEffect(SoundEffect.MATCH);

        // Owl active van tinh diem, nhung Owl khong duoc nap lai target.
        const targetCollectibleMonsters =
            this.skillManager.getTargetCollectibleMonsters(monsters);
        // Diem dung buff cu; skill vua nap day chi ap dung tu luot sau.
        const activatedSkills = this.hud.collect(
            targetCollectibleMonsters
        );

        this.addScore(
            this.skillManager.calculateCollectionScore(monsters)
        );

        // Context dung chung ngan cac skill trong mot luot xu ly trung quai.
        const activationContext = {
            claimedMonsters: new Set(),
        };
        const monstersToClear = new Set(monsters);

        activatedSkills.forEach((monsterType) => {
            const result = this.skillManager.activate(
                monsterType,
                activationContext
            );

            result?.monstersToClear?.forEach((monster) => {
                monstersToClear.add(monster);
            });
        });

        // Chi refill mot lan de tranh nhieu animation cung sua board.
        void this.board.resolveChain([...monstersToClear]);
    }

    handleChainCancelled({ reason }) {
        if (reason === "released" && !this.isBlocked()) {
            this.audioManager.playSoundEffect(
                SoundEffect.MATCH_FAIL
            );
        }
    }

    addScore(score) {
        const previousScore = this.score;
        this.score += score;
        this.hud.showScoreIncrease(previousScore, score);
    }

    update(deltaMilliseconds) {
        this.skillManager.update(deltaMilliseconds);
    }

    destroy() {
        this.board.off(
            "chainCompleted",
            this.handleChainCompleted
        );
        this.board.off(
            "chainCancelled",
            this.handleChainCancelled
        );
        this.inputController.destroy();
        this.skillManager.destroy();
    }
}
