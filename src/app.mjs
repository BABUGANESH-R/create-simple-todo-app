import {
  addTodo,
  clearCompleted,
  countActive,
  countCompleted,
  filterTodos,
  isValidFilter,
  loadTodos,
  removeTodo,
  saveTodos,
  toggleTodo,
} from './todos.mjs';

const state = {
  todos: [],
  filter: 'all',
};

const elements = {};

function pluralize(count, singular, plural = `${singular}s`) {
  return count === 1 ? singular : plural;
}

function persistAndRender() {
  saveTodos(state.todos);
  render();
}

function getEmptyMessage() {
  if (state.todos.length === 0) {
    return 'No todos yet. Add one above to get started.';
  }

  if (state.filter === 'active') {
    return 'All done. There are no active todos.';
  }

  if (state.filter === 'completed') {
    return 'No completed todos yet.';
  }

  return 'No todos to show.';
}

function createTodoItem(todo) {
  const item = document.createElement('li');
  item.className = 'todo-item';
  item.dataset.todoId = todo.id;
  if (todo.completed) {
    item.classList.add('todo-item--completed');
  }

  const checkboxId = `todo-${todo.id}`;

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = checkboxId;
  checkbox.checked = todo.completed;
  checkbox.dataset.action = 'toggle';
  checkbox.setAttribute('aria-label', `Mark ${todo.text} as ${todo.completed ? 'active' : 'complete'}`);

  const label = document.createElement('label');
  label.htmlFor = checkboxId;
  label.className = 'todo-item__text';
  label.textContent = todo.text;

  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.className = 'todo-item__delete';
  deleteButton.dataset.action = 'delete';
  deleteButton.textContent = 'Delete';
  deleteButton.setAttribute('aria-label', `Delete ${todo.text}`);

  item.append(checkbox, label, deleteButton);
  return item;
}

function render() {
  const visibleTodos = filterTodos(state.todos, state.filter);
  const activeCount = countActive(state.todos);
  const completedCount = countCompleted(state.todos);

  elements.count.textContent = `${activeCount} ${pluralize(activeCount, 'item')} left`;
  elements.clearCompleted.disabled = completedCount === 0;

  elements.filters.forEach((button) => {
    const selected = button.dataset.filter === state.filter;
    button.classList.toggle('is-selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });

  elements.emptyState.textContent = getEmptyMessage();
  elements.emptyState.hidden = visibleTodos.length > 0;

  elements.list.replaceChildren(...visibleTodos.map(createTodoItem));
}

function handleSubmit(event) {
  event.preventDefault();
  elements.message.textContent = '';

  try {
    state.todos = addTodo(state.todos, elements.input.value);
    elements.input.value = '';
    elements.input.focus();
    persistAndRender();
  } catch (error) {
    elements.message.textContent = error instanceof TypeError ? error.message : 'Could not add that todo.';
    elements.input.focus();
  }
}

function handleListChange(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement) || target.dataset.action !== 'toggle') {
    return;
  }

  const item = target.closest('[data-todo-id]');
  if (!item) {
    return;
  }

  state.todos = toggleTodo(state.todos, item.dataset.todoId);
  persistAndRender();
}

function handleListClick(event) {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement) || target.dataset.action !== 'delete') {
    return;
  }

  const item = target.closest('[data-todo-id]');
  if (!item) {
    return;
  }

  state.todos = removeTodo(state.todos, item.dataset.todoId);
  persistAndRender();
}

function handleFilterClick(event) {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement) || !isValidFilter(target.dataset.filter)) {
    return;
  }

  state.filter = target.dataset.filter;
  render();
}

function handleClearCompleted() {
  state.todos = clearCompleted(state.todos);
  persistAndRender();
}

function bindElements() {
  elements.form = document.querySelector('[data-todo-form]');
  elements.input = document.querySelector('[data-todo-input]');
  elements.message = document.querySelector('[data-form-message]');
  elements.count = document.querySelector('[data-count]');
  elements.list = document.querySelector('[data-todo-list]');
  elements.emptyState = document.querySelector('[data-empty-state]');
  elements.clearCompleted = document.querySelector('[data-clear-completed]');
  elements.filters = [...document.querySelectorAll('[data-filter]')];
}

function bindEvents() {
  elements.form.addEventListener('submit', handleSubmit);
  elements.list.addEventListener('change', handleListChange);
  elements.list.addEventListener('click', handleListClick);
  elements.filters.forEach((button) => button.addEventListener('click', handleFilterClick));
  elements.clearCompleted.addEventListener('click', handleClearCompleted);
}

function init() {
  bindElements();
  state.todos = loadTodos();
  bindEvents();
  render();
}

document.addEventListener('DOMContentLoaded', init);
