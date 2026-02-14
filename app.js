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
    prompt: "How many hackathons have we competed in together?",
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
const FEEDBACK_DELAY_MS = 2100;
const NO_MOVE_COOLDOWN_MS = 700;
const PROMPT_HIGHLIGHTS = ["city", "day", "hackathons", "food"];
const TOTAL_STEPS = QUESTIONS.length + 1;
const PASSING_SCORE_RATIO = 0.5;
const DEFAULT_SUCCESS_TEXT = "Yay! Happy Valentine's Day My Fav Bear Ever <3 ";
const RETRY_TEXT = "Lets try that again... You can do better king";
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
const successText = document.getElementById("success-text");
const successHeart = document.querySelector(".pixel-heart");
const restartBtn = document.getElementById("restart-btn");

let currentStep = 0;
let isLocked = false;
let noButtonReadyAt = 0;
let noButtonCooldownTimer = null;
let remainingCorrectFeedbacks = [];
let remainingWrongFeedbacks = [];
let lastShownFeedback = "";
let correctAnswers = 0;

function setPlainCardTitle(text) {
  cardTitle.classList.remove("final-dynamic-title");
  cardTitle.textContent = text;
}

function setIntroCardTitle() {
  cardTitle.classList.remove("final-dynamic-title");
  cardTitle.innerHTML = [
    "Hi Blake, How well do",
    '<span class="intro-you">you</span>',
    "remember",
    '<span class="intro-us">us</span>?',
  ].join(" ");
}

function setDynamicFinalTitle() {
  cardTitle.classList.add("final-dynamic-title");
  cardTitle.innerHTML = [
    '<span class="title-word">Will</span>',
    '<span class="title-word title-soft">you</span>',
    '<span class="title-word">be</span>',
    '<span class="title-word">my</span>',
    '<span class="title-word title-strong">Valentine</span>',
    '<span class="title-word title-heart">?</span>',
  ].join(" ");
}

function styleQuestionPrompt(prompt) {
  let styled = prompt;
  PROMPT_HIGHLIGHTS.forEach((word) => {
    const regex = new RegExp(`\\b(${word})\\b`, "gi");
    styled = styled.replace(regex, '<span class="prompt-highlight">$1</span>');
  });
  return styled;
}

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
  setIntroCardTitle();
  cardSubtitle.innerHTML =
    'Four quick questions (and one big one)!<br><span class="subtitle-highlight">You can only answer once</span>, so think hard...';
  setStepImage();
  questionText.textContent = "";
  clearAnswers();
  setVisible(startBtn, true);
  setVisible(success, false);
  setVisible(content, true);
  setVisible(restartBtn, false);
  setVisible(successHeart, true);
  successText.textContent = DEFAULT_SUCCESS_TEXT;
  feedback.textContent = "";
  startBtn.focus();
}

function renderQuestionStep(stepIndex) {
  setProgress(stepIndex);
  const data = QUESTIONS[stepIndex - 1];
  setPlainCardTitle(`Question ${stepIndex}`);
  cardSubtitle.textContent = "";
  setStepImage(data.imageSrc, data.imageAlt, data.imagePosition);
  questionText.innerHTML = styleQuestionPrompt(data.prompt);
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
      if (isCorrect) correctAnswers += 1;
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
  setDynamicFinalTitle();
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
    successText.textContent = DEFAULT_SUCCESS_TEXT;
    setVisible(restartBtn, false);
    setVisible(successHeart, true);
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

function renderRetryStep() {
  setProgress(TOTAL_STEPS);
  setPlainCardTitle(RETRY_TEXT);
  cardSubtitle.textContent = "";
  setStepImage();
  questionText.textContent = "";
  clearAnswers();
  setVisible(startBtn, false);
  setVisible(success, false);
  setVisible(content, true);
  feedback.textContent = "";

  const retryBtn = document.createElement("button");
  retryBtn.type = "button";
  retryBtn.className = "nes-btn is-primary";
  retryBtn.textContent = "Restart Quiz";
  retryBtn.setAttribute("aria-label", "Restart quiz");
  retryBtn.addEventListener("click", () => resetQuiz());
  answers.appendChild(retryBtn);
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
  const scoreRatio = correctAnswers / QUESTIONS.length;
  if (scoreRatio < PASSING_SCORE_RATIO) {
    renderRetryStep();
    return;
  }
  renderFinalStep();
}

function resetQuiz() {
  currentStep = 0;
  isLocked = false;
  correctAnswers = 0;
  noButtonReadyAt = 0;
  clearTimeout(noButtonCooldownTimer);
  lastNoPos = null;
  remainingCorrectFeedbacks = [];
  remainingWrongFeedbacks = [];
  lastShownFeedback = "";
  renderStep();
}

startBtn.addEventListener("click", () => {
  correctAnswers = 0;
  currentStep = 1;
  renderStep();
});

restartBtn.addEventListener("click", () => {
  resetQuiz();
});

renderStep();
