import m from 'mithril';
import debounce from 'lodash.debounce';
import throttle from 'lodash.throttle';
import Polyfills from 'Polyfills';
import classnames from 'classnames';
import { IS_IOS, IS_MOBILE, KEY_CODES, DEFAULT_TIME_FORMAT, UPSCALE_MODES, FULLSCREEN_EVENT_NAME, TIME_FORMATS } from 'consts';
import TimeFormatter from 'TimeFormatter';
import VideoFrame from 'VideoFrame';
import BufferingAlert from 'components/alerts/Buffering';
import PlayPauseAlert from 'components/alerts/PlayPause';
import PlayAlert from 'components/alerts/Play';
import MediaControls from 'components/MediaControls';
import ResizeSensor from 'css-element-queries/src/ResizeSensor';
import './MediaPlayer.scss';

const MediaPlayerComponent = {
    mediaElement: null,
    needsUserTrigger: false,

    isFullscreen: false,
    isMobile: IS_MOBILE,

    isLoading: false,
    isPlaying: false,
    isError: false,
    isPaused: false,
    isEnded: false,
    isDestroyed: false,

    showPosterImage: false, // TODO: move to independent viewers
    isHidingControls: false,
    isViewerLockingControls: false,
    isHoveringOverControls: false,
    isSeekingLocked: false, // TODO: move to Scrubber component, property managed by MediaControls instance in viewer
    autohideControls: true,
    duration: 0,
    currentTime: 0,
    loadedRanges: [],
    showNotification: false, // TODO: move to independent viewers
    notificationType: null, // TODO: move witwh showNotification
    _resizeSensor: null, // TODO: move resizeSensor logic into class mixin

    _attachResizeSensor() {
        if (!this._resizeSensor) {
            this._resizeSensor = new ResizeSensor(this._instance.container, () => {
                this.resize();
                this.redraw();
            });
        }
    },

    _detachResizeSensor() {
        if (this._resizeSensor) {
            this._resizeSensor.detach();
            this._resizeSensor = null;
        }
    },

    oncreate(/* vnode */) {
        this._attachResizeSensor();
        document.addEventListener(FULLSCREEN_EVENT_NAME, this._fullscreenchange);
        this.resize();
    },

    onremove(/* vnode */) {
        this._detachResizeSensor();
        this.videoFrame.stopListen();

        this.isDestroyed = true;

        document.removeEventListener(FULLSCREEN_EVENT_NAME, this._fullscreenchange);
    },

    oninit(vnode) {
        // hack on the event forwarder
        this._nativeEventForwarder = typeof vnode.attrs._nativeEventForwarder === 'function' ?
            vnode.attrs._nativeEventForwarder : function () {};
        this._throttledUpdateBufferedProgress = throttle(this._updateBufferedProgress.bind(this), 50);

        this.resize = this.resize.bind(this, vnode);
        this.hideControlsLater = debounce(this.hideControls.bind(this), 3000);
        this._fullscreenchange = this._fullscreenchange.bind(this, vnode);

        this.file = vnode.attrs.file;
        this.upscale = vnode.attrs.upscale;
        this.poster = vnode.attrs.poster;
        this.autoplay = vnode.attrs.autoplay;
        this.debug = vnode.attrs.debug || false;
        this.loop = vnode.attrs.loop;
        this.isMuted = vnode.attrs.isMuted;
        this.playbackSpeed = vnode.attrs.playbackSpeed;
        this.volume = vnode.attrs.volume;
        this.timeFormat = DEFAULT_TIME_FORMAT;
        this.needsUserTrigger = this.isMobile;
        this.showPosterImage = this.file.poster && (this.needsUserTrigger || !this.autoplay);

        // override the user trigger flag if on iOS. For some reason,
        // autoplay works on iOS with an m3u8 file
        if (IS_IOS && this.file.extension === 'm3u8') {
            this.needsUserTrigger = false;
        }

        if (vnode.attrs.type === 'audio' || !this.file.fps || this.timeFormat === TIME_FORMATS.TIME) {
            this.elapsedTime = TimeFormatter.toTime(this.currentTime);
            this.totalTime = TimeFormatter.toTime(this.duration);
        } else {
            this.elapsedTime = TimeFormatter.toSMPTE(this.currentTime, this.file.fps);
            this.totalTime = TimeFormatter.toSMPTE(this.duration, this.file.fps);
        }

        // tack on the main MediaPlayer instance (not the MediaPlayerComponent instance that is `this`)
        // so that the updates happen through its ES5 property bindings.
        //
        // The responsibilities of this Component are in flux, so this is a temporary conduit
        // to make sure the public interface of the MediaPlayer instance can remain consistent
        // while the internals fluctuate between minor versions.
        //
        // This is a hacky and weird mid-major-refactoring patch.
        this._instance = vnode.attrs.instance;

        this._playerEvents = {
            onended: this._onMediaEnded.bind(this, vnode.attrs),
            onerror: this._onMediaError.bind(this, vnode.attrs),
            onloadedmetadata: this._onMediaLoadedMetadata.bind(this, vnode.attrs),
            onloadstart: this._onMediaLoadStart.bind(this, vnode.attrs),
            onpause: this._onMediaPause.bind(this, vnode.attrs),
            oncanplaythrough: this._onCanPlayThrough.bind(this, vnode.attrs),
            onplaying: this._onMediaPlaying.bind(this, vnode.attrs),
            onprogress: this._onMediaProgress.bind(this, vnode.attrs),
            onseeked: this._onMediaSeeked.bind(this, vnode.attrs),
            ontimeupdate: this._onMediaTimeUpdate.bind(this, vnode.attrs),
            onwaiting: this._onMediaWaiting.bind(this, vnode.attrs)
        };

        this.resize();
    },

    onupdate(vnode) {
        const { file, type } = vnode.attrs;

        if (type === 'audio' || !file.fps || this.timeFormat === TIME_FORMATS.TIME) {
            this.elapsedTime = TimeFormatter.toTime(this.currentTime);
            this.totalTime = TimeFormatter.toTime(this.duration);
        } else {
            this.elapsedTime = TimeFormatter.toSMPTE(this.currentTime, file.fps);
            this.totalTime = TimeFormatter.toSMPTE(this.duration, file.fps);
        }

        this.resize();
    },

    _fullscreenchange(vnode) {
        const element = document.fullscreenElement ||
            document.webkitCurrentFullScreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement;

        this.isFullscreen = (element && vnode.dom.contains(element)) || false;
        this.redraw();
    },

    play(notify) {
        this.needsUserTrigger = false;
        this.showPosterImage = false;
        const media = this.mediaElement;

        if (this.isError) {
            media.load();
        } else if (this.isEnded) {
            this.currentTime = 0;
            media.currentTime = 0;
            media.play();
            notify && this.notify('play');
        } else if (this.isPaused) {
            media.play();
            notify && this.notify('play');
        } else {
            media.pause();
            notify && this.notify('pause');
        }
    },

    calculatePlayerSize() {
        let { height, width } = this.file;

        // use the MediaFile's height and width values, unless the MediaFile is 360 or Audio.
        if (this.file.mimeType.toLowerCase().split('/')[0] === 'audio') {
            if (this.file.waveform) {
                if (this.file.channels >= 2) {
                    // if there is more than one channel
                    height = 720;
                    width = 1280;
                } else {
                    // if there is only one channel
                    height = 360;
                    width = 1280;
                }
            } else {
                // Audio view if it has no waveform
                width = 720;
                height = 32;
            }
        } else if (this.file.is360) {
            // if it's 360, make the viewer be 1080p
            height = 1080;
            width = 1920;
        }

        let maxWidth, maxHeight;

        if (this.isFullscreen) {
            maxWidth = window.innerWidth;
            maxHeight = window.innerHeight;
        } else {
            // THIS IS NOT A TYPO.
            // there is intentionally the exact same maxWidth assignment one after another because
            // for some reason, in IE, the containerWidth can come back as incorrect, probably
            // due to a bug in the native `getComputedStyles` and IE's implementation of flexbox.
            // Once it comes back as incorrect, it clears immediately (the getComputedStyle call probably
            // causes something internally to reset, so if you make the exact same calculation again, it's correct.
            // This is complete voodoo. I have no idea why IE behaves this way
            maxWidth = this._instance.containerWidth;
            maxWidth = this._instance.containerWidth;

            maxHeight = this._instance.containerHeight;
        }

        const upscale = this.upscale === UPSCALE_MODES.ALWAYS || (this.upscale === UPSCALE_MODES.FULLSCREEN_ONLY && this.isFullscreen);

        let ratio = 0,
            widthModified = false,
            newHeight = height,
            newWidth = width;

        if (upscale || width > maxWidth) {
            widthModified = true;
            ratio = maxWidth / width;
            newWidth = maxWidth;
            newHeight = height * ratio;
            height = height * ratio;
            width = width * ratio;
        }

        if (upscale && !widthModified || height > maxHeight) {
            ratio = maxHeight / height;
            newHeight = maxHeight;
            newWidth = width * ratio;
        }

        this.playerWidth = Math.round(newWidth);
        this.playerHeight = Math.round(newHeight);
    },

    resize() {
        this.calculatePlayerSize();
    },

    seek(time) {
        const config = {};
        let seconds;

        if (typeof time === 'number') {
            seconds = time;
            config.seconds = seconds;
        } else if (time.seconds) {
            seconds = time.seconds;
            config.seconds = seconds;
        } else if (time.frame) {
            config.frame = time.frame;
            seconds = this.videoFrame.toMilliseconds(this.videoFrame.toSMPTE(time.frame)) / 1000;
        } else {
            throw new Error('Unsupported seek format given. Must be either a number or a valid VideoFrame.seekTo config object using `seconds` or `frame`s');
        }

        try {
            this.videoFrame.seekTo(config);
            this.currentTime = seconds;
        } catch (e) {
            console.warn("MediaPlayer cannot seek in it's current state");
        }
    },

    toggleFullscreen(vnode) {
        const container = vnode.dom;

        if (this.isFullscreen) {
            const exitFullscreen = document.exitFullscreen
                || document.mozCancelFullScreen
                || document.webkitExitFullscreen;

            exitFullscreen.apply(document);
        } else {
            const requestFullscreen = container.requestFullScreen
                || container.webkitRequestFullScreen
                || container.mozRequestFullScreen;
            requestFullscreen.apply(container);
        }
    },

    redraw() {
        m.redraw();
    },

    hideControls() {
        const canHideControls = this.autohideControls && !this.isViewerLockingControls && !this.isHoveringOverControls && this.isPlaying;

        if (!this.isDestroyed && canHideControls) {
            this.isHidingControls = true;
        }
    },

    notify(type) {
        this.notificationType = type;
        this.showNotification = true;
        setTimeout(() => {
            this.notificationType = null;
            this.showNotification = false;
            this.redraw();
        }, 600);
    },

    _initMediaElement(vnode) {
        this.mediaElement = vnode.dom;

        // for help with debugging html5 media events
        [
            'abort',
            'canplay',
            'canplaythrough',
            'ended',
            'error',
            'interruptbegin',
            'interruptend',
            'loadeddata',
            'loadedmetadata',
            'loadend',
            'loadstart',
            'pause',
            'play',
            'playing',
            'progress',
            'ratechange',
            'seeked',
            'seeking',
            'stalled',
            'suspended',
            'timeupdate',
            'volumechange',
            'waiting'
        ].forEach((name) => {
            // TODO: while this is hacky for now, we eventually want all native media
            // events to be captured and forwared to all the `on` listeners, some of
            // them we'll want to modify the event. Basically... find a less hacky
            // way to do this.
            this.mediaElement.addEventListener(name, (e) => {
                if (typeof this._nativeEventForwarder === 'function') {
                    this._nativeEventForwarder(e);
                }
            });
        });

        this.videoFrame = new VideoFrame({
            element: this.mediaElement,
            fps: this.file.fps,
            callback: () => {
                const currentTime = this.mediaElement.currentTime;

                if (!this.isDestroyed) {
                    this.currentTime = currentTime;
                    this.redraw();
                }

                // TODO: HAX!!!
                // When grauman is inside a React app, Mithril and React
                // disagree on when their rendering loops should run, and Mithril can be
                // left in a state where it does not know it has been destroyed, but
                // grauman's dom is not actually in the page body. This hack checks every frame
                // to see if this video is in the body. if it's not, reset the element properties
                // to prevent it playing while not attached to the dom.
                // This is a hack fix. The real issue needs to be addressed, because it probably
                // means there are inefficiencies and leaks in this code.
                if (!Polyfills.closest(this.mediaElement, 'body')) {
                    this.mediaElement.pause();
                    this.mediaElement.src = '';
                    this.videoFrame.stopListen();
                }
            }
        });

        this.videoFrame.listen('time');
    },

    _onCanPlayThrough(/* attrs, e */) {
        this.isLoading = false;

        if (this.isInitialLoad && !this.isMobile) {
            this.isPaused = true;
            this.isInitialLoad = false;

            if (this.autoplay) {
                this.play();
            }
        }
    },

    _onMediaWaiting(/* attrs, e */) {
        this.isLoading = true;
    },

    _onMediaSeeked(/* attrs, e */) {
        this.isEnded = false;
        this.isLoading = false;
    },

    _onMediaEnded(/* attrs, e */) {
        this.isEnded = true;
        this.isHidingControls = false;
    },

    _onMediaLoadStart(/* attrs, e */) {
        this.currentTime = 0;
        this.isInitialLoad = true;
        this.isLoading = true;
        this.isEnded = false;
        this.isError = false;
        this.isPlaying = false;
        this.isPaused = this.needsUserTrigger;
    },

    _onMediaError(/* attrs, e */) {
        if (this.isEnded) {
            this.mediaElement.load();
        } else {
            this.isLoading = false;
            this.isError = true;
            this.isPlaying = false;
            this.isPaused = true;
            this.isHidingControls = false;
        }
    },

    _onMediaPlaying(/* attrs, e */) {
        this.isPaused = false;
        this.isPlaying = true;
        this.isLoading = false;

        this.hideControlsLater();
    },

    _onMediaPause(/* attrs, e */) {
        this.isPlaying = false;
        this.isPaused = true;
        this.isHidingControls = false;
    },

    _updateBufferedProgress() {
        const buffered = this.mediaElement.buffered;

        this.loadedRanges = Array.from(buffered).map((_, i) => {
            return [buffered.start(i), buffered.end(i)];
        });
    },

    _onMediaProgress(/* attrs, e */) {
        this._throttledUpdateBufferedProgress();
    },

    _onMediaTimeUpdate(/* attrs, e */) {
        this.currentTime = this.mediaElement.currentTime;
        this._throttledUpdateBufferedProgress();
    },

    _onMediaLoadedMetadata(attrs, e) {
        if (this.isMobile && !this._instance.isVolumeControllable) {
            // iOS won't fire the canplaythrough event
            this.isLoading = false;
        }

        if (this.file.duration === -1) {
            this.duration = e.target.duration;
        } else {
            this.duration = this.file.duration;
        }
    },

    _onKeyDown(vnode, e) { // eslint-disable-line complexity
        if (!vnode.attrs.keyboardShortcutsEnabled) {
            return;
        }

        switch (e.keyCode) {
            case KEY_CODES.PERIOD:
                if (e.shiftKey) {
                    this._instance.increaseSpeed();
                } else {
                    this._instance.seek(5);
                }

                break;
            case KEY_CODES.COMMA:
                if (e.shiftKey) {
                    this._instance.decreaseSpeed();
                } else {
                    this._instance.seek(-5);
                }

                break;
            case KEY_CODES.F:
                this._instance.fullscreen = !this._instance.fullscreen;

                break;
            case KEY_CODES.L:
                this._instance.seek(10);

                break;
            case KEY_CODES.J:
                this._instance.seek(-10);

                break;
            case KEY_CODES.SPACE:
            case KEY_CODES.K:
                this.play(true);

                break;
            case KEY_CODES.M:
                this._instance.muted = !this._instance.muted;

                break;
            case KEY_CODES.LEFT_ARROW:
                this.seek({ frame: this.videoFrame.get() - 1 });

                break;
            case KEY_CODES.RIGHT_ARROW:
                this.seek({ frame: this.videoFrame.get() + 1 });

                break;
            case KEY_CODES.UP_ARROW:
                this._instance.volume += 0.05;

                break;
            case KEY_CODES.DOWN_ARROW:
                this._instance.volume -= 0.05;

                break;
            case KEY_CODES.HOME:
            case KEY_CODES.ZERO:
                this._instance.seekTo(0);

                break;
            case KEY_CODES.END:
                this._instance.seekTo(this.duration);

                break;
            case KEY_CODES.ONE:
            case KEY_CODES.TWO:
            case KEY_CODES.THREE:
            case KEY_CODES.FOUR:
            case KEY_CODES.FIVE:
            case KEY_CODES.SIX:
            case KEY_CODES.SEVEN:
            case KEY_CODES.EIGHT:
            case KEY_CODES.NINE: // eslint-disable-line no-case-declarations
                // seek to the percentage of duration based on key pressed
                // e.g. 100 second video, key '3' == 30%, seek to 30 seconds
                // e.g. 60 second video, key '5' == 50%, seek to 30 seconds
                this._instance.seekTo(this.duration * ((e.keyCode - (KEY_CODES.ONE - 1)) / 10));

                break;
            default:
                return;
        }

        e.preventDefault();
    },

    _onMouseEnter() {
        this.isHidingControls = false;
    },

    _onMouseLeave() {
        this.hideControls();
    },

    _onMouseMove() {
        if (this.isHidingControls) {
            this.isHidingControls = false;
        } else {
            this.hideControlsLater();
        }
    },

    _onTouchMove() {
        this.hideControlsLater();
    },

    _onTouchEnd() {
        this.hideControlsLater();
    },

    view(vnode) {
        let Alert = '',
            PosterImage = '',
            Buffering = '';

        if (this.isLoading) {
            Buffering = m(BufferingAlert);
        }

        if (this.showPosterImage) {
            PosterImage = m('div.poster-image', {
                style: { 'background-image': `url(${this.file.poster})` },
                onmousedown: (e) => {
                    this.play(true);
                    Polyfills.closest(vnode.dom, '.media-container').focus();
                    e.preventDefault();
                }
            });
        }

        // TODO: this if condition... jesus christ.
        if (this.needsUserTrigger || (this.file.mimeType.split('/')[0] !== 'audio' && !this.autoplay && this.currentTime === 0 && !this.isLoading && !this.isPlaying && !this.isError && !this.isEnded)) {
            Alert = m(PlayAlert, { onTogglePlay: () => { this.play(); } } );
        }

        // TODO: This has gotten out of hand. MediaControls need to be the responsibility of each viewer, and
        // this hyperscript template needs to be consolidated
        return m('div', {
            class: classnames('media-container', {
                'controls-hidden': this.isHidingControls,
                'show-poster': this.showPosterImage
            }),
            style: { width: `${this.playerWidth}px`, height: `${this.playerHeight}px` },
            tabindex: 1, // tab index allows the div to be "selectable" and capture key down event
            onkeydown: this._onKeyDown.bind(this, vnode),
            ontouchend: this._onTouchEnd.bind(this),
            ontouchmove: this._onTouchMove.bind(this),
            onmouseenter: this._onMouseEnter.bind(this),
            onmouseleave: this._onMouseLeave.bind(this),
            onmousemove: this._onMouseMove.bind(this)
        }, [
            m(vnode.attrs.viewer, {
                file: this.file,
                debug: this.debug,
                duration: this.duration,
                currentTime: this.currentTime,
                eventForwarder: this._nativeEventForwarder,

                // attributes that will be passed directly to the MediaElement node inside the viewer
                mediaAttrs: {
                    disableRemotePlayback: true,
                    loop: this.loop,
                    volume: this.volume,
                    width: this.playerWidth,
                    height: this.playerHeight,
                    playbackRate: this.playbackSpeed,
                    defaultPlaybackRate: this.playbackSpeed,
                    muted: this.isMuted,
                    src: this.file.url,
                    playsinline: true,
                    type: 'video/mp4',
                    crossorigin: 'anonymous',
                    oncreate: this._initMediaElement.bind(this),
                    onremove: (vnode) => {
                        vnode.dom.pause();
                        vnode.dom.src = '';
                    },
                    ...this._playerEvents
                },

                onSeek: (time) => { this._instance.seekTo(time); },
                onTogglePlay: () => { this.play(true); },
                onLockControls: (lock) => { this.isViewerLockingControls = lock; },
                onLockSeek: (lock) => { this.isSeekingLocked = lock; }
            }),
            PosterImage,
            Buffering,
            Alert,
            // TODO: Each viewer should be responsible for assembling/rendering its MediaControls, so this
            // declaration should get moved into the vnode.attrs.viewer component node
            m(MediaControls, {
                elapsedTime: this.elapsedTime,
                totalTime: this.totalTime,
                loop: this.loop,
                volume: this.volume,
                duration: this.duration,
                currentTime: this.currentTime,
                loadedRanges: this.loadedRanges,
                muted: this.isMuted,
                speed: this.playbackSpeed,
                type: vnode.attrs.type,
                fullscreen: this.isFullscreen,
                format: this.timeFormat,
                playing: this.isPlaying,
                loading: this.isLoading,
                stopped: (this.isError || this.isEnded),
                paused: this.isPaused,
                isVolumeControllable: this._instance.isVolumeControllable,
                isFullscreenEnabled: this._instance.isFullscreenEnabled,
                isSeekingLocked: this.isSeekingLocked,
                onLockControls: (lock) => { this.isHoveringOverControls = lock; },
                onTogglePlay: () => { this.play(); },
                onToggleFullscreen: () => { this.toggleFullscreen(vnode); },
                onToggleLoop: () => { this._instance.loop = !this._instance.loop; this.redraw(); },
                onToggleMute: () => { this._instance.muted = !this._instance.muted; this.redraw(); },
                onChangeSpeed: (speed) => { this._instance.playbackSpeed = speed; this.redraw(); },
                onChangeVolume: (volume) => { this._instance.volume = volume; this.redraw(); },
                onSeek: (time) => { this._instance.seekTo(time); }
            }),
            this.showNotification ? m(PlayPauseAlert, { type: this.notificationType }) : '',
            this.isError ? m('.alert', 'An error occured while trying to play the video') : '',
        ]);
    }
};

export default MediaPlayerComponent;
