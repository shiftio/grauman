import MediaPlayer from 'MediaPlayer';
import ImageViewer from 'ImageViewer';
import DocumentViewer from 'DocumentViewer';
import MediaFile from 'MediaFile';
import makeObservable from 'makeObservable';
import { STEREOSCOPIC_LAYOUTS, IMAGEVIEWER_MODES, UPSCALE_MODES } from 'consts';
import 'Grauman.scss';
import 'tooltip.css';
import './fonts/icons/icons.scss';

class Grauman {
    _load() {
        if (this.viewer && this.type !== this.viewer.constructor) {
            this.destroy();
            this.viewer = null;
        }

        if (!this.viewer) {
            // eslint-disable-next-line new-cap
            this.viewer = new this.type(this.container, { ...this.settings, file: this.file });

            this.viewer.setEventBubbleTarget(this);
        }

        this.viewer.file = this.file;
    }

    constructor(container, settings = {}) {
        let _container;
        Object.defineProperty(this, 'container', {
            enumerable: true,
            get() { return _container; },
            set(value) {
                if (!(value instanceof HTMLElement)) {
                    throw new TypeError('Grauman `container` must be an HTMLElement');
                }

                this.destroy();

                _container = value;

                if (this.file) {
                    this._load();
                }
            }
        });

        let _file;
        Object.defineProperty(this, 'file', {
            enumerable: true,
            get() { return _file; },
            set(value) {
                if (!(value instanceof MediaFile)) {
                    throw new TypeError('Grauman `file` property must be an instance of a MediaFile');
                }

                if (value !== _file) {
                    _file = value;

                    this._load();
                }
            }
        });

        Object.defineProperty(this, 'type', {
            enumerable: true,
            get() {
                if (!this.file) {
                    return void 0;
                }

                const type = this.file.mimeType.split('/')[0];

                if (type in { audio: 1, video: 1 } || this.file.extension === 'm3u8') {
                    return MediaPlayer;
                } else if (type === 'image') {
                    return ImageViewer;
                } else if (this.file.extension === 'pdf') {
                    return DocumentViewer;
                }

                console.warn('Grauman does not have an acceptable viewer for MediaFile', this.file);
            }
        });

        makeObservable(this);

        this.viewer = null;
        this.container = container;
        this.settings = Object.assign({}, settings);

        if (this.settings.file) {
            const f = this.settings.file;
            delete this.settings.file;
            this.file = f;
        }
    }

    destroy() {
        if (this.viewer) {
            this.viewer.destroy();
        }
    }
}

// TODO: There's gotta be a better way to set the public path
let _publicPath = '';
Object.defineProperty(Grauman, 'publicPath', {
    enumerable: true,
    get() { return _publicPath; },
    set(value) {
        _publicPath = value;
        MediaPlayer._publicPath = value;
        DocumentViewer._publicPath = value;
    }
});

Grauman.MediaFile = MediaFile;
Grauman.MediaPlayer = MediaPlayer;
Grauman.ImageViewer = ImageViewer;
Grauman.DocumentViewer = DocumentViewer;
Grauman.STEREOSCOPIC_LAYOUTS = STEREOSCOPIC_LAYOUTS;
Grauman.IMAGEVIEWER_MODES = IMAGEVIEWER_MODES;
Grauman.UPSCALE_MODES = UPSCALE_MODES;

module.exports = Grauman;
