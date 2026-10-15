const handlers = new Map();

function on(eventName, handler) {
  const listeners = handlers.get(eventName) ?? [];
  listeners.push(handler);
  handlers.set(eventName, listeners);
  return handler;
}

function emit(eventName, payload) {
  for (const handler of handlers.get(eventName) ?? []) {
    try {
      handler(payload);
    } catch {
      // Event handlers are isolated from the request that emitted the event.
    }
  }
}

module.exports = { on, emit };