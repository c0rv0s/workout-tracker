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
const sessionDateInput = document.getElementById("session-date");
const plannedTitle = document.getElementById("planned-title");
const exerciseListEl = document.getElementById("exercise-list");
const prefillCopy = document.getElementById("prefill-copy");
const noteField = document.getElementById("session-note");
const saveButton = document.getElementById("save-session");
const resetTodayButton = document.getElementById("reset-today");
const importText = document.getElementById("import-text");
const importButton = document.getElementById("import-button");
const exportButton = document.getElementById("export-button");
const historyList = document.getElementById("history-list");
const calendarGrid = document.getElementById("calendar-grid");
const dayDetail = document.getElementById("day-detail");
const monthLabel = document.getElementById("month-label");
const prevMonthBtn = document.getElementById("prev-month");
const nextMonthBtn = document.getElementById("next-month");
const installButton = document.getElementById("install-button");
const weekBar = document.getElementById("week-bar");

let deferredPrompt = null;

const today = new Date();
let monthCursor = { month: today.getMonth(), year: today.getFullYear() };
let state = loadState();

init();

function init() {
  if (!state.history.length) {
    seedInitialHistory();
  }

  sessionDateInput.value = formatDate(today);
  saveButton.addEventListener("click", handleSave);
  resetTodayButton.addEventListener("click", handleResetToday);
  importButton.addEventListener("click", handleImport);
  exportButton.addEventListener("click", handleExport);
  prevMonthBtn.addEventListener("click", () => changeMonth(-1));
  nextMonthBtn.addEventListener("click", () => changeMonth(1));

  registerServiceWorker();
  setupInstallPrompt();
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
  } catch {
    // keep going even if storage fails
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

function renderSession() {
  const dateValue = sessionDateInput.value || formatDate(today);
  const existing = state.history.find((entry) => entry.date === dateValue);
  const plannedWorkout = getWorkoutForDate(dateValue, existing);

  plannedTitle.textContent = `${plannedWorkout.name}`;
  const prefillSource = existing || getLatestEntryForWorkout(plannedWorkout.id);
  prefillCopy.textContent = prefillSource
    ? "Prefilled from your most recent session for this workout."
    : "Starting from the template targets below.";

  noteField.value = existing?.note ?? "";
  renderExerciseInputs(plannedWorkout, prefillSource);
  renderHistory();
  renderCalendar();
  renderWeekBar();
  setDayDetail(existing ? existing.date : null);
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
  renderSession();
}

function handleResetToday() {
  sessionDateInput.value = formatDate(today);
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
    bubble.textContent = dayNames[i];
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

function handleImport() {
  const raw = importText.value.trim();
  if (!raw) {
    alert("Paste your note text first.");
    return;
  }

  let sessions;
  try {
    sessions = parseImportedSessions(raw);
  } catch (error) {
    alert(error.message || "Could not import these notes.");
    return;
  }

  if (!sessions.length) {
    alert("No dated workouts found to import.");
    return;
  }

  sessions.forEach((session) => {
    state.history = state.history.filter((h) => h.date !== session.date);
    state.history.push(session);
  });

  sessionDateInput.value = formatDate(today);
  importText.value = "";
  persistState();
  renderSession();
  alert(`Imported ${sessions.length} workout${sessions.length > 1 ? "s" : ""}.`);
}

function handleExport() {
  if (!state.history.length) {
    alert("No saved workouts to export yet.");
    return;
  }

  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    history: state.history,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `workouts-${formatDate(today)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function parseImportedSessions(raw) {
  const lines = raw.split(/\r?\n/);
  const sessions = [];
  let current = null;

  function pushCurrent() {
    if (!current) return;
    const workout = templateMap[current.workoutId];
    if (!workout) {
      throw new Error(`Unknown workout name: ${current.workoutName}`);
    }
    if (!current.exercises.length) {
      throw new Error(`No exercises found for ${current.workoutName}.`);
    }
    const exercises = current.exercises.map((ex) => {
      const templateExercise = workout.exercises.find(
        (t) => t.name.toLowerCase() === ex.name.toLowerCase()
      );
      return {
        name: ex.name,
        weight: ex.weight || templateExercise?.defaultWeight || "",
        reps: ex.reps || templateExercise?.target || "",
      };
    });
    sessions.push({
      date: current.date,
      workoutId: current.workoutId,
      note: current.noteLines.join("\n").trim(),
      exercises,
    });
    current = null;
  }

  lines.forEach((lineRaw) => {
    const line = lineRaw.trimEnd();
    const trimmed = line.trim();
    if (!trimmed) {
      if (!current) return;
      if (!current.exercises.length) {
        return; // ignore leading blank lines before exercises
      }
      current.inNote = true;
      return;
    }

    const headerMatch = trimmed.match(/^(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?\s+(.*)$/);
    if (headerMatch) {
      pushCurrent();
      const [, month, day, maybeYear, workoutNameRaw] = headerMatch;
      const workoutId = resolveWorkoutId(workoutNameRaw);
      const date = resolveIsoDate(Number(month), Number(day), maybeYear);
      current = {
        workoutName: workoutNameRaw.trim(),
        workoutId,
        date,
        exercises: [],
        noteLines: [],
        inNote: false,
      };
      return;
    }

    if (!current) return;

    if (!current.inNote) {
      const exercise = parseExerciseLine(line);
      if (exercise) {
        current.exercises.push(exercise);
        return;
      }
      // If it isn't an exercise line, treat following lines as note.
      current.inNote = true;
    }

    if (current.inNote) {
      current.noteLines.push(line);
    }
  });

  pushCurrent();
  return sessions;
}

function parseExerciseLine(line) {
  let parts = line.split(/\t+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 1) {
    parts = line.split(/\s{2,}/).map((p) => p.trim()).filter(Boolean);
  }

  if (!parts.length) return null;
  const [name, weight = "", reps = ""] = parts;
  return { name, weight, reps };
}

function resolveWorkoutId(name) {
  const normalized = name.toLowerCase().replace(/\s+/g, " ").trim();
  const lookup = {
    "upper hypertrophy": "upper-hyp",
    "lower hypertrophy": "lower-hyp",
    "upper power": "upper-power",
    "lower power": "lower-power",
  };
  const workoutId = lookup[normalized];
  if (!workoutId) {
    throw new Error(`Unknown workout "${name}".`);
  }
  return workoutId;
}

function resolveIsoDate(month, day, yearString) {
  let year = yearString ? Number(yearString) : today.getFullYear();
  if (year < 100) {
    year += 2000;
  }

  let candidate = new Date(year, month - 1, day);
  if (!yearString && candidate > today) {
    candidate = new Date(year - 1, month - 1, day);
  }
  return formatDate(candidate);
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
  // Avoid stale caches while iterating locally: unregister any existing workers and skip registering a new one.
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((reg) => reg.unregister());
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
