const STORAGE_KEYS = {
  goals: "msrGoals_goals",
  commonSavings: "msrGoals_commonSavings",
};

const LEGACY_KEYS = {
  goals: "goals",
  commonSavings: "commonSavings",
};

const elements = {
  commonSavingsForm: document.getElementById("commonSavingsForm"),
  commonSavingsInput: document.getElementById("commonSavingsInput"),
  goalForm: document.getElementById("goalForm"),
  goalNameInput: document.getElementById("goalNameInput"),
  goalTargetInput: document.getElementById("goalTargetInput"),
  goalList: document.getElementById("goalList"),
  emptyState: document.getElementById("emptyState"),
  goalCount: document.getElementById("goalCount"),
  totalSavingsDisplay: document.getElementById("totalSavingsDisplay"),
  goalSavingsUsedDisplay: document.getElementById("goalSavingsUsedDisplay"),
  goalAmountRemainingDisplay: document.getElementById("goalAmountRemainingDisplay"),
  remainingSavingsDisplay: document.getElementById("remainingSavingsDisplay"),
  remainingBalanceDisplay: document.getElementById("remainingBalanceDisplay"),
  balanceNote: document.getElementById("balanceNote"),
  toast: document.getElementById("toast"),
  installBtn: document.getElementById("installBtn"),
};

let goals = [];
let commonSavings = 0;
let deferredInstallPrompt = null;
let toastTimer = null;
const memoryStorage = new Map();

function escapeHtml(value) {
  const entities = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };

  return String(value).replace(/[&<>"']/g, (char) => entities[char]);
}

function toInteger(value) {
  if (value == null) {
    return 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.round(value) : 0;
  }

  const number = Number(String(value).replace(/[,\s\u20B9]/g, ""));
  return Number.isFinite(number) ? Math.round(number) : 0;
}

function normalizeMoney(value) {
  return Math.max(0, toInteger(value));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function safeGetStorageItem(key) {
  try {
    const value = localStorage.getItem(key);
    return value !== null ? value : memoryStorage.get(key) ?? null;
  } catch {
    return memoryStorage.get(key) ?? null;
  }
}

function safeSetStorageItem(key, value) {
  try {
    localStorage.setItem(key, value);
    memoryStorage.delete(key);
  } catch {
    memoryStorage.set(key, value);
  }
}

function createGoalId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `goal_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

function normalizeGoal(goal) {
  if (!goal || typeof goal !== "object") {
    return null;
  }

  const name = typeof goal.name === "string" ? goal.name.trim() : "";
  const target = normalizeMoney(goal.target);

  if (!name || target < 1) {
    return null;
  }

  const saved = clamp(normalizeMoney(goal.saved), 0, target);
  const id = typeof goal.id === "string" && goal.id ? goal.id : createGoalId();

  return { id, name, target, saved };
}

function readStoredValue(primaryKey, fallbackKey) {
  const primary = safeGetStorageItem(primaryKey);

  if (primary !== null) {
    return primary;
  }

  return safeGetStorageItem(fallbackKey);
}

function loadState() {
  const rawGoals = readStoredValue(STORAGE_KEYS.goals, LEGACY_KEYS.goals);
  const rawCommonSavings = readStoredValue(
    STORAGE_KEYS.commonSavings,
    LEGACY_KEYS.commonSavings
  );

  try {
    const parsedGoals = rawGoals ? JSON.parse(rawGoals) : [];
    goals = Array.isArray(parsedGoals)
      ? parsedGoals.map(normalizeGoal).filter(Boolean)
      : [];
  } catch {
    goals = [];
  }

  commonSavings = normalizeMoney(rawCommonSavings);
}

function persistState() {
  safeSetStorageItem(STORAGE_KEYS.goals, JSON.stringify(goals));
  safeSetStorageItem(STORAGE_KEYS.commonSavings, String(commonSavings));
}

function formatMoney(amount) {
  const value = toInteger(amount);
  const formatted = Math.abs(value).toLocaleString("en-IN");
  return value < 0 ? `-\u20B9${formatted}` : `\u20B9${formatted}`;
}

function getGoalIcon(name) {
  const lower = name.toLowerCase();

  if (lower.includes("bike")) return "🏍️";
  if (lower.includes("car")) return "🚗";
  if (lower.includes("trip") || lower.includes("travel") || lower.includes("tour")) {
    return "✈️";
  }
  if (lower.includes("house") || lower.includes("home")) return "🏠";
  if (lower.includes("phone") || lower.includes("mobile")) return "📱";
  if (lower.includes("laptop") || lower.includes("computer")) return "💻";

  return "🎯";
}

function showToast(message, tone = "info") {
  if (!elements.toast) {
    return;
  }

  elements.toast.textContent = message;
  elements.toast.dataset.tone = tone;
  elements.toast.classList.add("is-visible");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    elements.toast.classList.remove("is-visible");
  }, 2200);
}

function getGoalRemaining(goal) {
  return Math.max(goal.target - goal.saved, 0);
}

function computeTotals() {
  const goalSavingsUsed = goals.reduce((sum, goal) => sum + goal.saved, 0);
  const goalAmountRemaining = goals.reduce((sum, goal) => sum + getGoalRemaining(goal), 0);
  const remainingBalance = commonSavings - goalSavingsUsed;

  return { goalSavingsUsed, goalAmountRemaining, remainingBalance };
}

function setNegativeState(isNegative) {
  elements.remainingSavingsDisplay.classList.toggle("is-negative", isNegative);
  elements.remainingBalanceDisplay.classList.toggle("is-negative", isNegative);
  elements.remainingSavingsDisplay.classList.toggle("is-positive", !isNegative);
  elements.remainingBalanceDisplay.classList.toggle("is-positive", !isNegative);
}

function renderProgressBars() {
  const bars = elements.goalList.querySelectorAll(".progress__bar");

  requestAnimationFrame(() => {
    bars.forEach((bar) => {
      const progress = Number(bar.dataset.progress) || 0;
      bar.style.width = `${progress}%`;
    });
  });
}

function renderGoalCard(goal, remainingBalance) {
  const remaining = getGoalRemaining(goal);
  const percent = goal.target > 0 ? Math.min(100, Math.round((goal.saved / goal.target) * 100)) : 0;
  const availableToAllocate = Math.max(0, Math.min(remainingBalance, remaining));
  const canAllocate = availableToAllocate > 0;
  const safeId = escapeHtml(goal.id);
  const safeName = escapeHtml(goal.name);
  const icon = getGoalIcon(goal.name);

  return `
    <article class="goal-card" role="listitem" data-goal-id="${safeId}">
      <div class="goal-card__top">
        <div class="goal-card__identity">
          <div class="goal-icon" aria-hidden="true">${icon}</div>
          <div>
            <h4 class="goal-card__title">${safeName}</h4>
            <p class="goal-card__subtitle">Target ${formatMoney(goal.target)}</p>
          </div>
        </div>

        <div class="goal-card__remaining-top">
          <span>Remaining</span>
          <strong>${formatMoney(remaining)}</strong>
        </div>
      </div>

      <div class="goal-card__metrics">
        <div class="metric">
          <span>Target</span>
          <strong>${formatMoney(goal.target)}</strong>
        </div>
        <div class="metric">
          <span>Saved</span>
          <strong>${formatMoney(goal.saved)}</strong>
        </div>
        <div class="metric">
          <span>Remaining</span>
          <strong>${formatMoney(remaining)}</strong>
        </div>
      </div>

      <div class="goal-card__allocate">
        <label class="sr-only" for="allocate-${safeId}">Allocate savings to ${safeName}</label>
        <div class="currency-field currency-field--compact">
          <span class="currency-field__prefix" aria-hidden="true">₹</span>
          <input
            id="allocate-${safeId}"
            data-allocate-input
            type="number"
            min="1"
            step="1"
            inputmode="numeric"
            autocomplete="off"
            placeholder="Allocate savings"
          >
        </div>
        <button
          class="action-btn action-btn--allocate"
          type="button"
          data-action="allocate"
          data-goal-id="${safeId}"
          ${canAllocate ? "" : 'disabled aria-disabled="true" title="Increase common savings or reduce allocated savings"'}
        >
          Allocate
        </button>
      </div>

      <p class="goal-card__availability ${canAllocate ? "is-positive" : "is-negative"}">
        ${
          canAllocate
            ? `Available to allocate: ${formatMoney(availableToAllocate)}`
            : "No savings available to allocate"
        }
      </p>

      <div class="progress" aria-label="${safeName} progress">
        <div
          class="progress__bar"
          data-progress="${percent}"
          role="progressbar"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow="${percent}"
        ></div>
      </div>
      <div class="progress__label">${percent}% funded</div>

      <div class="goal-actions">
        <button
          class="action-btn action-btn--positive"
          type="button"
          data-action="increase"
          data-goal-id="${safeId}"
          aria-label="Add 100 rupees to ${safeName}"
        >
          + ₹100
        </button>
        <button
          class="action-btn action-btn--negative"
          type="button"
          data-action="decrease"
          data-goal-id="${safeId}"
          aria-label="Subtract 100 rupees from ${safeName}"
        >
          - ₹100
        </button>
        <button
          class="action-btn action-btn--danger"
          type="button"
          data-action="delete"
          data-goal-id="${safeId}"
          aria-label="Delete ${safeName}"
        >
          Delete
        </button>
      </div>
    </article>
  `;
}

function render() {
  const { goalSavingsUsed, goalAmountRemaining, remainingBalance } = computeTotals();
  const remainingIsNegative = remainingBalance < 0;

  elements.commonSavingsInput.value = commonSavings > 0 ? String(commonSavings) : "";
  elements.totalSavingsDisplay.textContent = formatMoney(commonSavings);
  elements.goalSavingsUsedDisplay.textContent = formatMoney(goalSavingsUsed);
  elements.goalAmountRemainingDisplay.textContent = formatMoney(goalAmountRemaining);
  elements.remainingSavingsDisplay.textContent = formatMoney(remainingBalance);
  elements.remainingBalanceDisplay.textContent = formatMoney(remainingBalance);
  elements.goalCount.textContent = goals.length === 1 ? "1 goal" : `${goals.length} goals`;
  elements.emptyState.classList.toggle("is-visible", goals.length === 0);
  setNegativeState(remainingIsNegative);

  if (remainingIsNegative) {
    elements.balanceNote.textContent = `Overallocated by ${formatMoney(Math.abs(remainingBalance))}. Reduce goal savings or increase the common pool.`;
  } else {
    elements.balanceNote.textContent = "Common savings minus goal savings used";
  }

  if (goals.length === 0) {
    elements.goalList.innerHTML = "";
    return;
  }

  elements.goalList.innerHTML = goals.map((goal) => renderGoalCard(goal, remainingBalance)).join("");
  renderProgressBars();
}

function getGoalById(goalId) {
  return goals.find((goal) => goal.id === goalId);
}

function allocateSavings(goalId, requestedAmount, sourceInput) {
  const goal = getGoalById(goalId);

  if (!goal) {
    return;
  }

  const amountRequested = normalizeMoney(requestedAmount);

  if (amountRequested < 1) {
    showToast("Enter an allocation amount.", "error");
    return;
  }

  const { remainingBalance } = computeTotals();
  const maxAllocatable = Math.max(0, Math.min(remainingBalance, getGoalRemaining(goal)));

  if (maxAllocatable <= 0) {
    showToast("No savings available to allocate.", "error");
    return;
  }

  const applied = Math.min(amountRequested, maxAllocatable);
  goal.saved = clamp(goal.saved + applied, 0, goal.target);

  persistState();
  render();

  if (sourceInput) {
    sourceInput.value = "";
  }

  if (applied < amountRequested) {
    showToast(`Only ${formatMoney(applied)} was available to allocate.`, "info");
    return;
  }

  showToast(`Allocated ${formatMoney(applied)} to ${goal.name}.`, "success");
}

function reduceSavings(goalId, amount) {
  const goal = getGoalById(goalId);

  if (!goal) {
    return;
  }

  if (goal.saved <= 0) {
    showToast("No savings to reduce.", "error");
    return;
  }

  const applied = Math.min(Math.max(0, normalizeMoney(amount)), goal.saved);

  if (applied < 1) {
    return;
  }

  goal.saved = clamp(goal.saved - applied, 0, goal.target);
  persistState();
  render();
  showToast(`Reduced ${formatMoney(applied)} from ${goal.name}.`, "success");
}

function deleteGoal(goalId) {
  const index = goals.findIndex((goal) => goal.id === goalId);

  if (index === -1) {
    return;
  }

  const goalName = goals[index].name;
  goals.splice(index, 1);
  persistState();
  render();
  showToast(`Deleted ${goalName}.`, "success");
}

function addGoal(name, target) {
  goals.unshift({
    id: createGoalId(),
    name,
    target,
    saved: 0,
  });
}

function handleCommonSavingsSubmit(event) {
  event.preventDefault();

  commonSavings = normalizeMoney(elements.commonSavingsInput.value);
  persistState();
  render();
  showToast("Common savings updated", "success");
}

function handleGoalSubmit(event) {
  event.preventDefault();

  const name = elements.goalNameInput.value.trim();
  const target = normalizeMoney(elements.goalTargetInput.value);

  if (!name || target < 1) {
    showToast("Add a goal name and a valid target amount.", "error");
    return;
  }

  addGoal(name, target);
  persistState();
  render();

  elements.goalNameInput.value = "";
  elements.goalTargetInput.value = "";
  elements.goalNameInput.focus();

  showToast("Goal added", "success");
}

function handleGoalListClick(event) {
  const button = event.target.closest("button[data-action][data-goal-id]");

  if (!button) {
    return;
  }

  const { action, goalId } = button.dataset;
  const goalCard = button.closest(".goal-card");
  const allocationInput = goalCard ? goalCard.querySelector("[data-allocate-input]") : null;

  if (action === "allocate") {
    allocateSavings(goalId, allocationInput ? allocationInput.value : 0, allocationInput);
    return;
  }

  if (action === "increase") {
    allocateSavings(goalId, 100);
    return;
  }

  if (action === "decrease") {
    reduceSavings(goalId, 100);
    return;
  }

  if (action === "delete") {
    deleteGoal(goalId);
  }
}

function setupInstallPrompt() {
  if (!elements.installBtn) {
    return;
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    elements.installBtn.hidden = false;
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    elements.installBtn.hidden = true;
    showToast("App installed", "success");
  });

  elements.installBtn.addEventListener("click", async () => {
    if (!deferredInstallPrompt) {
      return;
    }

    deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;

    if (choice.outcome === "accepted") {
      showToast("Thanks for installing MSR Goals", "success");
    }

    deferredInstallPrompt = null;
    elements.installBtn.hidden = true;
  });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || location.protocol === "file:") {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(() => {
      // Silent fallback: the app still works without a cached worker.
    });
  });
}

function initialize() {
  loadState();

  elements.commonSavingsForm.addEventListener("submit", handleCommonSavingsSubmit);
  elements.goalForm.addEventListener("submit", handleGoalSubmit);
  elements.goalList.addEventListener("click", handleGoalListClick);

  setupInstallPrompt();
  registerServiceWorker();
  render();
}

initialize();
