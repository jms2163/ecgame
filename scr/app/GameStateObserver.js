// Private by convention — do NOT access outside this file
const _listeners = {};

const GameStateObserver = {

    // --------------------------------------------------
    // Subscribe to an event
    // --------------------------------------------------
    on(eventName, callback) {
        if (!_listeners[eventName]) {
            _listeners[eventName] = [];
        }
        _listeners[eventName].push(callback);
    },

    // --------------------------------------------------
    // Unsubscribe from an event
    // --------------------------------------------------
    off(eventName, callback) {
        const list = _listeners[eventName];
        if (!list) return;

        _listeners[eventName] = list.filter(cb => cb !== callback);
    },

    // --------------------------------------------------
    // Notify observers
    // --------------------------------------------------
    notify(eventName, payload) {
        const callbacks = _listeners[eventName];
        if (!callbacks) return;

        for (const cb of callbacks) {
            cb(payload);
        }
    }
};

export default GameStateObserver;
