import m from 'mithril';
import MediaFile from 'MediaFile';
import makeObservable from 'makeObservable';
import './DocumentViewer.scss';

export default class DocumentViewer {
    constructor(container, settings = {}) {
        /**
         * Get or set a boolean indiciating whether or not to allow the DocumentViewer to
         * present downloading functionality to the UI.
         *
         * @property {boolean} [printingEnabled=false]
         * @default false
         */
        this.printingEnabled = Boolean(settings.printingEnabled);

        /**
         * Get or set a boolean indicating whether or not to allow the DocumentViewer to
         * present printing functionality to the user
         *
         * @property {boolean} [downloadingEnabled=false]
         * @default false
         */
        this.downloadingEnabled = Boolean(settings.downloadingEnabled);

        /**
         * Get or set the DocumentViewer's HTMLElement container.
         *
         * Setting this property will cause the DocumentViewer to destroy itself and reinitialize
         * itself with the new container.
         *
         * @name container
         * @type HTMLElement
         * @memberof DocumentViewer
         * @property
         * @instance
         */
        let _container;
        Object.defineProperty(this, 'container', {
            enumerable: true,
            get() { return _container; },
            set(value) {
                if (!(value instanceof HTMLElement)) {
                    throw new TypeError('DocumentViewer `container` must be an HTMLElement');
                }

                this.destroy();

                _container = value;

                if (this.file) {
                    this._load();
                }
            }
        });

        /**
         * Get or set the MediaFile for the DocumentViewer to display.
         *
         * Settings this property will cause DocumentViewer to unload the current MediaFile
         * and viewer and load the newly set MediaFile
         *
         * @name file
         * @type MediaFile
         * @memberof DocumentViewer
         * @property
         * @instance
         */
        let _file;
        Object.defineProperty(this, 'file', {
            enumerable: true,
            get() { return _file; },
            set(value) {
                if (!(value instanceof MediaFile)) {
                    throw new TypeError('DocumentViewer file property must be an instance of MediaFile');
                }

                if (value !== _file) {
                    _file = value;

                    this._load();
                }
            }
        });

        makeObservable(this);

        this._isMounted = false;
        this._isIFrameReady = false;
        this.container = container;

        if (settings.file instanceof MediaFile) {
            this.file = settings.file;
        }
    }

    destroy() {
        if (this._isMounted) {
            m.mount(this.container, null);
        }

        this._isMounted = false;
    }

    _load() {
        if (!this.file) {
            throw new Error('DocumentViewer: called `_load` with no `file`');
        }

        // do NOT destroy the iframe and rerender it just to change the document source.
        // use the postMessage bus to tell the already instantiated PDF.JS iframe component
        // to change its source. It's *significantly* faster than tearing down the iframe
        // and rerendering it
        if (this._isMounted) {
            if (this._isIFrameReady) {
                this._changePDFJSSrc();
            } else {
                // TODO: actually handle this case instead of saying "too bad"
                console.warn(
                    'DocumentViewer: asked to change src before last request finished rendering. Ignoring.'
                );
            }
        } else {
            this._initialLoad();
        }
    }

    _changePDFJSSrc() {
        this.container.querySelector('iframe').contentWindow.postMessage({
            type: 'open',
            url: this.file.url
        }, window.location.origin);
    }

    _initialLoad() {
        const instance = this;
        const { printingEnabled, downloadingEnabled } = instance;

        m.mount(this.container, {
            iframeReady: false,
            printingEnabled,
            downloadingEnabled,

            _postMessageHandler(vnode, e) {
                // make sure the message is from the same domain
                if (e.origin !== window.location.origin) {
                    return;
                }

                const iframe = vnode.dom.querySelector('iframe').contentWindow;

                // make sure the message is from the iframe this component manages
                if (iframe !== e.source) {
                    return;
                }

                switch (e.data) {
                    case 'ready':
                        instance._isIFrameReady = true;
                        iframe.postMessage({
                            type: 'initialize',
                            url: instance.file.url,
                            allowPrinting: this.printingEnabled,
                            allowDownloading: this.downloadingEnabled
                        }, window.location.origin);

                        break;
                    default: console.warn('DocumentViewer: Unhandled message from PDF.JS iFrame:', e.data);
                }
            },

            oninit(vnode) {
                this.printingEnabled = instance.printingEnabled;
                this.downloadingEnabled = instance.downloadingEnabled;
                this._postMessageHandler = this._postMessageHandler.bind(this, vnode);
            },

            oncreate(/* vnode */) {
                window.addEventListener('message', this._postMessageHandler, false);
            },

            onremove(/* vnode */) {
                window.removeEventListener('message', this._postMessageHandler);
            },

            view(/* vnode */) {
                return m('.grauman-document-viewer', [
                    m('iframe', {
                        src: DocumentViewer._publicPath + 'pdf.js/web/viewer.html',
                        width: '100%',
                        height: '100%',
                        name: 'pdfjs',
                        allowfullscreen: true
                    })
                ]);
            }
        });

        this._isMounted = true;
    }
}
