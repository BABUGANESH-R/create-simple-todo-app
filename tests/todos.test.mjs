import assert from 'node:assert/strict';
import test from 'node:test';

import {
  addTodo,
  clearCompleted,
  countActive,
  countCompleted,
  createTodo,
  filterTodos,
  isValidFilter,
  loadTodos,
  removeTodo,
  saveTodos,
  toggleTodo,
} from '../src/todos.mjs';

function createFakeStorage(initial = {}) {
  const values = new Map(Object.entries(initial));

  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    dump() {
      return Object.fromEntries(values);
    },
  };
}

test('createTodo trims and normalizes non-empty todo text', () => {
  assert.deepEqual(createTodo('  write   the tests  ', { id: 'todo-1' }), {
    id: 'todo-1',
    text: 'write the tests',
    completed: false,
  });
});

test('createTodo rejects blank todo text', () => {
  assert.throws(() => createTodo(' \n\t '), /must not be blank/);
  assert.throws(() => createTodo(null), /must not be blank/);
});

test('addTodo returns a new todo collection without mutating the old one', () => {
  const original = [createTodo('first', { id: 'first' })];
  const next = addTodo(original, 'second', { id: 'second' });

  assert.notEqual(next, original);
  assert.deepEqual(original.map((todo) => todo.id), ['first']);
  assert.deepEqual(next.map((todo) => todo.id), ['first', 'second']);
});

test('toggleTodo only toggles the matching todo and preserves the original collection', () => {
  const original = [
    createTodo('active', { id: 'active' }),
    { ...createTodo('done', { id: 'done' }), completed: true },
  ];
  const next = toggleTodo(original, 'active');

  assert.notEqual(next, original);
  assert.equal(original[0].completed, false);
  assert.equal(next[0].completed, true);
  assert.equal(next[1].completed, true);
});

test('removeTodo and clearCompleted return immutable filtered collections', () => {
  const active = createTodo('keep', { id: 'keep' });
  const completed = { ...createTodo('remove', { id: 'remove' }), completed: true };
  const original = [active, completed];

  assert.deepEqual(removeTodo(original, 'remove'), [active]);
  assert.deepEqual(clearCompleted(original), [active]);
  assert.equal(original.length, 2);
});

test('filterTodos supports all, active, and completed filters', () => {
  const active = createTodo('active', { id: 'active' });
  const completed = { ...createTodo('completed', { id: 'completed' }), completed: true };
  const todos = [active, completed];

  assert.deepEqual(filterTodos(todos, 'all'), todos);
  assert.notEqual(filterTodos(todos, 'all'), todos);
  assert.deepEqual(filterTodos(todos, 'active'), [active]);
  assert.deepEqual(filterTodos(todos, 'completed'), [completed]);
  assert.throws(() => filterTodos(todos, 'missing'), /Unknown todo filter/);
});

test('filter validation and counts reflect current todo state', () => {
  const todos = [
    createTodo('one', { id: 'one' }),
    { ...createTodo('two', { id: 'two' }), completed: true },
    createTodo('three', { id: 'three' }),
  ];

  assert.equal(isValidFilter('all'), true);
  assert.equal(isValidFilter('active'), true);
  assert.equal(isValidFilter('completed'), true);
  assert.equal(isValidFilter('archived'), false);
  assert.equal(countActive(todos), 2);
  assert.equal(countCompleted(todos), 1);
});

test('saveTodos and loadTodos round-trip valid records through storage', () => {
  const storage = createFakeStorage();
  const todos = [
    createTodo('persist me', { id: 'persist' }),
    { ...createTodo('already done', { id: 'done' }), completed: true },
  ];

  assert.equal(saveTodos(todos, storage), true);
  assert.deepEqual(loadTodos(storage), todos);
  assert.match(storage.dump()['simple-todos'], /persist me/);
});

test('loadTodos falls back to an empty collection for invalid stored data', () => {
  const cases = [
    '{not-json',
    JSON.stringify({ id: 'not-an-array' }),
    JSON.stringify([{ id: 'missing-text', completed: false }]),
    JSON.stringify([{ id: '', text: 'missing id', completed: false }]),
    JSON.stringify([{ id: 'ok', text: 'valid' }, null]),
  ];

  for (const raw of cases) {
    assert.deepEqual(loadTodos(createFakeStorage({ 'simple-todos': raw })), []);
  }
});

test('loadTodos and saveTodos tolerate unavailable or failing storage', () => {
  const failingStorage = {
    getItem() {
      throw new Error('read denied');
    },
    setItem() {
      throw new Error('write denied');
    },
  };

  assert.deepEqual(loadTodos(undefined), []);
  assert.deepEqual(loadTodos(failingStorage), []);
  assert.equal(saveTodos([createTodo('safe', { id: 'safe' })], undefined), false);
  assert.equal(saveTodos([createTodo('safe', { id: 'safe' })], failingStorage), false);
});

test('saveTodos refuses structurally invalid records', () => {
  assert.throws(
    () => saveTodos([{ id: 'bad', text: '   ', completed: false }], createFakeStorage()),
    /invalid todo records/,
  );
});
