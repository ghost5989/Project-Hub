/**
 * Minimal reactive state store.
 * Page controllers can subscribe to react to cross-cutting changes.
 */
function createStore(initialState = {}) {
  let state = { ...initialState };
  const listeners = new Set();

  return {
    get(key) {
      return key ? state[key] : { ...state };
    },

    set(key, value) {
      state = { ...state, [key]: value };
      listeners.forEach((fn) => fn(state));
    },

    patch(updates) {
      state = { ...state, ...updates };
      listeners.forEach((fn) => fn(state));
    },

    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    notify() {
      listeners.forEach((fn) => fn(state));
    },
  };
}

const state = createStore({
  user: null,
  projects: [],
  categories: [],
  settings: {},
  filters: { query: '', category: 'All' },
  dashboardView: 'overview',
  loading: false,
  error: null,
});

export default state;