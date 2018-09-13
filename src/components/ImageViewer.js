import m from 'mithril';
import debounce from 'lodash.debounce';
import classnames from 'classnames';
import BufferingAlert from 'components/alerts/Buffering';
import ResizeSensor from 'css-element-queries/src/ResizeSensor';
import { IMAGEVIEWER_MODES, FULLSCREEN_EVENT_NAME } from 'consts';
import './ImageViewer.scss';

const CONTROLS_FADE_MS = 3000;

const ImageViewerComponent = {
    file: null,
    image: null,

    viewMode: IMAGEVIEWER_MODES.FIT,

    isLoading: false,
    isDragging: false,
    isDraggable: false,
    isHidingControls: false,
    isLockingControls: false,
    isFullscreen: false,

    position: [0, 0],
    lastMousePosition: [0, 0],
    viewportWidth: 0,
    viewportHeight: 0,
    resizeSensor: null,

    setViewMode(mode) {
        if (this.viewMode === mode) {
            return false;
        }

        this.viewMode = mode;

        return true;
    },

    onMouseDown(/* vnode, e */) {
        this.attachDragListeners();
    },

    onFullscreenChange(vnode) {
        const element = document.fullscreenElement ||
            document.webkitCurrentFullScreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement;

        this.isFullscreen = (element && vnode.dom.contains(element)) || false;
        this.redraw();
    },

    onElementResize(vnode) {
        const viewportWidth = vnode.dom.clientWidth;
        const viewportHeight = vnode.dom.clientHeight;

        // check to see if `position` needs to be adjusted due to the end of a "full" image
        // now being visible due to the viewport size change
        const imageWidth = this.image.width;
        const imageHeight = this.image.height;
        const positionX = this.position[0];
        const positionY = this.position[1];

        if (this.viewMode === IMAGEVIEWER_MODES.FILL && this.isDraggable) {
            let gutter = viewportWidth - (imageWidth - Math.abs(positionX)),
                newX, newY;

            if (viewportWidth < imageWidth && gutter > 0) {
                newX = positionX + gutter;
            }

            gutter = viewportHeight - (imageHeight - Math.abs(positionY));

            if (viewportHeight < imageHeight && gutter > 0) {
                newY = positionY + gutter;
            }

            if (newX || newY) {
                this.position = [
                    typeof newX !== 'undefined' ? newX : positionX,
                    typeof newY !== 'undefined' ? newY : positionY
                ];
            }
        }

        this.viewportHeight = viewportHeight;
        this.viewportWidth = viewportWidth;
        this.isDraggable = viewportWidth < imageWidth || viewportHeight < imageHeight;
        this.redraw();
    },

    onDocumentMouseMove(vnode, e) {
        if (vnode.state.viewMode === IMAGEVIEWER_MODES.FILL && vnode.state.isDraggable) {
            const lastMousePosition = vnode.state.lastMousePosition;
            const position = vnode.state.position;
            const delta = [lastMousePosition[0] - e.pageX, lastMousePosition[1] - e.pageY];
            const imageHeight = vnode.state.image.height;
            const imageWidth = vnode.state.image.width;
            const viewportHeight = vnode.state.viewportHeight;
            const viewportWidth = vnode.state.viewportWidth;

            let newX = position[0] - delta[0],
                newY = position[1] - delta[1];

            // TODO: these correction guards below could probably be removed if this logic
            // can be embedded into the maths for newX and newY

            // see if the mousemovement will cause the image be moved past its horizontal edges
            if (viewportWidth < imageWidth) {
                const gutter = viewportWidth - (imageWidth - Math.abs(newX));

                if (newX > 0) {
                    newX = 0; // reset X to account for a left gutter
                } else if (gutter > 0) {
                    newX = newX + gutter; // offset the delta to account for a right gutter
                }
            }

            // see if the mousemovement will cause the image to be moved past its vertical edges
            if (viewportHeight < imageHeight) {
                const gutter = viewportHeight - (imageHeight - Math.abs(newY));

                if (newY > 0) {
                    newY = 0; // reset Y to 0 to account for a top gutter
                } else if (gutter > 0) {
                    newY = newY + gutter; // offset the delta to account for a bottom gutter
                }
            }

            vnode.state.lastMousePosition = [e.pageX, e.pageY];
            vnode.state.position = [newX, newY];
            vnode.state.redraw();
        }
    },

    onDocumentMouseUp(/* vnode, e */) {
        this.removeDragListeners();
        this.isDragging = false;
        this.lastMousePosition = [0, 0];
    },

    attachDragListeners() {
        document.addEventListener('mouseup', this.onDocumentMouseUp, false);
        document.addEventListener('mousemove', this.onDocumentMouseMove, false);
    },

    removeDragListeners() {
        document.removeEventListener('mouseup', this.onDocumentMouseUp);
        document.removeEventListener('mousemove', this.onDocumentMouseMove);
    },

    oninit: function (vnode) {
        this.onDocumentMouseMove = this.onDocumentMouseMove.bind(this, vnode);
        this.onDocumentMouseUp = this.onDocumentMouseUp.bind(this, vnode);
        this.onElementResize = this.onElementResize.bind(this, vnode);
        this.onFullscreenChange = this.onFullscreenChange.bind(this, vnode);
        this.viewMode = vnode.attrs.viewMode;
        this.isFullscreenEnabled = vnode.attrs.isFullscreenEnabled;

        this.hideControlsLater = debounce(() => {
            this.hideControls();
            this.redraw();
        }, CONTROLS_FADE_MS);
    },

    loadImage(file) {
        if (this.isLoading) {
            return;
        }

        const image = new Image();

        image.onload = () => {
            this.isLoading = false;
            this.image = image;
            this.position =  [
                -(image.width / 2 - this.viewportWidth / 2),
                -(image.height / 2 - this.viewportHeight / 2)
            ];
            this.lastMousePosition = this.position;
            this.onElementResize();
        };

        this.hideControlsLater();
        this.isLoading = true;
        image.src = file.url;
        this.redraw();
    },

    redraw() {
        m.redraw();
    },

    oncreate: function (vnode) {
        this.viewportWidth = vnode.dom.clientWidth;
        this.viewportHeight = vnode.dom.clientHeight;
        this.resizeSensor = new ResizeSensor(vnode.dom, this.onElementResize);

        this.loadImage(vnode.attrs.file);
        document.addEventListener(FULLSCREEN_EVENT_NAME, this.onFullscreenChange);
    },

    onremove: function (/* vnode */) {
        this.resizeSensor.detach();
        this.resizeSensor = null;
        this.removeDragListeners();
        document.removeEventListener(FULLSCREEN_EVENT_NAME, this.onFullscreenChange);
    },

    showControls() {
        this.isHidingControls = false;
    },

    hideControls() {
        if (!this.isLockingControls) {
            this.isHidingControls = true;
        }
    },

    calculateImageStyle() {
        if (!this.image) {
            return;
        }

        const position = this.position;
        const styles = {
            'background-image': `url("${this.image.src.replace(/(")/g, "\\$1")}")`
        };

        let positionX = 'center',
            positionY = 'center';

        if (this.viewMode === IMAGEVIEWER_MODES.FILL && this.isDraggable) {
            if (this.viewportWidth < this.image.width) {
                positionX = `${position[0]}px`;
            }

            if (this.viewportHeight < this.image.height) {
                positionY = `${position[1]}px`;
            }
        } else if (this.isDraggable) {
            styles['background-size'] = 'contain';
        }

        styles['background-position'] = `${positionX} ${positionY}`;

        return styles;
    },

    toggleFullscreen(vnode) {
        const container = vnode.dom;

        if (this.isFullscreen) {
            const exitFullscreen = document.exitFullscreen ||
                document.mozCancelFullScreen ||
                document.webkitExitFullscreen;

            exitFullscreen.apply(document);
        } else {
            const requestFullscreen = container.requestFullScreen ||
                container.webkitRequestFullScreen ||
                container.mozRequestFullScreen;

            requestFullscreen.apply(container);
        }
    },

    view(vnode) {
        const _setViewMode = function (mode) {
            return function (e) {
                if (vnode.state.setViewMode(mode)) {
                    vnode.attrs.onViewModeChange(mode);
                }

                e.stopPropagation();
            };
        };

        return m('div', {
            class: classnames('image-container', {
                'is-loading': this.isLoading,
                'is-draggable': this.isDraggable,
                'is-fullscreen': this.isFullscreen,
                [this.viewMode.toLowerCase()]: true,
                'controls-hidden': this.isHidingControls
            }),

            onmousedown(e) {
                if (vnode.state.viewMode === IMAGEVIEWER_MODES.FILL && vnode.state.isDraggable) {
                    vnode.state.isDragging = true;
                    vnode.state.lastMousePosition = [e.pageX, e.pageY];
                    vnode.state.attachDragListeners();
                }

                e.stopPropagation();
                e.preventDefault();
            },

            onmouseenter(/* e */) {
                vnode.state.showControls();
            },

            onmousemove(/* e */) {
                if (vnode.state.isHidingControls) {
                    vnode.state.showControls();
                } else {
                    vnode.state.hideControlsLater();
                }
            },

            onmouseleave(/* e */) {
                vnode.state.hideControls();
            }
        }, [
            this.isLoading ? m(BufferingAlert) : '',
            m('div.image', {
                style: this.calculateImageStyle()
            }),
            m('.controls-container', {
                class: classnames({ [this.viewMode.toLowerCase()]: true }),
                onmouseenter: () => { this.isLockingControls = true; },
                onmouseleave: () => { this.isLockingControls = false; }
            }, [
                m('div.button.fit[data-grauman-tooltip="Fit in window"]', {
                    onclick: _setViewMode(IMAGEVIEWER_MODES.FIT)
                }, [m('i.icon-shrink-16')]),
                m('div.button.fill[data-grauman-tooltip="Actual size"]', {
                    onclick: _setViewMode(IMAGEVIEWER_MODES.FILL)
                }, [m('i.icon-enlarge-16')]),
                this.isFullscreenEnabled ? m('div.button.fullscreen[data-grauman-tooltip="Toggle fullscreen"]', {
                    onclick: () => { this.toggleFullscreen(vnode); }
                }, [
                    m('i', {
                        class: classnames({
                            'icon-expand-16': !this.isFullscreen,
                            'icon-compress-16': this.isFullscreen
                        })
                    })
                ]) : ''
            ])
        ]);
    }
};

export default ImageViewerComponent;
