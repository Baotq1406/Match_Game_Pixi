const screen = document.querySelector("#loading-screen");
const message = document.querySelector("#loading-message");
const progress = document.querySelector(".loading-progress");
const progressBar = document.querySelector("#loading-progress-bar");
const percentage = document.querySelector("#loading-percentage");

function clampProgress(value) {
    return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

export const LoadingScreen = Object.freeze({
    show(label = "Đang tải game...") {
        message.textContent = label;
        screen.classList.remove("is-hidden");
        screen.setAttribute("aria-hidden", "false");
    },

    update(value, label) {
        const normalizedValue = clampProgress(value);
        const percent = Math.round(normalizedValue * 100);

        progressBar.style.width = `${percent}%`;
        progress.setAttribute("aria-valuenow", String(percent));
        percentage.textContent = `${percent}%`;

        if (label) {
            message.textContent = label;
        }
    },

    hide() {
        screen.classList.add("is-hidden");
        screen.setAttribute("aria-hidden", "true");
    },

    showError() {
        this.show("Không thể tải game. Hãy kiểm tra mạng và tải lại trang.");
        percentage.textContent = "!";
    },
});
