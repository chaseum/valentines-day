const QUESTIONS = [
  {
    prompt: "What city did we first meet?",
    options: ["Houston", "Navasota", "Bryan"],
    correctIndex: 1,
    imageSrc: "assets/IMG_7447.JPG",
    imageAlt: "Memory photo for question one",
    imagePosition: "50% 35%",
  },
  {
    prompt: "What day did we first start talking?",
    options: ["May 28", "Sep 19", "July 9"],
    correctIndex: 2,
  },
  {
    prompt: "How many hackathons have we done together?",
    options: ["Two", "One", "Zero"],
    correctIndex: 0,
    imageSrc: "assets/IMG_7448.JPG",
    imageAlt: "Memory photo for question three",
    imagePosition: "50% 58%",
  },
  {
    prompt: "What food are we planning on making soon?",
    options: ["Mai Shen Yun", "Ocean Water", "Biscoff Cheesecake"],
    correctIndex: 2,
  },
];

const FEEDBACKS = ["Correct!", "Yurppp", "Goooood answer", "Good job king!", "The bear gets one point!"];
const WRONGFEEDBACKS = ["Oh... that's not...", "Yo how did you get this wrong", "Blake let's be serious come on...", "WRONG ANSWER NEPHEW!!"];
const FEEDBACK_DELAY_MS = 1400;
const NO_MOVE_COOLDOWN_MS = 700;
const TOTAL_STEPS = QUESTIONS.length + 1;
const FINAL_PROMPT_IMAGE = {
  src: "assets/IMG_0667.JPEG",
  alt: "Photo for the Valentine question",
  position: "50% 30%",
};

const progress = document.getElementById("progress");
const progressLabel = document.getElementById("progress-label");
const progressFill = document.getElementById("progress-fill");
const cardTitle = document.getElementById("card-title");
const cardSubtitle = document.getElementById("card-subtitle");
const stepImage = document.getElementById("step-image");
const questionText = document.getElementById("question-text");
const answers = document.getElementById("answers");
const startBtn = document.getElementById("start-btn");
const feedback = document.getElementById("feedback");
const content = document.getElementById("content");
const success = document.getElementById("success");

let currentStep = 0;
let isLocked = false;
let noButtonReadyAt = 0;
let noButtonCooldownTimer = null;
let remainingCorrectFeedbacks = [];
let remainingWrongFeedbacks = [];
let lastShownFeedback = "";

function setVisible(el, visible) {
  el.classList.toggle("hidden", !visible);
}

function setProgress(step) {
  if (step === 0) {
    setVisible(progress, false);
    return;
  }
  setVisible(progress, true);
  progressLabel.textContent = `Step ${step} of ${TOTAL_STEPS}`;
  progressFill.style.width = `${(step / TOTAL_STEPS) * 100}%`;
}

function clearAnswers() {
  answers.innerHTML = "";
  answers.classList.remove("final");
  answers.removeAttribute("style");
}

function shuffled(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function refillFeedbackPool(pool) {
  const next = shuffled(pool);
  if (next.length > 1 && next[next.length - 1] === lastShownFeedback) {
    [next[0], next[next.length - 1]] = [next[next.length - 1], next[0]];
  }
  return next;
}

function showFeedback(isCorrect) {
  if (isCorrect && remainingCorrectFeedbacks.length === 0) {
    remainingCorrectFeedbacks = refillFeedbackPool(FEEDBACKS);
  }
  if (!isCorrect && remainingWrongFeedbacks.length === 0) {
    remainingWrongFeedbacks = refillFeedbackPool(WRONGFEEDBACKS);
  }
  const bucket = isCorrect ? remainingCorrectFeedbacks : remainingWrongFeedbacks;
  const text = bucket.pop();
  lastShownFeedback = text;
  feedback.textContent = text;
}

function setStepImage(src, alt, position) {
  if (!src) {
    stepImage.removeAttribute("src");
    stepImage.alt = "";
    stepImage.style.objectPosition = "";
    setVisible(stepImage, false);
    return;
  }
  stepImage.src = src;
  stepImage.alt = alt || "";
  stepImage.style.objectPosition = position || "50% 50%";
  setVisible(stepImage, true);
}

function renderTitleStep() {
  setProgress(0);
  cardTitle.textContent = "Hello Bear (Blake), How well do you remember us?";
  cardSubtitle.textContent = "Four quick questions (and one big one)!";
  setStepImage();
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
  setStepImage(data.imageSrc, data.imageAlt, data.imagePosition);
  questionText.textContent = data.prompt;
  clearAnswers();
  setVisible(startBtn, false);
  setVisible(success, false);
  setVisible(content, true);
  feedback.textContent = "";

  data.options.forEach((option, optionIndex) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "nes-btn";
    btn.textContent = option;
    btn.setAttribute("aria-label", option);
    btn.addEventListener("click", () => {
      if (isLocked) return;
      isLocked = true;
      [...answers.querySelectorAll("button")].forEach((b) => (b.disabled = true));
      const isCorrect = optionIndex === data.correctIndex;
      showFeedback(isCorrect);
      setTimeout(() => {
        isLocked = false;
        currentStep += 1;
        renderStep();
      }, FEEDBACK_DELAY_MS);
    });
    answers.appendChild(btn);
  });
}

let lastNoPos = null;

function moveNoButton(noBtn) {
  const offscreenMargin = 20;
  noBtn.classList.add("free");
  noBtn.style.position = "fixed";

  const minLeft = -offscreenMargin;
  const maxLeft = window.innerWidth - noBtn.offsetWidth + offscreenMargin;
  const minTop = -offscreenMargin;
  const maxTop = window.innerHeight - noBtn.offsetHeight + offscreenMargin;

  const minDistance = 120;
  let left;
  let top;
  let tries = 0;

  do {
    left = minLeft + Math.random() * (maxLeft - minLeft);
    top = minTop + Math.random() * (maxTop - minTop);
    tries += 1;
  } while (
    lastNoPos &&
    Math.hypot(left - lastNoPos.left, top - lastNoPos.top) < minDistance &&
    tries < 25
  );

  lastNoPos = { left, top };
  noBtn.style.left = `${left}px`;
  noBtn.style.top = `${top}px`;
}

function tryMoveNoButton(noBtn) {
  if (Date.now() < noButtonReadyAt) return;
  if (noBtn.disabled) return;
  moveNoButton(noBtn);
}

function renderFinalStep() {
  setProgress(TOTAL_STEPS);
  cardTitle.textContent = "Will you be my Valentine (please)?";
  cardSubtitle.textContent = "";
  setStepImage(
    FINAL_PROMPT_IMAGE.src,
    FINAL_PROMPT_IMAGE.alt,
    FINAL_PROMPT_IMAGE.position
  );
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
  noBtn.disabled = true;
  noButtonReadyAt = Date.now() + NO_MOVE_COOLDOWN_MS;
  clearTimeout(noButtonCooldownTimer);
  noButtonCooldownTimer = setTimeout(() => {
    if (!document.body.contains(noBtn)) return;
    noBtn.disabled = false;
  }, NO_MOVE_COOLDOWN_MS);
  noBtn.addEventListener("mouseenter", () => tryMoveNoButton(noBtn));
  noBtn.addEventListener("click", () => tryMoveNoButton(noBtn));
  noBtn.addEventListener("touchstart", () => tryMoveNoButton(noBtn), { passive: true });

  answers.appendChild(yesBtn);
  answers.appendChild(noBtn);
}

function renderStep() {
  if (currentStep === 0) {
    renderTitleStep();
    return;
  }
  if (currentStep >= 1 && currentStep <= QUESTIONS.length) {
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
