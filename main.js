const templates = [
  {
    id: "upper-power",
    name: "Upper Power",
    focus: "Heavy push/pull",
    exercises: [
      { name: "Bench press", target: "3 x 3-5", defaultWeight: "45/side" },
      { name: "Incline press", target: "3 x 6-8", defaultWeight: "35/side" },
      { name: "Bent over row", target: "4 x 6-8", defaultWeight: "25 kg/side" },
      { name: "Lat pull down", target: "4 x 6-10", defaultWeight: "145" },
      { name: "Overhead press", target: "3 x 6-8", defaultWeight: "30lb dumbbells" },
      { name: "Ez bar curl", target: "2 x 6-10", defaultWeight: "50lb" },
    ],
  },
  {
    id: "lower-power",
    name: "Lower Power",
    focus: "Heavy compounds",
    exercises: [
      { name: "Squat", target: "3-4 x 3-5", defaultWeight: "45/side" },
      { name: "Deadlift", target: "3-4 x 3-5", defaultWeight: "55" },
      { name: "Leg press", target: "3-5 x 10-15", defaultWeight: "50kg/side" },
      { name: "Calf raise", target: "4 x 8-12", defaultWeight: "" },
      { name: "Leg curl", target: "4 x 6-10", defaultWeight: "90lbs" },
    ],
  },
  {
    id: "upper-hyp",
    name: "Upper Hypertrophy",
    focus: "Chest & back volume",
    exercises: [
      { name: "Incline press", target: "3-4 x 8-12", defaultWeight: "35/side" },
      { name: "Flat bench dumbbell fly", target: "3-4 x 8-12", defaultWeight: "22.5" },
      { name: "One arm dumbbell row", target: "3-4 x 8-12", defaultWeight: "32.5" },
      { name: "Dumbbell lateral raise", target: "3-4 x 10-15", defaultWeight: "12.5" },
      { name: "Seated incline dumbbell curl", target: "3-4 x 10-12", defaultWeight: "25" },
      { name: "Seated cable row", target: "3-4 x 8-12", defaultWeight: "100" },
      { name: "Cable tricep extension", target: "3-4 x 10-15", defaultWeight: "57.5" },
    ],
  },
  {
    id: "lower-hyp",
    name: "Lower Hypertrophy",
    focus: "Quad & calf volume",
    exercises: [
      { name: "Front squat", target: "3-4 x 8-12", defaultWeight: "25/side" },
      { name: "Barbell lunge", target: "3-4 x 8-12", defaultWeight: "35/side" },
      { name: "Leg extension", target: "3-4 x 10-15", defaultWeight: "140 (size 9)" },
      { name: "Leg curl", target: "3-4 x 10-15", defaultWeight: "100" },
      { name: "Calf extension", target: "3-4 x 8-12", defaultWeight: "200" },
      { name: "Calf press", target: "3-4 x 15-20", defaultWeight: "135/side" },
    ],
  },
];

const rotationOrder = ["upper-power", "lower-power", "upper-hyp", "lower-hyp"];
const workoutShortLabel = {
  "upper-power": "UP",
  "lower-power": "LP",
  "upper-hyp": "UH",
  "lower-hyp": "LH",
};
const templateMap = templates.reduce((acc, template) => {
  acc[template.id] = template;
  return acc;
}, {});

const storageKey = "rotation-workout-state-v1";
const backupKeyStorageKey = "rotation-workout-backup-key-v1";
const sessionDateInput = document.getElementById("session-date");
const plannedTitle = document.getElementById("planned-title");
const exerciseListEl = document.getElementById("exercise-list");
const prefillCopy = document.getElementById("prefill-copy");
const noteField = document.getElementById("session-note");
const saveButton = document.getElementById("save-session");
const resetTodayButton = document.getElementById("reset-today");
const historyList = document.getElementById("history-list");
const calendarGrid = document.getElementById("calendar-grid");
const dayDetail = document.getElementById("day-detail");
const monthLabel = document.getElementById("month-label");
const prevMonthBtn = document.getElementById("prev-month");
const nextMonthBtn = document.getElementById("next-month");
const installButton = document.getElementById("install-button");
const weekBar = document.getElementById("week-bar");
const storageWarning = document.getElementById("storage-warning");
const dismissWarningButton = document.getElementById("dismiss-warning");
const cloudBackupBtn = document.getElementById("cloud-backup-btn");
const cloudRestoreBtn = document.getElementById("cloud-restore-btn");
const cloudStatus = document.getElementById("cloud-status");
const backupKeyInput = document.getElementById("backup-key");
const backupKeyCopyBtn = document.getElementById("backup-key-copy");
const todayPlanPanel = document.querySelector(".panel");
const panelBody = document.querySelector(".panel-body");

let deferredPrompt = null;

const today = new Date();
let monthCursor = { month: today.getMonth(), year: today.getFullYear() };
let state = loadState();
let justSaved = false;

init();

function init() {
  if (!state.history.length) {
    seedInitialHistory();
  }

  sessionDateInput.value = formatDate(today);
  saveButton.addEventListener("click", handleSave);
  resetTodayButton.addEventListener("click", handleResetToday);
  prevMonthBtn.addEventListener("click", () => changeMonth(-1));
  nextMonthBtn.addEventListener("click", () => changeMonth(1));
  
  if (dismissWarningButton) {
    dismissWarningButton.addEventListener("click", () => {
      if (storageWarning) {
        storageWarning.hidden = true;
      }
    });
  }

  if (cloudBackupBtn) {
    cloudBackupBtn.addEventListener("click", handleCloudBackup);
  }
  if (cloudRestoreBtn) {
    cloudRestoreBtn.addEventListener("click", handleCloudRestore);
  }
  if (backupKeyInput) {
    backupKeyInput.addEventListener("input", () => {
      const normalized = normalizeBackupKey(backupKeyInput.value);
      if (normalized !== backupKeyInput.value) {
        backupKeyInput.value = normalized;
      }
    });
    backupKeyInput.addEventListener("change", () => {
      const normalized = normalizeBackupKey(backupKeyInput.value);
      if (!normalized) {
        const replacement = generateBackupKey();
        backupKeyInput.value = replacement;
        setBackupKey(replacement);
        return;
      }
      setBackupKey(normalized);
    });
  }
  if (backupKeyCopyBtn) {
    backupKeyCopyBtn.addEventListener("click", handleCopyBackupKey);
  }

  // Add click handler for expanding collapsed panel
  if (todayPlanPanel) {
    todayPlanPanel.addEventListener("click", expandPanel);
  }

  initCloudBackup();

  registerServiceWorker();
  setupInstallPrompt();
  checkStorageWarning();
  renderSession();
  renderHistory();
  renderCalendar();
}

function loadState() {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return { history: [] };
    }
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.history)) {
      return { history: [] };
    }
    return parsed;
  } catch {
    return { history: [] };
  }
}

function persistState() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
    checkStorageWarning();
  } catch {
    // keep going even if storage fails
  }
}

function checkStorageWarning() {
  if (!storageWarning) return;
  
  const sessionCount = state.history.length;
  if (sessionCount >= 5000) {
    storageWarning.hidden = false;
  } else {
    storageWarning.hidden = true;
  }
}

function seedInitialHistory() {
  const year = today.getMonth() >= 11 ? today.getFullYear() : today.getFullYear() - 1;
  state.history = [
    {
      date: `${year}-12-26`,
      workoutId: "lower-hyp",
      note: "",
      exercises: [
        { name: "Front squat", weight: "25/side", reps: "3-4x8-12" },
        { name: "Barbell lunge", weight: "35/side", reps: "3-4x8-12" },
        { name: "Leg extension", weight: "140 (size 9)", reps: "3-4x10-15" },
        { name: "Leg curl", weight: "100", reps: "3-4x10-15" },
        { name: "Calf extension", weight: "200", reps: "3-4x8-12" },
        { name: "Calf press", weight: "135/side", reps: "3-4x15-20" },
      ],
    },
    {
      date: `${year}-12-19`,
      workoutId: "upper-hyp",
      note: "",
      exercises: [
        { name: "Incline press", weight: "35/side", reps: "3-4x8-12" },
        { name: "Flat bench dumbbell fly", weight: "22.5", reps: "3-4x8-12" },
        { name: "One arm dumbbell row", weight: "32.5", reps: "3-4x8-12" },
        { name: "Dumbbell lateral raise", weight: "12.5", reps: "3-4x10-15" },
        { name: "Seated incline dumbbell curl", weight: "25", reps: "3-4x10-12" },
        { name: "Seated cable row", weight: "100", reps: "3-4x8-12" },
        { name: "Cable tricep extension", weight: "57.5", reps: "3-4x10-15" },
      ],
    },
    {
      date: `${year}-12-09`,
      workoutId: "lower-power",
      note: "",
      exercises: [
        { name: "Squat", weight: "45/side", reps: "3-4x3-5" },
        { name: "Deadlift", weight: "55", reps: "3-4x3-5" },
        { name: "Leg press", weight: "50kg/side", reps: "3-5x10-15" },
        { name: "Calf raise", weight: "", reps: "4x8-12" },
        { name: "Leg curl", weight: "90lbs", reps: "4x6-10" },
      ],
    },
    {
      date: `${year}-12-04`,
      workoutId: "upper-power",
      note: "",
      exercises: [
        { name: "Bench press", weight: "45/side", reps: "3x3-5" },
        { name: "Incline press", weight: "35/side", reps: "3x6-8" },
        { name: "Bent over row", weight: "25 kg/side", reps: "4x6-8" },
        { name: "Lat pull down", weight: "145", reps: "4x6-10" },
        { name: "Overhead press", weight: "30lb dumbbells", reps: "3x6-8" },
        { name: "Ez bar curl", weight: "50lb", reps: "2x6-10" },
      ],
    },
  ];
  persistState();
}

function formatDate(dateObj) {
  return dateObj.toISOString().slice(0, 10);
}

function parseDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// Normalize date to YYYY-MM-DD format
function normalizeDate(dateString) {
  if (!dateString) return dateString;
  
  // If already in YYYY-MM-DD format, return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  // Try to parse as Date object
  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return formatDate(date);
    }
  } catch (e) {
    // Continue to other parsing methods
  }
  
  // Try parsing common date formats
  // MM/DD/YYYY or M/D/YYYY
  const match = dateString.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (match) {
    const [, month, day, year] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  return dateString; // Return original if can't parse
}

function renderSession() {
  const dateValue = sessionDateInput.value || formatDate(today);
  const existing = state.history.find((entry) => entry.date === dateValue);
  const plannedWorkout = getWorkoutForDate(dateValue, existing);
  const isToday = dateValue === formatDate(today);

  // Always render other components
  renderHistory();
  renderCalendar();
  renderWeekBar();
  setDayDetail(existing ? existing.date : null);

  // Show collapsed state if we just saved and it's today's date
  if (justSaved && isToday && existing) {
    showCollapsedState(plannedWorkout);
    justSaved = false; // Reset the flag
    return;
  }

  // Normal expanded state
  todayPlanPanel?.classList.remove("collapsed");
  const collapsedContent = document.getElementById("collapsed-content");
  if (collapsedContent) {
    collapsedContent.remove();
  }
  
  plannedTitle.textContent = `${plannedWorkout.name}`;
  const prefillSource = existing || getLatestEntryForWorkout(plannedWorkout.id);
  prefillCopy.textContent = prefillSource
    ? "Prefilled from your most recent session for this workout."
    : "Starting from the template targets below.";

  noteField.value = existing?.note ?? "";
  renderExerciseInputs(plannedWorkout, prefillSource);
  
  // Show all elements
  prefillCopy.hidden = false;
  exerciseListEl.hidden = false;
  const noteArea = document.querySelector(".note-area");
  const actions = document.querySelector(".actions");
  if (noteArea) noteArea.removeAttribute("hidden");
  if (actions) actions.removeAttribute("hidden");
}

function showCollapsedState(workout) {
  todayPlanPanel?.classList.add("collapsed");
  plannedTitle.textContent = `${workout.name}`;
  
  // Remove any existing collapsed content
  const existingCollapsed = document.getElementById("collapsed-content");
  if (existingCollapsed) {
    existingCollapsed.remove();
  }
  
  // Create collapsed content
  const collapsedContent = document.createElement("div");
  collapsedContent.id = "collapsed-content";
  collapsedContent.className = "collapsed-content";
  collapsedContent.innerHTML = `
    <div class="completion-checkmark">✓</div>
    <div class="completion-message">Great work! Session saved.</div>
  `;
  panelBody?.appendChild(collapsedContent);
  
  // Hide normal content
  prefillCopy.hidden = true;
  exerciseListEl.hidden = true;
  const noteArea = document.querySelector(".note-area");
  const actions = document.querySelector(".actions");
  if (noteArea) noteArea.setAttribute("hidden", "");
  if (actions) actions.setAttribute("hidden", "");
  
  // Scroll to top of page to show the success message
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function expandPanel(e) {
  // Don't expand if clicking on buttons, inputs, or links
  if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || 
      e.target.tagName === 'TEXTAREA' || e.target.tagName === 'A' ||
      e.target.closest('button') || e.target.closest('input') || e.target.closest('textarea')) {
    return;
  }
  
  // Only expand if panel is collapsed
  if (!todayPlanPanel?.classList.contains("collapsed")) {
    return;
  }
  
  todayPlanPanel.classList.remove("collapsed");
  const collapsedContent = document.getElementById("collapsed-content");
  if (collapsedContent) {
    collapsedContent.remove();
  }
  
  prefillCopy.hidden = false;
  exerciseListEl.hidden = false;
  const noteArea = document.querySelector(".note-area");
  const actions = document.querySelector(".actions");
  if (noteArea) noteArea.removeAttribute("hidden");
  if (actions) actions.removeAttribute("hidden");
  
  // Re-render to show full content
  renderSession();
}


function getWorkoutForDate(dateValue, existingEntry) {
  if (existingEntry) {
    return templateMap[existingEntry.workoutId] || templateMap[rotationOrder[0]] || templates[0];
  }

  if (!state.history.length) {
    return templateMap[rotationOrder[0]] || templates[0];
  }

  const sorted = [...state.history].sort(
    (a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime()
  );
  const last = sorted[0];
  const lastIndex = rotationOrder.indexOf(last.workoutId);
  const nextIndex = lastIndex === -1 ? 0 : (lastIndex + 1) % rotationOrder.length;
  return templateMap[rotationOrder[nextIndex]] || templates[0];
}

function getLatestEntryForWorkout(workoutId) {
  const entries = state.history
    .filter((entry) => entry.workoutId === workoutId)
    .sort((a, b) => parseDate(b.date) - parseDate(a.date));
  return entries[0];
}

function renderExerciseInputs(workout, sourceEntry) {
  exerciseListEl.innerHTML = "";
  workout.exercises.forEach((exercise) => {
    const row = document.createElement("div");
    row.className = "exercise-row";

    const name = document.createElement("div");
    name.className = "exercise-name";
    name.innerHTML = `<strong>${exercise.name}</strong><div class="exercise-meta">${exercise.target}</div>`;

    const weightInput = document.createElement("input");
    weightInput.type = "text";
    weightInput.placeholder = exercise.defaultWeight || "Weight";
    weightInput.value =
      sourceEntry?.exercises.find((e) => e.name === exercise.name)?.weight ??
      exercise.defaultWeight ??
      "";
    weightInput.dataset.exercise = exercise.name;
    weightInput.dataset.field = "weight";

    const repsInput = document.createElement("input");
    repsInput.type = "text";
    repsInput.placeholder = exercise.target;
    repsInput.value =
      sourceEntry?.exercises.find((e) => e.name === exercise.name)?.reps ??
      exercise.target;
    repsInput.dataset.exercise = exercise.name;
    repsInput.dataset.field = "reps";

    row.appendChild(name);
    row.appendChild(weightInput);
    row.appendChild(repsInput);
    exerciseListEl.appendChild(row);
  });
}

function handleSave() {
  const dateValue = sessionDateInput.value || formatDate(today);
  const existing = state.history.find((entry) => entry.date === dateValue);
  const planned = getWorkoutForDate(dateValue, existing);
  const exercises = Array.from(
    exerciseListEl.querySelectorAll("input")
  ).reduce((acc, input) => {
    const existing = acc.find((item) => item.name === input.dataset.exercise);
    if (existing) {
      existing[input.dataset.field] = input.value.trim();
    } else {
      acc.push({
        name: input.dataset.exercise,
        weight: input.dataset.field === "weight" ? input.value.trim() : "",
        reps: input.dataset.field === "reps" ? input.value.trim() : "",
      });
    }
    return acc;
  }, []);

  const entry = {
    date: dateValue,
    workoutId: planned.id,
    note: noteField.value.trim(),
    exercises,
  };

  state.history = state.history.filter((h) => h.date !== dateValue);
  state.history.push(entry);
  persistState();
  
  // Set flag to show collapsed state if saving today's session
  if (dateValue === formatDate(today)) {
    justSaved = true;
  }
  
  renderSession();
  
  // Automatically backup to Netlify in the background
  autoBackupToNetlify();
}

function handleResetToday() {
  sessionDateInput.value = formatDate(today);
  justSaved = false; // Reset the flag when resetting
  renderSession();
  setDayDetail(null);
}

function renderHistory() {
  const sorted = [...state.history].sort(
    (a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime()
  );
  historyList.innerHTML = "";
  sorted.slice(0, 20).forEach((entry) => {
    const workout = templateMap[entry.workoutId];
    const item = document.createElement("li");
    item.className = "history-item";
    item.innerHTML = `
      <div>
        <strong>${workout?.name ?? "Workout"}</strong>
        <div class="meta">${entry.date}${entry.note ? " • " + entry.note : ""}</div>
      </div>
      <button class="ghost-btn" data-date="${entry.date}">View</button>
    `;
    item.querySelector("button").addEventListener("click", () => {
      sessionDateInput.value = entry.date;
      renderSession();
      setDayDetail(entry.date);
    });
    historyList.appendChild(item);
  });
}

function changeMonth(delta) {
  const newMonth = monthCursor.month + delta;
  const date = new Date(monthCursor.year, newMonth, 1);
  monthCursor = { month: date.getMonth(), year: date.getFullYear() };
  renderCalendar();
}

function renderCalendar() {
  const { month, year } = monthCursor;
  const firstDay = new Date(year, month, 1);
  const startWeekDay = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = firstDay.toLocaleString("default", { month: "long", year: "numeric" });
  monthLabel.textContent = monthName;

  const entriesByDate = state.history.reduce((acc, entry) => {
    acc[entry.date] = entry;
    return acc;
  }, {});

  calendarGrid.innerHTML = "";
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  dayNames.forEach((name) => {
    const head = document.createElement("div");
    head.className = "muted";
    head.textContent = name;
    head.style.textAlign = "center";
    calendarGrid.appendChild(head);
  });

  for (let i = 0; i < startWeekDay; i++) {
    const empty = document.createElement("div");
    calendarGrid.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateValue = formatDate(new Date(year, month, day));
    const entry = entriesByDate[dateValue];

    const cell = document.createElement("div");
    cell.className = `calendar-day${entry ? " has-entry" : ""}`;
    const button = document.createElement("button");
    const label = entry ? workoutShortLabel[entry.workoutId] || templateMap[entry.workoutId]?.name || "" : "";
    button.innerHTML = `<span class="day-number">${day}</span><span class="exercise-meta">${label}</span>`;
    button.addEventListener("click", () => {
      sessionDateInput.value = dateValue;
      renderSession();
      setDayDetail(dateValue);
    });
    cell.appendChild(button);
    calendarGrid.appendChild(cell);
  }
}

function renderWeekBar() {
  if (!weekBar) return;
  const dayNames = ["S", "M", "T", "W", "T", "F", "S"];
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay());

  weekBar.innerHTML = "";
  for (let i = 0; i < 7; i++) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const dateValue = formatDate(date);
    const entry = state.history.find((h) => h.date === dateValue);
    const bubble = document.createElement("button");
    bubble.className = `week-dot${entry ? " filled" : ""}`;
    const span = document.createElement("span");
    span.textContent = entry ? "💪" : dayNames[i];
    bubble.appendChild(span);
    if (entry) {
      const label = templateMap[entry.workoutId]?.name || "Workout";
      bubble.title = `${label} (${dateValue})`;
    }
    bubble.addEventListener("click", () => {
      sessionDateInput.value = dateValue;
      renderSession();
      setDayDetail(dateValue);
    });
    weekBar.appendChild(bubble);
  }
}

function setDayDetail(dateValue) {
  if (!dateValue) {
    dayDetail.textContent = "Select a day to see what you did.";
    return;
  }

  const entry = state.history.find((h) => h.date === dateValue);
  if (!entry) {
    dayDetail.textContent = `No workout logged for ${dateValue}.`;
    return;
  }

  const workout = templateMap[entry.workoutId];
  const safeNote = (entry.note || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
  const lines = entry.exercises
    .map((e) => `${e.name}: ${e.weight || "—"} • ${e.reps || workout?.exercises.find((x) => x.name === e.name)?.target || ""}`)
    .join("\n");

  dayDetail.innerHTML = `
    <strong>${workout?.name ?? "Workout"} on ${entry.date}</strong><br>
    ${entry.note ? `<em>${safeNote}</em><br>` : ""}
    <pre>${lines}</pre>
  `;
}

function normalizeBackupKey(value) {
  if (!value) return "";
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "")
    .slice(0, 64);
}

function generateBackupKey() {
  if (window.crypto?.getRandomValues) {
    const bytes = new Uint8Array(6);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  return `rw-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function getBackupKey() {
  const existing = normalizeBackupKey(localStorage.getItem(backupKeyStorageKey) || "");
  if (existing) return existing;
  const generated = generateBackupKey();
  setBackupKey(generated);
  return generated;
}

function setBackupKey(value) {
  try {
    localStorage.setItem(backupKeyStorageKey, value);
  } catch {
    // ignore storage errors
  }
}

function getBackupKeyFromInput() {
  if (!backupKeyInput) return "";
  const normalized = normalizeBackupKey(backupKeyInput.value);
  if (!normalized) {
    updateCloudStatus("Enter a backup key to continue.");
    backupKeyInput.focus();
    return "";
  }
  if (normalized !== backupKeyInput.value) {
    backupKeyInput.value = normalized;
  }
  setBackupKey(normalized);
  return normalized;
}

function updateCloudStatus(message) {
  if (cloudStatus) {
    cloudStatus.textContent = message;
  }
}

function parseErrorMessage(errorText, fallback) {
  if (!errorText) return fallback;
  try {
    const parsed = JSON.parse(errorText);
    if (parsed?.error) return parsed.error;
  } catch {
    // ignore parse errors
  }
  return errorText;
}

function initCloudBackup() {
  if (!cloudStatus) return;
  if (backupKeyInput) {
    backupKeyInput.value = getBackupKey();
  }
  updateCloudStatus("Ready to backup/restore.");
}

async function handleCopyBackupKey() {
  const key = getBackupKeyFromInput();
  if (!key) return;
  try {
    await navigator.clipboard.writeText(key);
    updateCloudStatus("Backup key copied.");
  } catch (error) {
    console.error("Failed to copy backup key:", error);
    updateCloudStatus("Copy failed. Please copy the key manually.");
  }
}

// Silent automatic backup - runs in background without blocking UI
async function autoBackupToNetlify() {
  if (!state.history.length) return;
  
  const key = getBackupKey();
  if (!key) return;
  
  // Run backup in background without blocking
  (async () => {
    try {
      const payload = {
        key,
        data: {
          version: 1,
          exportedAt: new Date().toISOString(),
          history: state.history,
        },
      };
      
      const response = await fetch("/.netlify/functions/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (response.ok) {
        // Silently update status on success
        if (cloudStatus) {
          const count = state.history.length;
          cloudStatus.textContent = `✓ Auto-backed up ${count} session${count === 1 ? "" : "s"}.`;
          // Clear status after 3 seconds
          setTimeout(() => {
            if (cloudStatus && cloudStatus.textContent.includes("Auto-backed up")) {
              cloudStatus.textContent = "Ready to backup/restore.";
            }
          }, 3000);
        }
      } else {
        // Log error but don't show alert
        const errorText = await response.text();
        console.error("Auto-backup failed:", parseErrorMessage(errorText, `HTTP ${response.status}`));
      }
    } catch (error) {
      // Log error but don't interrupt user
      console.error("Auto-backup error:", error);
    }
  })();
}

async function handleCloudBackup() {
  if (!state.history.length) {
    updateCloudStatus("No workout sessions to backup.");
    return;
  }

  const key = getBackupKeyFromInput();
  if (!key) return;

  const payload = {
    key,
    data: {
      version: 1,
      exportedAt: new Date().toISOString(),
      history: state.history,
    },
  };

  updateCloudStatus("Backing up to Netlify...");

  try {
    if (cloudBackupBtn) cloudBackupBtn.disabled = true;
    const response = await fetch("/.netlify/functions/backup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(parseErrorMessage(errorText, `HTTP ${response.status}`));
    }

    await response.json().catch(() => ({}));
    const count = state.history.length;
    updateCloudStatus(`✓ Backed up ${count} session${count === 1 ? "" : "s"} to Netlify.`);
  } catch (error) {
    console.error("Backup failed:", error);
    updateCloudStatus(`Backup failed: ${error.message}`);
    alert(`Backup failed: ${error.message}`);
  } finally {
    if (cloudBackupBtn) cloudBackupBtn.disabled = false;
  }
}

async function handleCloudRestore() {
  const key = getBackupKeyFromInput();
  if (!key) return;

  if (!confirm("This will replace your current workout data with the Netlify backup. Continue?")) {
    return;
  }

  updateCloudStatus("Restoring from Netlify...");

  try {
    if (cloudRestoreBtn) cloudRestoreBtn.disabled = true;
    const response = await fetch(`/.netlify/functions/backup?key=${encodeURIComponent(key)}`, {
      method: "GET",
    });

    if (response.status === 404) {
      updateCloudStatus("No backup found for this key.");
      return;
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(parseErrorMessage(errorText, `HTTP ${response.status}`));
    }

    const result = await response.json();
    const sessions = result?.data?.history;
    if (!sessions || !Array.isArray(sessions)) {
      throw new Error("Invalid backup data received from Netlify.");
    }

    const normalizedSessions = sessions.map((session) => ({
      ...session,
      date: normalizeDate(session.date),
    }));

    state.history = normalizedSessions.sort(
      (a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime()
    );

    persistState();
    renderSession();
    renderHistory();
    renderCalendar();

    updateCloudStatus(`✓ Restored ${sessions.length} session${sessions.length === 1 ? "" : "s"} from Netlify.`);
  } catch (error) {
    console.error("Restore failed:", error);
    updateCloudStatus(`Restore failed: ${error.message}`);
    alert(`Restore failed: ${error.message}`);
  } finally {
    if (cloudRestoreBtn) cloudRestoreBtn.disabled = false;
  }
}

function handleReset() {
  if (!confirm("Reset to starter data? This keeps your offline storage clean.")) return;
  state = { history: [] };
  seedInitialHistory();
  renderSession();
  renderHistory();
  renderCalendar();
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  
  navigator.serviceWorker
    .register("./service-worker.js")
    .then((registration) => {
      console.log("Service Worker registered:", registration);
      // Check for updates
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            // New service worker available, reload to activate
            window.location.reload();
          }
        });
      });
    })
    .catch((error) => {
      console.error("Service Worker registration failed:", error);
    });
}

function setupInstallPrompt() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    installButton.hidden = false;
  });

  installButton.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installButton.hidden = true;
  });
}

