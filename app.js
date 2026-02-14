const QUESTIONS = [
  {
    prompt: "What city did we first meet?",
    options: ["Houston", "Navasota", "Bryan"],
  },
  {
    prompt: "How many hackathons have we done together?",
    options: ["Two", "One", "Zero"],
  },
  {
    prompt: "What food are we planning on making soon?",
    options: ["Biscoff Cheesecake", "Ocean Water", "Mai Shen Yun"],
  },
];

const FEEDBACKS = ["Correct!", "Oh... that's not...", "Yurppp", "Goooood answer", "Good job king!"];

const progress = document.getElementById("progress");
const progressLabel = document.getElementById("progress-label");
const progressFill = document.getElementById("progress-fill");
const cardTitle = document.getElementById("card-title");
const cardSubtitle = document.getElementById("card-subtitle");
const questionText = document.getElementById("question-text");
const answers = document.getElementById("answers");
const startBtn = document.getElementById("start-btn");
const feedback = document.getElementById("feedback");
const content = document.getElementById("content");
const success = document.getElementById("success");

let currentStep = 0;
let isLocked = false;

function setVisible(el, visible) {
  el.classList.toggle("hidden", !visible);
}

function setProgress(step) {
  if (step === 0) {
    setVisible(progress, false);
    return;
  }
  setVisible(progress, true);
  progressLabel.textContent = `Step ${step} of 4`;
  progressFill.style.width = `${(step / 4) * 100}%`;
}

function clearAnswers() {
  answers.innerHTML = "";
  answers.classList.remove("final");
  answers.removeAttribute("style");
}

function showFeedback() {
  const text = FEEDBACKS[Math.floor(Math.random() * FEEDBACKS.length)];
  feedback.textContent = text;
}

function renderTitleStep() {
  setProgress(0);
  cardTitle.textContent = "How well do you remember us?";
  cardSubtitle.textContent = "Three quick questions (and one big one)!";
  questionText.textContent = "";
  clearAnswers();
  setVisible(startBtn, true);
  setVisible(success, false);
  setVisible(content, true);
  feedback.textContent = "";
  startBtn.focus();
}

function renderQuestionStep(stepIndex) {
  setProgress(stepIndex);
  const data = QUESTIONS[stepIndex - 1];
  cardTitle.textContent = `Question ${stepIndex}`;
  cardSubtitle.textContent = "";
  questionText.textContent = data.prompt;
  clearAnswers();
  setVisible(startBtn, false);
  setVisible(success, false);
  setVisible(content, true);
  feedback.textContent = "";

  data.options.forEach((option) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "nes-btn";
    btn.textContent = option;
    btn.setAttribute("aria-label", option);
    btn.addEventListener("click", () => {
      if (isLocked) return;
      isLocked = true;
      [...answers.querySelectorAll("button")].forEach((b) => (b.disabled = true));
      showFeedback();
      setTimeout(() => {
        isLocked = false;
        currentStep += 1;
        renderStep();
      }, 600);
    });
    answers.appendChild(btn);
  });
}

let lastNoPos = null;

function moveNoButton(noBtn) {
  const padding = 8;

  noBtn.classList.add("free");

  const maxLeft = Math.max(0, answers.clientWidth - noBtn.offsetWidth - padding);
  const maxTop = Math.max(0, answers.clientHeight - noBtn.offsetHeight - padding);

  const minDistance = 90;
  let left, top, tries = 0;

  do {
	left = padding + Math.random() * maxLeft;
	top = padding + Math.random() * maxTop;
	tries += 1;
  } while ( lastnoPos && Math.hypot(left - lastnoPos.left, top - lastNoPos.top) < minDist && tries < 25);
  lastNoPos = {left, top};
  noBtn.style.left = '${left}px';
  noBtn.style.top = '${top}px';
}

function renderFinalStep() {
  setProgress(4);
  cardTitle.textContent = "Will you be my Valentine?";
  cardSubtitle.textContent = "";
  questionText.textContent = "";
  clearAnswers();
  setVisible(startBtn, false);
  setVisible(success, false);
  setVisible(content, true);
  feedback.textContent = "";
  answers.classList.add("final");

  const yesBtn = document.createElement("button");
  yesBtn.type = "button";
  yesBtn.className = "nes-btn is-primary big-btn";
  yesBtn.textContent = "Yes";
  yesBtn.style.top = "0px";
  yesBtn.setAttribute("aria-label", "Yes");
  yesBtn.addEventListener("click", () => {
    setVisible(content, false);
    setVisible(progress, false);
    setVisible(success, true);
  });

  const noBtn = document.createElement("button");
  noBtn.type = "button";
  noBtn.className = "nes-btn is-error big-btn no-btn";
  noBtn.textContent = "No";
  noBtn.style.top = "84px";
  noBtn.setAttribute("aria-label", "No");
  noBtn.addEventListener("click", () => moveNoButton(noBtn));

  answers.appendChild(yesBtn);
  answers.appendChild(noBtn);
}

function renderStep() {
  if (currentStep === 0) {
    renderTitleStep();
    return;
  }
  if (currentStep >= 1 && currentStep <= 3) {
    renderQuestionStep(currentStep);
    return;
  }
  renderFinalStep();
}

startBtn.addEventListener("click", () => {
  currentStep = 1;
  renderStep();
});

renderStep();
