// TODO: find a better mobile detection method
export const IS_MOBILE = typeof window.orientation !== 'undefined';
export const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
export const IS_SAFARI = /constructor/i.test(window.HTMLElement) || (function (p) {
    return p.toString() === '[object SafariRemoteNotification]';
})(!window.safari || window.safari.pushNotification);

export const FULLSCREEN_EVENT_NAME = (function () {
    if (typeof document.onfullscreenchange !== 'undefined') {
        return 'fullscreenchange';
    } else if (typeof document.onwebkitfullscreenchange !== 'undefined') {
        return 'webkitfullscreenchange';
    } else if (typeof document.onmozfullscreenchange !== 'undefined') {
        return 'mozfullscreenchange';
    } else if (typeof document.onmsfullscreenchange !== 'undefined') {
        return 'msfullscreenchange';
    }
}());

export const TIME_FORMATS = { SMPTE: 'SMPTE', TIME: 'TIME' };
export const PLAYBACK_SPEEDS = [0.5, 1, 1.25, 1.5];
export const IMAGEVIEWER_MODES = { FIT: 'FIT', FILL: 'FILL' };

/**
 * Enume for the various modes of upscaling the MediaPlayer can be set to. Upscaling is the process of
 * resizing the MediaPlayer beyond the dimensions of the given MediaFile to completely fill the area of the
 * MediaPlayer's container without skewing the MediaFile's aspect ratio.
 *
 * @name UPSCALE_MODES
 * @enum {string}
 * @readonly
 */
export const UPSCALE_MODES = Object.freeze({
    /**
     * Content will only be upscaled when the MediaPlayer is in fullscreen mode.
     *
     * @property
     * @memberof UPSCALE_MODES
     */
    FULLSCREEN_ONLY: 'FULLSCREEN_ONLY',

    /**
     * Content will never be upscaled. The MediaPlayer will never scale beyond the dimensions
     * of the MediaFile, even when the MediaPlayer is in fullscreen mode.
     *
     * @property
     * @memberof UPSCALE_MODES
     */
    NEVER: 'NEVER',

    /**
     * Content will always be upscaled
     *
     * @property
     * @memberof UPSCALE_MODES
     */
    ALWAYS: 'ALWAYS'
});

export const DEFAULT_UPSCALE = UPSCALE_MODES.FULLSCREEN_ONLY;
export const DEFAULT_VOLUME = 0.5;
export const DEFAULT_FPS = 2997 / 125;
export const DEFAULT_LOOP = false;
export const DEFAULT_PLAYBACK_SPEED = 1;
export const DEFAULT_MUTED = false;
export const DEFAULT_TIME_FORMAT = TIME_FORMATS.TIME;

export const KEY_CODES = Object.freeze({
    ESCAPE: 27,
    SPACE: 32,
    END: 35,
    HOME: 36,
    LEFT_ARROW: 37,
    UP_ARROW: 38,
    RIGHT_ARROW: 39,
    DOWN_ARROW: 40,
    ZERO: 48,
    ONE: 49,
    TWO: 50,
    THREE: 51,
    FOUR: 52,
    FIVE: 53,
    SIX: 54,
    SEVEN: 55,
    EIGHT: 56,
    NINE: 57,
    F: 70,
    J: 74,
    K: 75,
    L: 76,
    M: 77,
    COMMA: 188,
    PERIOD: 190
});

export const DEFAULT_LOCALSTORAGE_BASE_KEY = 'media-player';
export const IS_LOCALSTORAGE_AVAILABLE = (function () {
    // use Modernizer's method for checking for local storage
    // https://github.com/Modernizr/Modernizr/blob/master/feature-detects/storage/localstorage.js
    const mod = 'test';

    try {
        localStorage.setItem(mod, mod);
        localStorage.removeItem(mod);

        return true;
    } catch (e) {
        return false;
    }
}());

/**
 * Enum for the various layouts of 360 stereoscopic content.
 *
 * @name STEREOSCOPIC_LAYOUTS
 * @enum {number}
 * @readonly
 */
export const STEREOSCOPIC_LAYOUTS = Object.freeze({
    /**
     * The content is not stereoscopic
     *
     * @property
     * @memberof STEREOSCOPIC_LAYOUTS
     */
    NONE: 'NONE',

    /**
     * The content is arranged LEFT/RIGHT, meaning the content for the left eye occupies the
     * left half of the frame, and the content for the right eye occupies the right
     * half of the frame.
     *
     * @property
     * @memberof STEREOSCOPIC_LAYOUTS
     */
    TOP_BOTTOM: 'TOP_BOTTOM',

    /**
     * The content is arranged TOP/BOTTOM, meaning the content for the left eye occupies the
     * top half of the frame, and the content for the right eye occupies the bottom
     * half of the frame.
     *
     * @property
     * @memberof STEREOSCOPIC_LAYOUTS
     */
    LEFT_RIGHT: 'LEFT_RIGHT'
});
