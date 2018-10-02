import m from 'mithril';
import MediaFile from 'MediaFile';
import Storage from 'Storage';
import ImageViewerComponent from 'components/ImageViewer';
import { IMAGEVIEWER_MODES, DEFAULT_LOCALSTORAGE_BASE_KEY } from 'consts';
import makeObservable from 'makeObservable';

export default class ImageViewer {
    /**
     * `grauman.component.created` event. Fired in oncreate function inside Grauman.
     *
     * When using for ImageViewer you need know that this event can be dispatched before you will attach callback to it
     * due to fast image loading.
     *
     * @event grauman.component.created
     * @type {Event}
     */
    /**
     * `grauman.component.fullscreenToggle` event. Fired when fullscreen toggle button is clicked.
     *
     * This event gives possibility to control fullscreen toggling and state from outside of Grauman at all: toggling -
     * fullscreenToggle.cancelBubble property (if event.cancelBubble = true will skip any inner manipulations with html
     * fullscreen state on fullscreen toggle event) and state - fullscreenToggle.getFullscreenStateHandler
     * and fullscreenChangeEvent.getFullscreenStateHandler (fullscreenChangeEvent need to have getFullscreenStateHandler
     * callback because when in fullscreen state you change media - it need to force state change by dispatching
     * fullscreenChangeEvent) callback that returns fullscreen state.
     *
     * @event grauman.component.fullscreenToggle
     * @type {Event}
     */

    constructor(container, settings = {}) {
        this.localStorageEnabled = typeof settings.localStorageEnabled === 'boolean' ?
            settings.localStorageEnabled : true;

        if (!Storage.isAvailable) {
            this.localStorageEnabled = false;

            console.warn('ImageViewer: `localStorage` not detected in this environment. Disabling.');
        }

        this.localStorageKey = settings.localStorageKey || DEFAULT_LOCALSTORAGE_BASE_KEY;
        const _storage = new Storage();
        _storage.setBaseKey(this.localStorageKey);

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
         * Get or set the ImageViewer's HTMLElement container.
         *
         * Setting this property will cause the ImageViewer to destroy itself and reinitialize
         * itself with the new container.
         *
         * @name container
         * @type HTMLElement
         * @memberof ImageViewer
         * @property
         * @instance
         */
        let _container;
        Object.defineProperty(this, 'container', {
            enumerable: true,
            get() { return _container; },
            set(value) {
                if (!(value instanceof HTMLElement)) {
                    throw new TypeError('ImageViewer `container` must be an HTMLElement');
                }

                this.destroy();

                _container = value;

                if (this.file) {
                    this._load();
                }
            }
        });

        /**
         * Get or set the MediaFile for the ImageViewer to display.
         *
         * Setting this property will cause the ImageViewer to unload the current MediaFile
         * and viewer and load the newly set MediaFile.
         *
         * @name file
         * @type MediaFile
         * @memberof ImageViewer
         * @property
         * @instance
         */
        let _file;
        Object.defineProperty(this, 'file', {
            enumerable: true,
            get() { return _file; },
            set(value) {
                if (!(value instanceof MediaFile)) {
                    throw new TypeError('ImageViewer file property must be an instance of MediaFile');
                }

                if (value !== _file) {
                    _file = value;

                    this._load();
                }
            }
        });

        let _viewMode = IMAGEVIEWER_MODES.FIT;
        Object.defineProperty(this, 'viewMode', {
            enumerable: true,
            get() { return _viewMode; }
            // TODO: Make a setter for `viewMode` that works
        });

        this._onViewModeChange = function (newMode) {
            if (newMode in IMAGEVIEWER_MODES) {
                _viewMode = newMode;
                _storage.set('viewMode', newMode);
            }
        };

        makeObservable(this);

        this._onViewModeChange(_storage.get('viewMode'));
        this.container = container;

        if (settings.file instanceof MediaFile) {
            this.file = settings.file;
        }
    }

    destroy() {
        if (this.container) {
            m.mount(this.container, null);
        }
    }

    _load() {
        if (!this.file) {
            throw new Error('ImageViewer: called `_load` with no `file`');
        }

        const instance = this;

        m.mount(this.container, {
            view(/* vnode */) {
                return m('.grauman-container.grauman-image-viewer', m(ImageViewerComponent, {
                    file: instance.file,
                    isFullscreenEnabled: instance.isFullscreenEnabled,
                    viewMode: instance.viewMode,
                    onViewModeChange: instance._onViewModeChange,
                    _nativeEventForwarder: function _eventForwarder(e) { this._notify(e.type, e); }.bind(instance)
                }));
            }
        });
    }
}
