const STORAGE_KEY = 'simple-todos';
const VALID_FILTERS = new Set(['all', 'active', 'completed']);

function createId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  return `todo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeText(text) {
  return String(text ?? '').trim().replace(/\s+/g, ' ');
}

function normalizeTodo(todo) {
  if (!todo || typeof todo !== 'object') {
    return null;
  }

  const text = normalizeText(todo.text);
  if (!text || typeof todo.id !== 'string' || !todo.id.trim()) {
    return null;
  }

  return {
    id: todo.id,
    text,
    completed: Boolean(todo.completed),
  };
}

export function createTodo(text, { id = createId() } = {}) {
  const normalizedText = normalizeText(text);
  if (!normalizedText) {
    throw new TypeError('Todo text must not be blank.');
  }

  return {
    id,
    text: normalizedText,
    completed: false,
  };
}

export function addTodo(todos, text, options) {
  return [...todos, createTodo(text, options)];
}

export function toggleTodo(todos, id) {
  return todos.map((todo) =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo,
  );
}

export function removeTodo(todos, id) {
  return todos.filter((todo) => todo.id !== id);
}

export function clearCompleted(todos) {
  return todos.filter((todo) => !todo.completed);
}

export function filterTodos(todos, filter = 'all') {
  switch (filter) {
    case 'active':
      return todos.filter((todo) => !todo.completed);
    case 'completed':
      return todos.filter((todo) => todo.completed);
    case 'all':
      return [...todos];
    default:
      throw new TypeError(`Unknown todo filter: ${filter}`);
  }
}

export function isValidFilter(filter) {
  return VALID_FILTERS.has(filter);
}

export function countActive(todos) {
  return todos.filter((todo) => !todo.completed).length;
}

export function countCompleted(todos) {
  return todos.filter((todo) => todo.completed).length;
}

export function loadTodos(storage = globalThis.localStorage, key = STORAGE_KEY) {
  if (!storage || typeof storage.getItem !== 'function') {
    return [];
  }

  try {
    const raw = storage.getItem(key);
    if (raw == null || raw === '') {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    const normalized = parsed.map(normalizeTodo);
    if (normalized.some((todo) => todo === null)) {
      return [];
    }

    return normalized;
  } catch {
    return [];
  }
}

export function saveTodos(todos, storage = globalThis.localStorage, key = STORAGE_KEY) {
  if (!storage || typeof storage.setItem !== 'function') {
    return false;
  }

  const normalized = todos.map(normalizeTodo);
  if (normalized.some((todo) => todo === null)) {
    throw new TypeError('Cannot save invalid todo records.');
  }

  try {
    storage.setItem(key, JSON.stringify(normalized));
    return true;
  } catch {
    return false;
  }
}

export { STORAGE_KEY };
