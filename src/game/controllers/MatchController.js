import { InputController } from "../InputController.js";
import { MonsterSkillManager } from "../skills/MonsterSkillManager.js";
import { SoundEffect } from "../../services/AudioManager.js";

/**
 * Điều phối một lượt nối quái, tính điểm, nạp target và kích hoạt skill.
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
                // Input chỉ hỏi rule, không cần biết skill Owl còn bao lâu.
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
            // Skill chỉ giao tiếp với gameplay qua các callback nhỏ.
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

        // Owl active vẫn tính điểm, nhưng Owl không được nạp lại target.
        const targetCollectibleMonsters =
            this.skillManager.getTargetCollectibleMonsters(monsters);
        // Điểm dùng buff cũ; skill vừa nạp đầy chỉ áp dụng từ lượt sau.
        const activatedSkills = this.hud.collect(
            targetCollectibleMonsters
        );

        this.addScore(
            this.skillManager.calculateCollectionScore(monsters)
        );

        // Context dùng chung ngăn các skill trong một lượt xử lý trùng quái.
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

        // Chỉ refill một lần để tránh nhiều animation cùng sửa board.
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
