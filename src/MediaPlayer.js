import m from 'mithril';
import classNames from 'classnames';
import MediaPlayerComponent from 'components/MediaPlayer';
import Storage from 'Storage';
import Events from 'Events';
import MediaFile from 'MediaFile';
import makeObservable from 'makeObservable';

import {
    DEFAULT_LOCALSTORAGE_BASE_KEY, PLAYBACK_SPEEDS, DEFAULT_VOLUME, DEFAULT_UPSCALE,
    DEFAULT_LOOP, DEFAULT_PLAYBACK_SPEED, DEFAULT_MUTED, STEREOSCOPIC_LAYOUTS, UPSCALE_MODES,
    IS_SAFARI, IS_IOS
} from 'consts';

class MediaPlayer {
    // Define all of the events here, because documentation.js and jsdoc are really weird and
    // if you define them anywhere else, they don't render as events of the MediaPlayer in the
    // docs. (documentation is great, but buggy and particular; it doesn't seem to
    // support half of the things JSDoc talks about...)

    // TODO documentation still associates the constructor below to be part of each
    // Event's definition. wtf?

    /**
     * `abort` event. Fires when the loading of the Media resource has been aborted by
     * the user agent.
     *
     * Binding to this event is the same as binding directly to the `abort` event
     * on an HTMLMediaElement object.
     *
     * @event abort
     * @type {Event}
     */
    /**
     * `canplay` event. Fires when the user agent has enough data downloaded to start playing
     * the media, but estimates that not enough data has been loaded to play the media up to
     * its end without having to buffer.
     *
     * Binding to this event is the same as binding directly to the `canplay` event
     * on an HTMLMediaElement object.
     *
     * @event canplay
     * @type {Event}
     */
    /**
     * `canplaythrough` event. Fires when the user agent estimates that it has enough data loaded
     * to play the media all the way through to its end without needing to buffer.
     *
     * Binding to this event is the same as binding directly to the `canplaythrough` event on
     * an HTMLMediaElement object.
     *
     * @event canplaythrough
     * @type {Event}
     */
    /**
     * `ended` event. Fires when playback stops because the end of the media has been reached.
     *
     * Binding to this event is the same as binding directly to the `ended` event on an
     * HTMLMediaElement object.
     *
     * @event ended
     * @type {Event}
     */
    /**
     * `error` event. Fires when a Media resource fails to load.
     *
     * Binding to this event is the same as binding directly to the `error` event
     * on an HTMLMediaElement object.
     *
     * @event error
     * @type {Event}
     */
    /**
     * `loadeddata` event. Fires when the first frame of the media resource has finished loading.
     *
     * Binding to this event is the same as binding directly to the `loadeddata` event
     * on an HTMLMediaElement object.
     *
     * @event loadeddata
     * @type {Event}
     */
    /**
     * `loadedmetadata` event. Fires when the Media resource's metadata has been loaded
     * (internal file metadata in the binary stream, not external system metadata).
     *
     * Binding to this event is the same as binding directly to the `loadedmetadata` event
     * on an HTMLMediaElement object.
     *
     * @event loadedmetadata
     * @type {Event}
     */
    /**
     * `loadend` event. Fires when progress has stopped loading on the Media resource. This
     * fires after a "error", "abort", or "load" events have been dispatched.
     *
     * Binding to this event is the same as binding directly to the `loadend` event
     * on an HTMLMediaElement object.
     *
     * @event loadend
     * @type {Event}
     */
    /**
     * `loadstart` event. Fires when progress has begun on loading the Media resource.
     *
     * Binding to this event is the same as binding directly to the `loadstart` event
     * on an HTMLMediaElement object.
     *
     * @event  loadstart
     * @type {Event}
     */
    /**
     * `pause` event. Fires when playback stops because it has been paused.
     *
     * Binding to this event is the same as binding directly to the `pause` event
     * on an HTMLMediaElement object.
     *
     * @event pause
     * @type {Event}
     */
    /**
     * `play` event. Fired when the playback has begun or resumed from pause.
     *
     * Binding to this event is the same as binding directly to the `play` event
     * on an HTMLMediaElement object.
     *
     * @event play
     * @type {Event}
     */
    /**
     * `playing` event. Fired when playback is ready to start after having been paused or
     * after having buffered.
     *
     * Binding to this event is the same as binding directly to the `playing` event on an
     * HTMLMediaElement object.
     *
     * @event playing
     * @type {Event}
     */
    /**
     * `progress` event. Fires to indicate the progress of loading the Media resource.
     *
     * Binding to this event is the same as binding directly to the `progress` event on an
     * HTMLMediaElement object.
     *
     * @event progress
     * @type {Event}
     */
    /**
     * `ratechange` event. Fires when the playbackSpeed has changed.
     *
     * Binding to this event is the same as binding directly to the `ratechange` event on an
     * HTMLMediaElement object.
     *
     * @event ratechange
     * @type {Event}
     */
    /**
     * `seeked` event. Fired when a seek operation has completed.
     *
     * Binding to this event is the same as binding directly to the `seeked` event on an
     * HTMLMediaElement object.
     *
     * @event seeked
     * @type {Event}
     */
    /**
     * `seeking` event. Fired when a seeking operation has begin.
     *
     * Binding to this event is the same as binding directly to the `seeking` event on an
     * HTMLMediaElement object.
     *
     * @event seeking
     * @type {Event}
     */
    /**
     * `stalled` event. Fired when the user agent is trying to fetch data, but the data is
     * not being received.
     *
     * Binding to this event is the same as binding directly to the `stalled` event on an
     * HTMLMediaElement object.
     *
     * @event stalled
     * @type {Event}
     */
    /**
     * `suspend` event. Fired when loading the media resource has been suspended.
     *
     * Binding to this event is the same as binding directly to the `suspend` event on an
     * HTMLMediaElement object.
     *
     * @event suspend
     * @type {Event}
     */
    /**
     * `timeupdate` event. Fired to indicate that the currentTime of playback has changed.
     *
     * User agents vary their frequency of this event depending on system load. The average
     * frequency of this event being emitted could be between 4 and 70 times per second.
     * If you are listening to this event and triggering a UI redraw or any kind of heavy
     * update in direct response to your event handler for this event, it is *highly*
     * recommended you throttle or debounce your redraws.
     *
     * Better yet, just throttle *every* callback you bind to this event. You've been warned.
     *
     * Binding to this event is the same as binding directly to the `timeupdate` event on an
     * HTMLMediaElement object.
     *
     * @event timeupdate
     * @type {Event}
     */
    /**
     * `volumechange` event. Fired when the volume has been changed or when the `muted`
     * property has changed.
     *
     * Binding to this event is the same as binding directly to the `volumechange` event on an
     * HTMLMediaElement object.
     *
     * @event volumechange
     * @type {Event}
     */
    /**
     * `waiting` event. Fired when playback has stopped due to a temporary lack of data.
     *
     * Binding to this event is the same as binding directly to the `waiting` event on an
     * HTMLMediaElement object.
     *
     * @event waiting
     * @type {Event}
     */

    /**
        Constructs a new MediaPlayer, which is a web component for viewing media assets
        in a Web Browser.

        @name MediaPlayer
        @class MediaPlayer
        @param {HTMLElement} container An HTMLElement DOM node that will be the
            MediaPlayer instance's main view element. The MediaPlayer uses this
            element to determine it's maximum allowed size.

        @param {?Object} settings A hash of config values to initialize the MediaPlayer with.
        @param {boolean} settings.autoplay Start playing the MediaFile automatically after
               it loads.
        @param {MediaFile} settings.file A MediaFile to load immediately after initializing
        @param {boolean} settings.keyboardShortcutsEnabled A flag to enable or disable this MediaPlayer's
               keyboard shortcut bindings.
        @param {boolean} settings.localStorageEnabled A flag to enable or disable this MediaPlayer
               reading from and writing to browser localStorage.
        @param {string} settings.localStorageKey The key that this MediaPlayer instance will use
               to read from and write to localStorage, if it is enabled.
        @param {boolean} settings.loop When the Media stream has reached the end, automatically start
               playing the media from the beginning.
        @param {number} settings.playbackSpeed  TODO
        @param {number} settings.volume  TODO

        @throws {TypeError} If the `container` parameter is not supplied or is not
            an instance of an HTMLElement
        @returns {MediaPlayer} The newly instantiated MediaPlayer object
        @example
            var container = document.querySelector('#your-container');
            var mediaPlayer = new MediaPlayer(container);

            // or, with a settings object
            // TODO: make the indentation not suck when documentation renders it
            var mediaPlayer = new MediaPlayer(container, {
                autoplay: true,
                volume: 0.5,
                localStorageEnabled: false,
                file: new MediaFile({
                    extension: 'mp4',
                    mimeType: 'video/mp4',
                    url: 'http://example.com/clip.mp4'
                })
            });
     */
    constructor(container, settings = {}) {
        /**
         * Get or set a boolean indicating whether or not to enable the MediaPlayer's default
         * keyboard shortcuts.
         *
         * Set this to false if you wish to define your own keyboard shortcuts
         * external to the MediaPlayer.
         *
         * @property {boolean} [keyboardShortcutsEnabled=true]
         * @default true
         */
        this.keyboardShortcutsEnabled = typeof settings.keyboardShortcutsEnabled === 'boolean' ?
            settings.keyboardShortcutsEnabled : true;

        /**
         * Get or sets a boolean indicating whether or not the MediaPlayer should read and save
         * certain properties in LocalStorage so that they will be remembered the next time
         * a MediaPlayer instance is created.
         *
         * See the {@link localStorageKey} property to set the base key this MediaPlayer instance
         * will use to save/read localstorage information.
         *
         * NOTE: If localStorage is not availabe in the browser and this property is `true`, all
         * attempts by the MediaPlayer to read and write to localStorage will fail silently.
         *
         * @property {boolean} localStorageEnabled
         * @default true
         */
        this.localStorageEnabled = typeof settings.localStorageEnabled === 'boolean' ?
            settings.localStorageEnabled : true;

        if (!Storage.isAvailable) {
            this.localStorageEnabled = false;

            console.warn('MediaPlayer: `localStorage` not detected in this environment. Disabling.');
        }

        /**
         * Get or set the key that the MediaPlayer will use as an index in localStorage. See
         * {@link localStorageEnabled} for more information.
         *
         * @property {string} localStorageKey
         * @default 'media-player'
         */
        this.localStorageKey = settings.localStorageKey || DEFAULT_LOCALSTORAGE_BASE_KEY;
        const _storage = new Storage();
        _storage.setBaseKey(this.localStorageKey);

        /**
         * A read-only boolean indicating whether or not the environment supports programmatically
         * entering and exiting fullscreen mode. If this property is false, the UI fullscreen button
         * will not be visible and any attempt to change this instances `fullscreen` property will
         * throw an Error
         *
         * @name isFullscreenEnabled
         * @type boolean
         * @memberof MediaPlayer
         * @property
         * @instance
         * @readonly
         */
        const _isFullscreenEnabled = Boolean(
            document.body.requestFullScreen ||
            document.body.webkitRequestFullScreen ||
            document.body.mozRequestFullScreen
        );
        Object.defineProperty(this, 'isFullscreenEnabled', {
            enumerable: true,
            get: function () { return _isFullscreenEnabled; }
        });

        /**
         * A read-only boolean indicating whether or not the environment supports programatically
         * changing the volume of a MediaElement (iOS does not currently support this). If this property
         * is false, the UI will not show the volume slider (you can still toggle mute) and setting
         * the `volume` property on this instance will fail silently.
         *
         * @name isVolumeControllable
         * @type boolean
         * @memberof MediaPlayer
         * @property
         * @instance
         * @readonly
         */
        const _isVolumeControllable = (function () {
            const tmp = document.createElement('video');

            tmp.volume = 0.5;

            return tmp.volume !== 1;
        })();
        Object.defineProperty(this, 'isVolumeControllable', {
            enumerable: true,
            get: function () { return _isVolumeControllable; }
        });

        /**
         * Get or set a boolean indicating whether to start playing the media file automatically
         * and without user intervention as soon as enough has been progressivly
         * downloaded to do so.
         *
         * Note that some devices and user agents block this functionality, effectively stripping
         * this property of all purpose, all meaning, and all motivation. Autoplay is rejected
         * and ignored in these user agents, and quickly succumbs to a life of crippling depression and
         * alcoholism.
         *
         * @name autoplay
         * @type boolean
         * @memberof MediaPlayer
         * @property
         * @instance
         */
        let _autoplay = Boolean(settings.autoplay);
        Object.defineProperty(this, 'autoplay', {
            enumerable: true,
            get: function () { return _autoplay; },
            set: function (value) {
                _autoplay = Boolean(value);

                if (this._component) {
                    this._component.state.autoplay = _autoplay;
                }
            }
        });

        /**
         * Get or set the MediaPlayer's HTMLElement container.
         *
         * Setting this property will cause the MediaPlayer to destroy itself and reinitialize
         * itself with the new container.
         *
         * @name container
         * @type HTMLElement
         * @memberof MediaPlayer
         * @property
         * @instance
         */
        let _container;
        Object.defineProperty(this, 'container', {
            enumerable: true,
            get: function () { return _container; },
            set: function (value) {
                if (!(value instanceof HTMLElement)) {
                    throw new TypeError('MediaPlayer `container` must be an HTMLElement');
                }

                this.destroy();

                _container = value;

                if (this.file) {
                    this._load();
                }
            }
        });

        /**
         * Get the height, in pixels, of the MediaPlayer's container HTMLElement.
         *
         * @name containerHeight
         * @type number
         * @memberof MediaPlayer
         * @property
         * @instance
         * @readonly
         */


        Object.defineProperty(this, 'containerHeight', {
            get: function () {
                const styles = window.getComputedStyle(_container);

                return Math.floor(parseInt(styles.height, 10) - parseInt(styles.paddingTop, 10) - parseInt(styles.paddingBottom, 10));
            },
            writeable: false,
            enumerable: true
        });

        /**
         * Get the width, in pixels of the actual player inside the container.
         *
         * @name containerWidth
         * @type number
         * @memberof MediaPlayer
         * @property
         * @instance
         * @readonly
         */
        Object.defineProperty(this, 'containerWidth', {
            get: function () {
                const styles = window.getComputedStyle(_container);

                return Math.floor(parseInt(styles.width, 10) - parseInt(styles.paddingLeft, 10) - parseInt(styles.paddingRight, 10));
            },
            writeable: false,
            enumerable: true
        });

        /**
         * Gets the current time, in seconds, of playback. Returns `0` if no MediaFile is loaded.
         *
         * @name currentTime
         * @type number
         * @memberof MediaPlayer
         * @readonly
         * @property
         * @instance
         */
        Object.defineProperty(this, 'currentTime', {
            enumerable: true,
            get: function () {
                if (this._component && this._component.state.mediaElement) {
                    // TODO: this needs to come from VideoFrame when SMPTE formats work again
                    return this._component.state.mediaElement.currentTime;
                }

                return 0;
            }
        });

        /**
         * Get the duration of the loaded MediaFile. If the MediaFile specifies its duration,
         * this will be the MediaFile's `duration` value. If the MediaFile does not know its duration,
         * this will be the duration as determined by the underlying MediaElement
         *
         * @name duration
         * @type Number
         * @memberof MediaPlayer
         * @property
         * @instance
         */
        Object.defineProperty(this, 'duration', {
            enumerable: true,
            get: function () {
                const duration = this.file && this.file.duration;

                if (duration < 0 && this._component && this._component.state.mediaElement) {
                    return this._component.state.mediaElement.duration;
                }

                return this.file.duration;
            }
        });

        /**
         * Get or set the MediaFile for the MediaPlayer to play.
         *
         * Setting this property will cause the MediaPlayer to unload the current MediaFile
         * (and Viewer, if necessary) and load the newly set MediaFile.
         *
         * @name file
         * @type MediaFile
         * @memberof MediaPlayer
         * @property
         * @instance
         */
        let _file;
        Object.defineProperty(this, 'file', {
            enumerable: true,
            get: function () { return _file; },
            set: function (value) {
                if (!(value instanceof MediaFile)) {
                    throw new TypeError('MediaPlayer.file property must be an instance of MediaFile');
                }

                if (value !== _file) {
                    _file = value;

                    this._load();
                }
            }
        });

        /**
         * Gets or sets a boolean indicating whether or not this MediaPlayer *thinks* it's
         * in fullscreen mode.
         *
         * Emphasis *thinks*, because cross-browser support for the Fullscreen API is spotty.
         * Currently, in some browsers and under some conditions, the MediaPlayer will think
         * it is in fullscreen mode when in actuality it isn't.
         *
         * Would you kindly submit a bug report if you find reproducable oddities with this property?
         *
         * @name fullscreen
         * @type MediaFile
         * @memberof MediaPlayer
         * @property
         * @instance
         * @default false
         */
        Object.defineProperty(this, 'fullscreen', {
            enumerable: true,
            get: function () { return Boolean(this._component && this._component.state && this._component.state.isFullscreen); },
            set: function (value) {
                value = Boolean(value);

                if (!this.isFullscreenEnabled) {
                    throw new Error('fullscreen is not supported in this environment.');
                }

                if (this._component && this._component.state.isFullscreen !== value) {
                    this._component.state.toggleFullscreen(this._component);
                }
            }
        });

        /**
         * Gets the height of the actual player element inside the MediaPlayer's container
         *
         * @name height
         * @type number
         * @memberof MediaPlayer
         * @property
         * @instance
         * @readonly
         */
        Object.defineProperty(this, 'height', {
            enumerable: true,
            get: function () { return (this._component && this._component.state.playerHeight) || 0; }
        });

        /**
         * Get or sets a boolean indicating whether or not the Media should automatically
         * start playing the Media from the beginning in response to an "ended" event.
         *
         * @name loop
         * @type boolean
         * @memberof MediaPlayer
         * @property
         * @instance
         * @default false
         */
        // order of preference: settings.loop > localstorage > default=false
        let _loop = DEFAULT_LOOP;
        Object.defineProperty(this, 'loop', {
            enumerable: true,
            get: function () { return _loop; },
            set: function (value) {
                _loop = Boolean(value);
                _storage.set('loop', _loop);

                if (this._component) {
                    this._component.state.loop = _loop;
                    this._component.state.redraw();
                }
            }
        });

        if (typeof settings.loop === 'boolean') {
            _loop = settings.loop;
        } else if (this.localStorageEnabled) {
            _loop = Boolean(_storage.get('loop'));
        }

        /**
         * Get or sets a boolean indicating whether or not the audio is muted. Note that
         * the `muted` is not tied to the `volume` property.
         *
         * @name muted
         * @type boolean
         * @memberof MediaPlayer
         * @property
         * @instance
         * @default false
         */
        let _muted = DEFAULT_MUTED;
        Object.defineProperty(this, 'muted', {
            enumerable: true,
            get: function () { return _muted; },
            set: function (value) {
                _muted = Boolean(value);
                _storage.set('muted', _muted);

                if (this._component) {
                    this._component.state.isMuted = _muted;
                    this._component.state.redraw();
                }
            }
        });

        if (typeof settings.muted === 'boolean') {
            _muted = settings.muted;
        } else if (this.localStorageEnabled) {
            _muted = Boolean(_storage.get('muted'));
        }

        /**
         * Get or set the MediaPlayer's playback speed.
         *
         * Can only be set to the following values: 0.5, 1, 1.25, and 1.5.
         * Default value is 1
         *
         * @name playbackSpeed
         * @type number
         * @memberof MediaPlayer
         * @property
         * @instance
         */
        let _speed = DEFAULT_PLAYBACK_SPEED;
        Object.defineProperty(this, 'playbackSpeed', {
            enumerable: true,
            get: function () { return _speed; },
            set: function (value) {
                value = Number(value);

                if (PLAYBACK_SPEEDS.indexOf(value) === -1) {
                    throw new TypeError(
                        'MediaPlayer `playbackSpeed` property can only be ' + Object.values(PLAYBACK_SPEEDS).toString()
                    );
                }

                _speed = value;
                _storage.set('playbackSpeed', _speed);

                if (this._component) {
                    this._component.state.playbackSpeed = _speed;
                    this._component.state.redraw();
                }
            }
        });

        if (settings.playbackSpeed) {
            try {
                this.playbackSpeed = settings.playbackSpeed;
            } catch (e) {
                console.warn(e.message);
            }
        } else if (this.localStorageEnabled) {
            try {
                this.playbackSpeed = _storage.get('playbackSpeed');
            } catch (e) {}
        }

        /**
         * Get or set the MediaPlayer's rules for upscaling video.
         *
         * @name upscale
         * @type string
         * @memberof MediaPlayer
         * @property
         * @instance
         */
        let _upscale = DEFAULT_UPSCALE;
        Object.defineProperty(this, 'upscale', {
            enumerable: true,
            get: function () { return _upscale; },
            set: function (value) {
                if (Object.values(UPSCALE_MODES).indexOf(value) === -1) {
                    throw new TypeError('MediaPlayer: supplied invalid value to `upscale`');
                } else if (value === _upscale) {
                    return;
                }

                _upscale = value;

                if (this._component) {
                    this._component.state.upscale = _upscale;
                    this._component.state.redraw();
                }
            }
        });

        if (settings.upscale) {
            try {
                this.upscale = settings.upscale;
            } catch (e) {
                console.warn(e.message);
            }
        }

        /**
         * Get or set the MediaPlayer's volume.
         *
         * Any set value will be clamped to not be greater than 1 or less than 0.
         *
         * @name volume
         * @type number
         * @memberof MediaPlayer
         * @property
         * @instance
         */
        let _volume = DEFAULT_VOLUME;
        Object.defineProperty(this, 'volume', {
            enumerable: true,
            get: function () { return _volume; },
            set: function (value) {
                if (typeof value !== 'number') {
                    throw new TypeError('MediaPlayer `volume` property must be a number');
                } else if (Number.isNaN(value)) {
                    console.warn('MediaPlayer `volume` property was asked to assign `NaN`');

                    return;
                }

                if (value > 1) {
                    value = 1;
                } else if (value < 0) {
                    value = 0;
                }

                _volume = value;

                if (this._component) {
                    this._component.state.volume = _volume;
                    this._component.state.redraw();
                }

                _storage.set('volume', _volume);
            }
        });

        if (settings.volume) {
            try {
                this.volume = settings.volume;
            } catch (e) {
                console.warn(e.message);
            }
        } else if (this.localStorageEnabled) {
            try {
                this.volume = _storage.get('volume');
            } catch (e) {}
        }

        /**
         * Get the width, in pixels, of the MediaPlayer's container HTMLElement.
         *
         * @name width
         * @type number
         * @memberof MediaPlayer
         * @property
         * @instance
         * @readonly
         */
        Object.defineProperty(this, 'width', {
            enumerable: true,
            get: function () { return (this._component && this._component.state.playerWidth) || 0; }
        });

        // inject the `on`, `off`, and `_notify` functions for event handling
        makeObservable(this);

        /**
         * Reference to the MediaPlayerComponent, which is responsible for managing
         * the state of the MediaPlayer and the MediaFile.
         *
         * @private
         * @property {MediaPlayerComponent} _component
         */
        this._component = null;
        this.container = container;

        if (settings.file) {
            this.file = settings.file;
        }
    }

    /**
     * Decrease the playback speed to the next allowed multiplier. Has no effect
     * if playback speed is already at the minimum allowed speed.
     */
    decreaseSpeed() {
        const newSpeed = PLAYBACK_SPEEDS[PLAYBACK_SPEEDS.indexOf(this.playbackSpeed) - 1];

        if (newSpeed) {
            this.playbackSpeed = newSpeed;
        }
    }

    /**
        Destroys a MediaPlayer instance.

        Invoking `destroy` will *not* destroy the HTMLElement object referenced by the
        `container` property, but it will destroy all of the container's child elements.
    */
    destroy() {
        if (this.container) {
            m.mount(this.container, null);
        }
    }

    /**
     * Increase the playback speed to the next allowed multiplier. Has no effect
     * if playback speed is already at the maximum allowed speed.
     */
    increaseSpeed() {
        const newSpeed = PLAYBACK_SPEEDS[PLAYBACK_SPEEDS.indexOf(this.playbackSpeed) + 1];

        if (newSpeed) {
            this.playbackSpeed = newSpeed;
        }
    }

    /**
     * Tells the MediaPlayer to pause playback. Has no effect if the MediaPlayer
     * is paused.
     */
    pause() {
        const cmpnt = this._component;

        if (cmpnt && !cmpnt.state.isPaused) {
            cmpnt.state.play();
        }
    }

    /**
     * Tells the MediaPlayer to play the file, starting from the beginning if the
     * file has not yet been played. If the player is paused, playback will resume
     * from the pause point. If playback has ended, it will restart from the beginning.
     *
     * Calling `play` while the MediaPlayer is already playing has no effect.
     *
     * @fires play
     */
    play() {
        const cmpnt = this._component;

        if (cmpnt && !cmpnt.state.isPlaying) {
            cmpnt.state.play();
        }
    }

    /**
     * Seek/jump to the specified time. See {@link seek}.
     *
     * If the given time is greater than the file's playback duration, the
     * player will seek to the end of the file.
     *
     * Does not change the playback state, i.e. if the MediaPlayer is playing,
     * it will seek to the specified time and resume playing from that time. If the
     * player is paused, it will seek to the specified time and remain paused.
     *
     * @param {number} time The playback time, in seconds, to seek to.
     */
    // TODO: make sure VideoFrame is behaving correctly before exposing via documentation
    // the interface for seeking by number of frames
    /* <-- intentional missing * because I don't want this showing up in the docs just yet!
     * Seek/jump to the specified time. See {@link seek}
     *
     * If the given time is greater than the file's playback duration, the
     * player will seek to the end of the file.
     *
     * Does not change the playback state, i.e. if the MediaPlayer is playing,
     * it will seek to the specified time and resume playing from that time. If the
     * player is paused, it will seek to the specified time and remain paused.
     *
     * @param {Object} time A key/value pair that describes the time to seek to.
     *        A valid config object is a JavaScript Object that contains *one and
     *        only one* of the parameters listed in the table below:
     * @param {number} time.seconds The playback time to seek to, in seconds
     * @param {number} time.frames The frame to seek to (only works if the MediaFile
     *        being displayed has a valid `fps` property).
     */
    seekTo(time) {
        const cmpnt = this._component;

        if (typeof time !== 'number' || Number.isNaN(time)) {
            throw new TypeError('MediaPlayer `seekTo` expects a `time` argument');
        }

        if (cmpnt) {
            cmpnt.state.seek(Math.min(cmpnt.state.duration, Math.max(0, time)));
        }
    }

    /**
     * Seek/jump forwards or backwards by the specified relative time. See {@link seekTo}.
     *
     * If the relative time given will cause the file to seek past its duration, it will
     * seek to the end of the file. If the relative time given causes the file to seek before
     * its beginning, it will seek to the beginning of the file.
     *
     * Seeking does not change playback state.
     *
     * @param {number} time The relative time, in seconds, to seek by. Postive numbers seek
     *        forwards in time, negative numbers seek backwards in time.
     */
    // TODO: make sure VideoFrame is behaving correctly before exposing via documentation
    // the interface for seeking by number of frames
    /* <-- intentional missing * because I don't want this showing up in the docs just yet!
     * Seek/jump forwards or backwards by the specified relative time. See {@link seekTo}.
     *
     * If the relative time given will cause the file to seek past its duration, it will
     * seek to the end of the file. If the relative time given causes the file to seek
     * before its beginning, it will seek to the beginning of the file.
     *
     * Seeking does not change playback state.
     *
     * @param {Object} time A key/value pair that describes the relative time to seek by.
     *        A valid config object is a JavaScript object that contains *one and only
     *        one of the parameters listed in the table below:
     * @param {number} time.seconds The relative time to seek to, in seconds
     * @param {number} time.frames The relative number of frames to seek to (only works
     *        if the MediaFile being displayed has a valid `fps` property
     */
    seek(time) {
        const cmpnt = this._component;

        if (typeof time !== 'number' || Number.isNaN(time)) {
            throw new TypeError('MediaPlayer `seek` expects a `time` argument');
        }

        if (cmpnt) {
            if (time > 0) {
                this.seekTo(Math.min(this.currentTime + time, cmpnt.state.duration));
            } else {
                this.seekTo(Math.max(0, this.currentTime + time));
            }
        }
    }

    /**
     * Stops playback. Equivalent to pausing playback and seeking back
     * to the beginning. Has no effect if playback is already stopped.
     */
    stop() {
        this.pause();
        this.seekTo(0);
    }

    /**
        Load and initialize the viewer for the MediaFile referenced by `file`.
        This method is called automatically whenever the value of the `file` property
        changes.

        @private
        @param {MediaFile} file The MediaFile to load
        @returns {undefined} Returns `undefined`
    */
    _load() {
        if (!this.file) {
            throw new Error('MediaPlayer: called `_load` with no `file`');
        }

        const instance = this;
        const file = this.file;
        const type = file.mimeType.split('/')[0];
        const options = {
            file,
            upscale: this.upscale,
            poster: this.file.poster,
            autoplay: this.autoplay,
            loop: this.loop,
            volume: this.volume,
            playbackSpeed: this.playbackSpeed,
            isMuted: this.muted,
            keyboardShortcutsEnabled: this.keyboardShortcutsEnabled,

            // omfg this is a terrible hack. it's temporary... i swear!
            instance: this,

            // hack to give the internal component a handler to invoke for all media events,
            // which will forward them to all listeners bound through the `on` interface.
            _nativeEventForwarder: function _eventForwarder(e) { this._notify(e.type, e); }.bind(this)
        };

        function _mount(viewer) {
            m.mount(instance.container, {
                // adding lifecycle methods to hack my way around fullscreen state sync
                // TODO: Fullscreen is misbehaving in a way that seems to make the 'is-fullscreen' class
                // irrelevant at this point, which also makes these lifecycle methods irrelevant.
                oncreate(/* vnode */) {
                    this.isFullscreen = false;
                },

                onupdate(/* vnode */) {
                    this.isFullscreen = instance.fullscreen;
                },

                view() {
                    const player = m(MediaPlayerComponent, {
                        type,
                        ...options,
                        viewer: viewer.default
                    });

                    // TODO: hack to set _component property so the MediaPlayer instance can
                    // control the underlying components via a public interface.
                    // Clean up internals later.
                    instance._component = player;

                    return m('div', {
                        class: classNames('grauman-container', 'grauman-media-player', { 'is-fullscreen': this.isFullscreen })
                    }, player);
                }
            });
        }

        // eslint-disable-next-line camelcase, no-undef
        __webpack_public_path__ = MediaPlayer._publicPath;

        if (file.extension === 'm3u8') {
            if (IS_SAFARI || IS_IOS) {
                require.ensure([], function (require) { _mount(require('components/viewers/Video')); });
            } else {
                require.ensure([], function (require) { _mount(require('components/viewers/HLS')); });
            }
        } else if (file.is360) {
            require.ensure([], function (require) {
                if (file.stereoscopicLayout !== STEREOSCOPIC_LAYOUTS.NONE) {
                    _mount(require('components/viewers/VR'));
                } else {
                    _mount(require('components/viewers/ThreeSixty'));
                }
            });
        } else if (type === 'video') {
            require.ensure([], function (require) { _mount(require('components/viewers/Video')); });
        } else if (type === 'audio') {
            require.ensure([], function (require) { _mount(require('components/viewers/Audio')); });
        } else {
            throw new Error('MediaPlayer: does not have a viewer for file ' + file.mimeType);
        }
    }
}

/**
 * Set's the URL path to the MediaPlayer's other build chunks.
 *
 * Since MediaPlayer uses Webpack's code splitting feature, which caches the chunks after
 * they are dynamically requested, it is highly recommended that you not modify this
 * property after the first MediaPlayer instance is created.
 *
 * Furthermore, since many aspects of JavaScript are subject to CORS restrictions,
 * it is highly recommended that you keep the chunks located on the same origin
 * as the main media-player index file.
 *
 * See {@link #code-splitting} for more information.
 *
 * @name publicPath
 * @memberof MediaPlayer
 * @static
 */
MediaPlayer.EVENTS = Events;

export default MediaPlayer;
