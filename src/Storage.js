import { DEFAULT_LOCALSTORAGE_BASE_KEY, IS_LOCALSTORAGE_AVAILABLE } from 'consts';

// intended to fail silently if localstorage is not available. it should simply act as if
// nothing is stored in the value requested.
export default class Storage {
    static get isAvailable() {
        return IS_LOCALSTORAGE_AVAILABLE;
    }

    constructor(baseKey) {
        let _baseKey = DEFAULT_LOCALSTORAGE_BASE_KEY;

        function _getLSKey(key) {
            return [_baseKey, key].join(':');
        }

        this.setBaseKey = function setBaseKey(key) {
            if (typeof key !== 'string' || !key) {
                console.warn('Storage.setBaseKey needs a non-empty string');
            } else {
                _baseKey = key;
            }
        };

        this.get = function get(key) {
            if (Storage.isAvailable) {
                return JSON.parse(localStorage.getItem(_getLSKey(key)));
            }
        };

        this.remove = function remove(key) {
            if (Storage.isAvailable) {
                localStorage.removeItem(_getLSKey(key));
            }
        };

        this.set = function set(key, value) {
            if (Storage.isAvailable) {
                try {
                    // catch an exception that will be thrown if localstorage is full
                    localStorage.setItem(_getLSKey(key), JSON.stringify(value));
                } catch (e) {}
            }
        };

        if (typeof baseKey === 'string' && baseKey) {
            _baseKey = baseKey;
        }
    }
}
