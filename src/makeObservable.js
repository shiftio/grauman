export default function makeObservable(obj) {
    // internal hash that will track all of the event handlers bound through the `on` method
    const _observers = {};

    // parent object that should receive bubbled events
    let _bubbleTarget = null;

    /**
     * Attach an event callback function to this instance.
     *
     * @param {string} eventName Name of the event to subscribe to.
     * @param {function} callback A function to execute when the event is triggered.
     * @example
     * var callback = function (e) { console.log("it's playing!"); };
     * mediaPlayer.on('playing', callback);
     */
    obj.on = function (eventName, callback) {
        if (typeof eventName !== 'string' || !eventName) {
            throw new TypeError('Grauman `on` function requires eventName argument');
        } else if (typeof callback !== 'function') {
            throw new TypeError('Grauman `on` function requires callback function argument');
        }

        const queue = _observers[eventName] || (_observers[eventName] = []);

        queue.push(callback);
    }.bind(obj);

    /**
     * Detach the given callback function from this instance. If the given
     * callback is registered multiple times, all of them will be detached.
     *
     * If a callback function is not given, then *all* callback functions for the
     * given event will be removed.
     *
     * @param {string} eventName Name of the event subscribed to.
     * @param {function} [callback=] The callback function to detach. If this
     *        argument is not provided, then all callback functions for the given
     *        event will be detached.
     * @example
     * // unbind the callback that was bound in the `on` example above
     * mediaPlayer.off('playing', callback);
     *
     * // unbind all callbacks bound to the 'playing' event
     * mediaPlayer.off('playing');
     */
    obj.off = function (eventName, callback) {
        const queue = _observers[eventName];

        if (queue && queue.length) {
            if (callback) {
                _observers[eventName] = queue.filter(function (fn) {
                    return fn !== callback;
                });
            } else {
                _observers[eventName] = [];
            }
        }
    }.bind(obj);

    /**
     * Send an event to all of its listeners.
     *
     * @private
     * @param {string} eventName Name of the event to fire.
     * @param {Event} event Event object to send.
     */
    obj._notify = function (eventName, event) {
        const queue = _observers[eventName];

        if (queue && queue.length) {
            // shallow-copy the array, just in case handlers unbind themselves
            // while we're iterating/calling them
            //
            // TODO: BUG - calling `off` in an `on` callback will not prevent any duplicate
            // subscriptions from being invoked during this loop, since we're looping on
            // a shallow-copy
            queue.slice(0).forEach(function (callback) {
                callback.call(this, event);
            }, this);
        }

        if (_bubbleTarget && typeof _bubbleTarget._notify === 'function') {
            _bubbleTarget._notify(eventName, event);
        }
    }.bind(obj);

    /**
     * Set object that will receive bubbled events
     *
     * @param {object} target Events receiver
     */
    obj.setEventBubbleTarget = function (target) {
        if (typeof target !== 'object' || typeof target._notify !== 'function') {
            throw new TypeError('Bubble target should be an observable object');
        }

        _bubbleTarget = target;
    }.bind(obj);
}
