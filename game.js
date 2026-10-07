const SUMMIT = 100;
const FREE_LIVES = 3;
const PASS_LIVES = 4;
const DAILY_SKIPS = 4;
const STRIPE_CLIMBER_LINK = ""; // paste your Stripe Payment Link here
const OWNER_PREVIEW_CODE = "LADDER-PREVIEW";

const state = {
  name: "",
  rung: 1,
  lives: FREE_LIVES,
  streak: 0,
  best: 1,
  asked: new Set(),
  current: null,
  locked: false,
  timer: null,
  left: 0,
  skipsLeft: 0
};

function $(id) { return document.getElementById(id); }

function hasPass() {
  return localStorage.getItem("ql_pass") === "1";
}

function loadBest() {
  return Number(localStorage.getItem("ql_best") || 1);
}

function saveBest() {
  state.best = Math.max(state.best, state.rung, loadBest());
  localStorage.setItem("ql_best", String(state.best));
}

function bandFor(rung) {
  if (rung <= 20) return 1;
  if (rung <= 40) return 2;
  if (rung <= 60) return 3;
  if (rung <= 80) return 4;
  return 5;
}

function secondsFor(rung) {
  return Math.max(9, 24 - Math.floor((rung - 1) / 8));
}

function shuffle(list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickQuestion() {
  const band = bandFor(state.rung);
  let pool = QUESTIONS.filter((q) => q.d === band && !state.asked.has(q.q));
  if (!pool.length) pool = QUESTIONS.filter((q) => q.d === band);
  if (!pool.length) pool = QUESTIONS;
  const q = pool[Math.floor(Math.random() * pool.length)];
  state.asked.add(q.q);
  return q;
}

function openModal(id) { $(id).classList.add("open"); }
function closeModal(id) { $(id).classList.remove("open"); }

function renderHud() {
  $("rungLabel").textContent = `Rung ${state.rung} / ${SUMMIT}`;
  $("livesLabel").textContent = "♥".repeat(state.lives) + "♡".repeat(Math.max(0, (hasPass() ? PASS_LIVES : FREE_LIVES) - state.lives));
  $("streakLabel").textContent = `Streak ${state.streak}`;
  $("bestLabel").textContent = `Best ${Math.max(state.best, loadBest())}`;
  $("ladderFill").style.width = `${state.rung}%`;
  $("passPill").textContent = hasPass() ? "Climber Pass on" : "Free climb";
  $("skipBtn").textContent = hasPass() ? `Skip (${state.skipsLeft} left)` : "Skip — pass required";
}

function showQuestion() {
  state.locked = false;
  state.current = pickQuestion();
  $("catLabel").textContent = `${state.current.c} · band ${state.current.d}`;
  $("question").textContent = state.current.q;
  const box = $("answers");
  box.innerHTML = "";
  state.current.a.forEach((text, index) => {
    const btn = document.createElement("button");
    btn.className = "answer";
    btn.textContent = text;
    btn.onclick = () => choose(index, btn);
    box.appendChild(btn);
  });
  startTimer();
  renderHud();
}

function startTimer() {
  clearInterval(state.timer);
  state.left = secondsFor(state.rung);
  $("timer").textContent = `${state.left}s`;
  state.timer = setInterval(() => {
    state.left -= 1;
    $("timer").textContent = `${state.left}s`;
    if (state.left <= 0) {
      clearInterval(state.timer);
      fail("Time ran out.");
    }
  }, 1000);
}

function choose(index, btn) {
  if (state.locked) return;
  state.locked = true;
  clearInterval(state.timer);
  const buttons = [...document.querySelectorAll(".answer")];
  buttons.forEach((b, i) => {
    if (i === state.current.i) b.classList.add("good");
    if (i === index && index !== state.current.i) b.classList.add("bad");
    b.disabled = true;
  });
  if (index === state.current.i) setTimeout(climb, 650);
  else setTimeout(() => fail("Wrong rung."), 700);
}

function climb() {
  state.streak += 1;
  let gain = 1;
  if (state.streak > 0 && state.streak % 5 === 0) gain += 1;
  state.rung = Math.min(SUMMIT, state.rung + gain);
  saveBest();
  if (state.rung >= SUMMIT) return win();
  $("flash").textContent = gain > 1 ? "Streak bonus. Two rungs." : "Correct. Up you go.";
  showQuestion();
}

function checkpoint() {
  if (!hasPass()) return 1;
  return Math.floor((state.rung - 1) / 20) * 20 + 1;
}

function fail(reason) {
  state.streak = 0;
  state.lives -= 1;
  state.rung = Math.max(1, state.rung - 4);
  saveBest();
  if (state.lives <= 0) return gameOver(reason);
  $("flash").textContent = `${reason} Down 4 rungs.`;
  showQuestion();
}

function win() {
  clearInterval(state.timer);
  saveBest();
  recordScore(SUMMIT);
  $("endTitle").textContent = "Summit.";
  $("endCopy").textContent = `${state.name || "Climber"}, you finished all ${SUMMIT} rungs. That is the whole ladder.`;
  openModal("endModal");
}

function gameOver(reason) {
  clearInterval(state.timer);
  const back = checkpoint();
  recordScore(state.best);
  $("endTitle").textContent = "You fell.";
  $("endCopy").textContent = hasPass()
    ? `${reason} Climber Pass saves a checkpoint. You restart at rung ${back}.`
    : `${reason} Free climbs restart at rung 1. A Climber Pass keeps a checkpoint every 20 rungs and unlocks skips.`;
  $("restartBtn").dataset.rung = String(hasPass() ? back : 1);
  openModal("endModal");
}

function recordScore(score) {
  const board = JSON.parse(localStorage.getItem("ql_board") || "[]");
  board.push({ name: state.name || "Climber", score, at: Date.now() });
  board.sort((a, b) => b.score - a.score);
  localStorage.setItem("ql_board", JSON.stringify(board.slice(0, 8)));
  const list = $("board");
  list.innerHTML = "";
  board.slice(0, 5).forEach((row) => {
    const li = document.createElement("li");
    li.textContent = `${row.name} — rung ${row.score}`;
    list.appendChild(li);
  });
}

function skipsToday() {
  const key = new Date().toISOString().slice(0, 10);
  const saved = JSON.parse(localStorage.getItem("ql_skips") || "{}");
  if (saved.day !== key) return DAILY_SKIPS;
  return saved.left;
}

function useSkip() {
  const key = new Date().toISOString().slice(0, 10);
  const left = skipsToday() - 1;
  localStorage.setItem("ql_skips", JSON.stringify({ day: key, left }));
  state.skipsLeft = left;
}

function trySkip() {
  if (!hasPass()) {
    openModal("payModal");
    return;
  }
  if (state.skipsLeft <= 0) {
    $("flash").textContent = "No skips left today.";
    return;
  }
  if (state.locked) return;
  useSkip();
  $("flash").textContent = "Skipped. The rung did not move.";
  showQuestion();
}

function startGame(fromRung) {
  state.name = localStorage.getItem("ql_name") || "Climber";
  state.rung = fromRung || 1;
  state.lives = hasPass() ? PASS_LIVES : FREE_LIVES;
  state.streak = 0;
  state.best = Math.max(loadBest(), state.rung);
  state.asked = new Set();
  state.skipsLeft = hasPass() ? skipsToday() : 0;
  $("flash").textContent = hasPass() ? "Pass active. Skips and checkpoints are on." : "Free climb. Skips are locked.";
  closeModal("endModal");
  showQuestion();
}

function boot() {
  recordScore(loadBest());
  $("skipBtn").onclick = trySkip;
  $("giveUp").onclick = () => gameOver("You stepped off.");
  $("restartBtn").onclick = () => startGame(Number($("restartBtn").dataset.rung || 1));
  $("subscribeBtn").onclick = () => {
    if (STRIPE_CLIMBER_LINK) window.location.href = STRIPE_CLIMBER_LINK;
    else $("payNote").textContent = "Stripe link is not connected yet. Use the owner preview code from the README, or paste a Payment Link into game.js.";
  };
  $("previewBtn").onclick = () => {
    if ($("previewCode").value.trim().toUpperCase() === OWNER_PREVIEW_CODE) {
      localStorage.setItem("ql_pass", "1");
      closeModal("payModal");
      state.skipsLeft = skipsToday();
      state.lives = Math.max(state.lives, PASS_LIVES - 1);
      renderHud();
      $("flash").textContent = "Preview pass on for this browser.";
    } else {
      $("payNote").textContent = "That code is not the preview code.";
    }
  };
  $("closePay").onclick = () => closeModal("payModal");
  const saved = localStorage.getItem("ql_name");
  if (saved) {
    $("nameInput").value = saved;
  }
  $("beginBtn").onclick = () => {
    const name = $("nameInput").value.trim().slice(0, 18) || "Climber";
    localStorage.setItem("ql_name", name);
    closeModal("startModal");
    startGame(1);
  };
  if (new URLSearchParams(location.search).get("pass") === "1") {
    localStorage.setItem("ql_pass", "1");
  }
  openModal("startModal");
}

document.addEventListener("DOMContentLoaded", boot);
