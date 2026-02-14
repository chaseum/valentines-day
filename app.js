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

const FEEDBACKS = ["Correct!", "Yurppp", "Goooood answer", "Good job king!", "The bear gets one point!", "The bear is on a roll here..."];
const WRONGFEEDBACKS = ["Oh... that's not...", "Yo how did you get this wrong", "Blake let's be serious come on...", "WRONG ANSWER NEPHEW!!", "Can we lock in (please)"];
const FEEDBACK_DELAY_MS = 3000;
const NO_MOVE_COOLDOWN_MS = 700;
const TYPEWRITER_CHAR_DELAY_MS = 42;
const FEEDBACK_TYPEWRITER_CHAR_DELAY_MS = 26;
const PROMPT_HIGHLIGHTS = ["city", "day", "hackathons", "food"];
const SOUND_VOLUME = {
  background: 0.12,
  select: 0.16,
  tap: 0.5,
  tryAgain: 0.18,
  valentine: 0.12,
  right: 0.2,
  cheer: 0.18,
  wrong: 0.2,
  boo: 0.18,
};
const TOTAL_STEPS = QUESTIONS.length + 1;
const PASSING_SCORE_RATIO = 0.5;
const DEFAULT_SUCCESS_TEXT = "Yay! Happy Valentine's Day My Fav Bear Ever <3 ";
const RETRY_TEXT = "Lets try that again... You can do better king";
const FINAL_PROMPT_IMAGE = {
  src: "assets/IMG_0667.JPEG",
  alt: "Photo for the Valentine question",
  position: "50% 30%",
};
const PET_FALL_SOURCES = ["assets/my-cat.png", "assets/blake-dog.png"];
const PET_FALL_INTERVAL_MIN_MS = 900;
const PET_FALL_INTERVAL_MAX_MS = 2100;
const INTRO_TITLE_TEXT = "Hi Blake, How well do you remember us?";
const INTRO_TITLE_HTML = [
  "Hi Blake, How well do",
  '<span class="intro-you">you</span>',
  "remember",
  '<span class="intro-us">us</span>?',
].join(" ");
const FINAL_TITLE_TEXT = "Will you be my Valentine (please)?";
const FINAL_TITLE_HTML = [
  '<span class="title-word">Will</span>',
  '<span class="title-word title-soft">you</span>',
  '<span class="title-word">be</span>',
  '<span class="title-word">my</span>',
  '<span class="title-word title-strong">Valentine</span>',
  '<span class="title-word title-heart">?</span>',
].join(" ");

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
const petSplash = document.getElementById("pet-splash");
const petFallLayer = document.getElementById("pet-fall-layer");

let currentStep = 0;
let isLocked = false;
let noButtonReadyAt = 0;
let noButtonCooldownTimer = null;
let remainingCorrectFeedbacks = [];
let remainingWrongFeedbacks = [];
let lastShownFeedback = "";
let correctAnswers = 0;
let backgroundStarted = false;
let lastHoveredButton = null;
let petFallTimer = null;
let petFallActive = false;
let titleTypewriterTimer = null;
let titleTypewriterToken = 0;
let feedbackTypewriterTimer = null;
let feedbackTypewriterToken = 0;

const selectSound = new Audio("sounds/select.mp3");
selectSound.volume = SOUND_VOLUME.select;

const tapSound = new Audio("sounds/tap.mp3");
tapSound.volume = SOUND_VOLUME.tap;

const tryAgainSound = new Audio("sounds/tryagain.mp3");
tryAgainSound.volume = SOUND_VOLUME.tryAgain;

const valentineSound = new Audio("sounds/valentine.mp3");
valentineSound.volume = SOUND_VOLUME.valentine;

// "Right" uses the provided correct.mp3 file.
const rightSound = new Audio("sounds/correct.mp3");
rightSound.volume = SOUND_VOLUME.right;

const cheerSound = new Audio("sounds/cheer.mp3");
cheerSound.volume = SOUND_VOLUME.cheer;

const wrongSound = new Audio("sounds/wrong.mp3");
wrongSound.volume = SOUND_VOLUME.wrong;

const booSound = new Audio("sounds/boo.mp3");
booSound.volume = SOUND_VOLUME.boo;

const backgroundMusic = new Audio("sounds/background.mp3");
backgroundMusic.loop = true;
backgroundMusic.volume = SOUND_VOLUME.background;

const SOUND_EFFECTS = [
  selectSound,
  tapSound,
  tryAgainSound,
  valentineSound,
  rightSound,
  cheerSound,
  wrongSound,
  booSound,
  backgroundMusic,
];

SOUND_EFFECTS.forEach((audio) => {
  audio.preload = "auto";
});

function tryPlayAudio(audio, restart = false) {
  try {
    if (restart) audio.currentTime = 0;
    const maybePromise = audio.play();
    if (maybePromise && typeof maybePromise.catch === "function") {
      maybePromise.catch(() => {});
    }
  } catch {
    // Keep quiz interaction responsive if audio cannot play.
  }
}

function playAnswerAudio(isCorrect) {
  if (isCorrect) {
    tryPlayAudio(rightSound, true);
    return;
  }
  tryPlayAudio(wrongSound, true);
}

function playHoverTap(btn) {
  if (lastHoveredButton === btn) return;
  lastHoveredButton = btn;
  tryPlayAudio(tapSound, true);
}

function ensureBackgroundMusic() {
  if (!backgroundStarted) {
    backgroundStarted = true;
    tryPlayAudio(backgroundMusic, false);
    return;
  }
  if (backgroundMusic.paused) {
    tryPlayAudio(backgroundMusic, false);
  }
}

function onAnyButtonClick() {
  ensureBackgroundMusic();
  tryPlayAudio(selectSound, true);
}

function stopTitleTypewriter() {
  clearTimeout(titleTypewriterTimer);
  titleTypewriterTimer = null;
  titleTypewriterToken += 1;
  cardTitle.classList.remove("typewriter");
}

function typewriterCardTitle(text, options = {}) {
  const { finalStyle = false, onComplete } = options;
  stopTitleTypewriter();
  cardTitle.classList.toggle("final-dynamic-title", finalStyle);
  cardTitle.classList.add("typewriter");
  cardTitle.textContent = "";

  const token = titleTypewriterToken;
  let index = 0;

  const tick = () => {
    if (token !== titleTypewriterToken) return;
    index += 1;
    cardTitle.textContent = text.slice(0, index);
    if (index < text.length) {
      titleTypewriterTimer = setTimeout(tick, TYPEWRITER_CHAR_DELAY_MS);
      return;
    }
    titleTypewriterTimer = null;
    cardTitle.classList.remove("typewriter");
    if (typeof onComplete === "function") onComplete();
  };

  tick();
}

function stopFeedbackTypewriter() {
  clearTimeout(feedbackTypewriterTimer);
  feedbackTypewriterTimer = null;
  feedbackTypewriterToken += 1;
  feedback.classList.remove("typewriter");
}

function clearFeedback() {
  stopFeedbackTypewriter();
  feedback.textContent = "";
}

function typewriterFeedback(text) {
  stopFeedbackTypewriter();
  feedback.classList.add("typewriter");
  feedback.textContent = "";

  const token = feedbackTypewriterToken;
  let index = 0;

  const tick = () => {
    if (token !== feedbackTypewriterToken) return;
    index += 1;
    feedback.textContent = text.slice(0, index);
    if (index < text.length) {
      feedbackTypewriterTimer = setTimeout(tick, FEEDBACK_TYPEWRITER_CHAR_DELAY_MS);
      return;
    }
    feedbackTypewriterTimer = null;
    feedback.classList.remove("typewriter");
  };

  tick();
}

function setPlainCardTitle(text) {
  stopTitleTypewriter();
  cardTitle.classList.remove("final-dynamic-title");
  cardTitle.textContent = text;
}

function setIntroCardTitle() {
  typewriterCardTitle(INTRO_TITLE_TEXT, {
    onComplete: () => {
      cardTitle.innerHTML = INTRO_TITLE_HTML;
    },
  });
}

function setDynamicFinalTitle() {
  typewriterCardTitle(FINAL_TITLE_TEXT, {
    finalStyle: true,
    onComplete: () => {
      cardTitle.innerHTML = FINAL_TITLE_HTML;
    },
  });
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

function setPetSplashVisible(visible) {
  if (!petSplash) return;
  setVisible(petSplash, visible);
}

function getRandomPetFallDelay() {
  const spread = PET_FALL_INTERVAL_MAX_MS - PET_FALL_INTERVAL_MIN_MS;
  return PET_FALL_INTERVAL_MIN_MS + Math.random() * spread;
}

function clearPetFallLayer() {
  if (!petFallLayer) return;
  petFallLayer.innerHTML = "";
}

function spawnFallingPet() {
  if (!petFallLayer) return;
  const pet = document.createElement("img");
  const sourceIndex = Math.floor(Math.random() * PET_FALL_SOURCES.length);
  const sizePx = 36 + Math.random() * 36;
  const durationMs = 6500 + Math.random() * 5500;

  pet.className = "pet-fall";
  pet.src = PET_FALL_SOURCES[sourceIndex];
  pet.alt = "";
  pet.style.left = `${Math.random() * 100}vw`;
  pet.style.width = `${sizePx}px`;
  pet.style.opacity = `${0.72 + Math.random() * 0.28}`;
  pet.style.animationDuration = `${durationMs}ms`;

  pet.addEventListener("animationend", () => {
    pet.remove();
  });

  petFallLayer.appendChild(pet);
}

function schedulePetFall() {
  clearTimeout(petFallTimer);
  if (!petFallActive) return;
  petFallTimer = setTimeout(() => {
    if (!petFallActive) return;
    spawnFallingPet();
    schedulePetFall();
  }, getRandomPetFallDelay());
}

function startPetFall() {
  if (!petFallLayer || petFallActive) return;
  petFallActive = true;
  setVisible(petFallLayer, true);
  schedulePetFall();
}

function stopPetFall() {
  petFallActive = false;
  clearTimeout(petFallTimer);
  petFallTimer = null;
  clearPetFallLayer();
  if (!petFallLayer) return;
  setVisible(petFallLayer, false);
}

function setPetFallActive(active) {
  if (active) {
    startPetFall();
    return;
  }
  stopPetFall();
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
  typewriterFeedback(text);
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
  setPetSplashVisible(true);
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
  clearFeedback();
  startBtn.focus();
}

function renderQuestionStep(stepIndex) {
  setProgress(stepIndex);
  const data = QUESTIONS[stepIndex - 1];
  setPlainCardTitle(`Question ${stepIndex}`);
  setPetSplashVisible(false);
  cardSubtitle.textContent = "";
  setStepImage(data.imageSrc, data.imageAlt, data.imagePosition);
  questionText.innerHTML = styleQuestionPrompt(data.prompt);
  clearAnswers();
  setVisible(startBtn, false);
  setVisible(success, false);
  setVisible(content, true);
  clearFeedback();

  data.options.forEach((option, optionIndex) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "nes-btn";
    btn.textContent = option;
    btn.setAttribute("aria-label", option);
    btn.addEventListener("mouseenter", () => playHoverTap(btn));
    btn.addEventListener("focus", () => playHoverTap(btn));
    btn.addEventListener("mouseleave", () => {
      if (lastHoveredButton === btn) lastHoveredButton = null;
    });
    btn.addEventListener("blur", () => {
      if (lastHoveredButton === btn) lastHoveredButton = null;
    });
    btn.addEventListener("click", () => {
      if (isLocked) return;
      onAnyButtonClick();
      isLocked = true;
      [...answers.querySelectorAll("button")].forEach((b) => (b.disabled = true));
      const isCorrect = optionIndex === data.correctIndex;
      playAnswerAudio(isCorrect);
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
  tryPlayAudio(tapSound, true);
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
  tryAgainSound.pause();
  tryAgainSound.currentTime = 0;
  setProgress(TOTAL_STEPS);
  setDynamicFinalTitle();
  setPetSplashVisible(true);
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
  clearFeedback();
  answers.classList.add("final");

  const yesBtn = document.createElement("button");
  yesBtn.type = "button";
  yesBtn.className = "nes-btn is-primary big-btn";
  yesBtn.textContent = "Yes";
  yesBtn.style.top = "0px";
  yesBtn.setAttribute("aria-label", "Yes");
  yesBtn.addEventListener("click", () => {
    onAnyButtonClick();
    tryAgainSound.pause();
    tryAgainSound.currentTime = 0;
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
    tryPlayAudio(cheerSound, true);
    tryPlayAudio(valentineSound, true);
    successText.textContent = DEFAULT_SUCCESS_TEXT;
    setVisible(restartBtn, false);
    setVisible(successHeart, true);
    setVisible(content, false);
    setVisible(progress, false);
    setPetSplashVisible(false);
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
  noBtn.addEventListener("click", () => {
    onAnyButtonClick();
    tryPlayAudio(booSound, true);
    tryMoveNoButton(noBtn);
  });
  noBtn.addEventListener("touchstart", () => tryMoveNoButton(noBtn), { passive: true });

  answers.appendChild(yesBtn);
  answers.appendChild(noBtn);
}

function renderRetryStep() {
  setProgress(TOTAL_STEPS);
  setPlainCardTitle(RETRY_TEXT);
  setPetSplashVisible(false);
  cardSubtitle.textContent = "";
  setStepImage();
  questionText.textContent = "";
  clearAnswers();
  setVisible(startBtn, false);
  setVisible(success, false);
  setVisible(content, true);
  clearFeedback();

  const retryBtn = document.createElement("button");
  retryBtn.type = "button";
  retryBtn.className = "nes-btn is-primary";
  retryBtn.textContent = "Restart Quiz";
  retryBtn.setAttribute("aria-label", "Restart quiz");
  retryBtn.addEventListener("click", () => {
    onAnyButtonClick();
    resetQuiz();
  });
  answers.appendChild(retryBtn);
  valentineSound.pause();
  valentineSound.currentTime = 0;
  tryPlayAudio(booSound, true);
  tryPlayAudio(tryAgainSound, true);
}

function renderStep() {
  setPetFallActive(currentStep > 0);
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
  clearFeedback();
  tryAgainSound.pause();
  tryAgainSound.currentTime = 0;
  valentineSound.pause();
  valentineSound.currentTime = 0;
  renderStep();
}

startBtn.addEventListener("click", () => {
  onAnyButtonClick();
  correctAnswers = 0;
  currentStep = 1;
  renderStep();
});

restartBtn.addEventListener("click", () => {
  onAnyButtonClick();
  resetQuiz();
});

renderStep();
