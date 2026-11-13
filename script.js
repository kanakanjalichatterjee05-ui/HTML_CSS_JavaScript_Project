/* ==========================================================
   Interactive To-Do List with LocalStorage
   - State lives in the `tasks` array; the UI is rebuilt from it.
   - User text is only ever inserted with textContent (no innerHTML).
   ========================================================== */

(function () {
  'use strict';

  const STORAGE_KEY = 'todo-tasks-v1';

  // ---------- DOM references ----------
  const form = document.getElementById('task-form');
  const input = document.getElementById('task-input');
  const list = document.getElementById('task-list');
  const emptyState = document.getElementById('empty-state');
  const summary = document.getElementById('summary');

  // ---------- State ----------
  // Each task: { id: string, text: string, completed: boolean }
  let tasks = loadTasks();

  // ---------- Storage ----------

  /** Read tasks from localStorage. Returns [] on first visit or bad data. */
  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return []; // first-time visitor / incognito: empty list

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      // Keep only well-formed entries so corrupted data can't break rendering
      return parsed
        .filter(t => t && typeof t.text === 'string')
        .map(t => ({
          id: String(t.id || makeId()),
          text: t.text,
          completed: Boolean(t.completed)
        }));
    } catch (err) {
      // Corrupted JSON or storage blocked: fall back to an empty list
      console.warn('Could not load tasks:', err);
      return [];
    }
  }

  /** Write the tasks array to localStorage as a JSON string. */
  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (err) {
      // Storage may be full or disabled; the app still works for this session
      console.warn('Could not save tasks:', err);
    }
  }

  // ---------- Helpers ----------

  /** Generate a reasonably unique id for a task. */
  function makeId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  // ---------- Actions (change state, then save + re-render) ----------

  function addTask(text) {
    tasks.push({ id: makeId(), text: text, completed: false });
    update();
  }

  function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) task.completed = !task.completed;
    update();
  }

  function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    update();
  }

  /** Persist, then redraw everything from the array. */
  function update() {
    saveTasks();
    render();
  }

  // ---------- Rendering ----------

  /** Build one <li> using safe DOM methods only. */
  function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.completed ? ' completed' : '');

    // Clicking the text toggles completion
    const textBtn = document.createElement('button');
    textBtn.type = 'button';
    textBtn.className = 'task-text';
    textBtn.textContent = task.text; // safe: treated as text, never HTML
    textBtn.setAttribute('aria-pressed', String(task.completed));
    textBtn.addEventListener('click', () => toggleTask(task.id));

    // Delete button
    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'btn-delete';
    delBtn.textContent = '\u00D7'; // multiplication sign
    delBtn.setAttribute('aria-label', 'Delete task: ' + task.text);
    delBtn.addEventListener('click', () => deleteTask(task.id));

    li.append(textBtn, delBtn);
    return li;
  }

  /** Rebuild the whole list from the `tasks` array. */
  function render() {
    list.replaceChildren(); // clear existing items

    const fragment = document.createDocumentFragment();
    tasks.forEach(task => fragment.appendChild(createTaskElement(task)));
    list.appendChild(fragment);

    // Empty state + summary line
    emptyState.hidden = tasks.length > 0;

    const done = tasks.filter(t => t.completed).length;
    summary.textContent = tasks.length === 0
      ? ''
      : done + ' of ' + tasks.length + ' completed';
  }

  // ---------- Events ----------

  // Submitting the form covers both the Add button and the Enter key
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return; // ignore empty / whitespace-only input
    addTask(text);
    input.value = '';
    input.focus();
  });

  // ---------- Init ----------
  render();
})();