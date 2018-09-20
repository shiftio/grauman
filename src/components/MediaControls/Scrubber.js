import m from 'mithril';
import classnames from 'classnames';
import throttle from 'lodash.throttle';
import Polyfills from 'Polyfills';
import TimeFormatter from 'TimeFormatter';
import './Scrubber.scss';

function _matches(el, selector) {
    return (
        el.matches ||
        el.matchesSelector ||
        el.msMatchesSelector ||
        el.mozMatchesSelector ||
        el.webkitMatchesSelector ||
        el.oMatchesSelector
    ).call(el, selector);
}

const Scrubber = {
    isDragging: false,
    isSeekingLocked: false,

    hoverTime: 0,
    cursorX: 0,
    percentLoaded: '',
    percentPlayed: 0,

    oninit(vnode) {
        this._onDocumentMouseUp = this._onDocumentMouseUp.bind(this, vnode);
        this._onDocumentMouseMove = throttle(this._onDocumentMouseMove.bind(this, vnode), 25);
    },

    onupdate(vnode) {
        const { currentTime, duration } = vnode.attrs;

        if (this.isDragging) {
            // follow where the seek point will be when the mouseup happens
            this.percentPlayed = `${(this.cursorX / vnode.dom.offsetWidth * 100) || 0}%`;
        } else {
            // note the protection against NaN when duration === 0
            this.percentPlayed = `${(currentTime / duration * 100) || 0}%`;
        }

        this.percentLoaded = this._getPercentLoaded(vnode);
        this.hoverTime = this._getHoverTime(vnode);
        this.hoverLine = this.hoverTime / duration * 100;
        this.isSeekingLocked = vnode.attrs.isSeekingLocked;
    },

    _getHoverTime(vnode) {
        return this.cursorX / vnode.dom.offsetWidth * vnode.attrs.duration;
    },

    _getPercentLoaded(vnode) {
        const { loadedRanges, duration } = vnode.attrs;
        const range = loadedRanges.length - 1;

        if (!loadedRanges.length) {
            return '0%';
        }

        const percent = Math.min(loadedRanges[range][1] / duration * 100, 100);

        return `${percent}%`;
    },

    _onMouseMove(vnode, e) {
        const boundingRect = vnode.dom.getBoundingClientRect();
        const cursorX = Math.max(0, e.clientX - boundingRect.left);
        const width = parseInt(vnode.dom.offsetWidth, 10);

        this.cursorX = Math.min(cursorX, width);
    },

    _onMouseDown(vnode, e) {
        if (vnode.attrs.isSeekingLocked) {
            if (!_matches(e.target, '.progress-loaded') && !_matches(e.target, '.progress-played')) {
                return;
            }
        }

        this.isDragging = true;
        this._attachDocumentListeners();

        e.stopPropagation();
        e.preventDefault();
    },

    _onTouchStart(vnode, e) {
        if (vnode.attrs.isSeekingLocked) {
            if (!_matches(e.target, '.progress-loaded') && !_matches(e.target, '.progress-played')) {
                return;
            }
        }

        const boundingRect = vnode.dom.getBoundingClientRect();
        const cursorX = Math.max(0, e.touches[0].clientX - boundingRect.left);
        const width = parseInt(vnode.dom.offsetWidth, 10);

        this.cursorX = Math.min(cursorX, width);

        this.isDragging = true;

        e.stopPropagation();
        e.preventDefault();
    },

    _onTouchEnd(vnode, e) {
        if (!e.touches.length || Array.prototype.slice.call(e.touches).find(function (t) { return t.identifier === 0; })) {
            this.isDragging = false;
            vnode.attrs.onSeek(this.hoverTime);
            Polyfills.closest(vnode.dom, '.media-container').focus();
        }
    },

    _onTouchMove(vnode, e) {
        if (this.isDragging) {
            const touch = Array.prototype.slice.call(e.touches).find(function (t) {
                return t.identifier === 0;
            });

            if (touch) {
                this._onMouseMove(vnode, touch);
            }
        }
    },

    _onDocumentMouseMove(vnode, e) {
        this._onMouseMove(vnode, e);
    },

    _onDocumentMouseUp(vnode/*, e */) {
        this.isDragging = false;
        vnode.attrs.onSeek(this.hoverTime);
        Polyfills.closest(vnode.dom, '.media-container').focus();
        this._removeDocumentListeners();
    },

    _attachDocumentListeners() {
        document.addEventListener('mouseup', this._onDocumentMouseUp);
        document.addEventListener('mousemove', this._onDocumentMouseMove);
    },

    _removeDocumentListeners() {
        document.removeEventListener('mouseup', this._onDocumentMouseUp);
        document.removeEventListener('mousemove', this._onDocumentMouseMove);
    },

    _onClick(vnode, e) {
        if (vnode.attrs.isSeekingLocked) {
            if (!_matches(e.target, '.progress-loaded') && !_matches(e.target, '.progress-played')) {
                return;
            }
        }

        const offset = vnode.dom.getBoundingClientRect();
        const width = parseInt(vnode.dom.offsetWidth, 10);
        const x = offset.left;
        const clickX = e.clientX - x;
        const clickTime = (clickX / width) * vnode.attrs.duration;

        vnode.attrs.onSeek(clickTime);
    },

    view(vnode) {
        const { percentPlayed } = vnode.state;
        const { isSeekingLocked, loadedRanges, duration } = vnode.attrs;

        return m('.scrubber-container', {
            class: classnames({ 'seeking-locked': isSeekingLocked })
        }, [
            m('style', [
                '.scrubber-container [data-grauman-tooltip]:before,',
                '.scrubber-container [data-grauman-tooltip]:after {',
                    // eslint-disable-next-line indent
                    `left: ${this.hoverLine}%;`,
                '}'
            ].join('')),
            m(`.scrubber[data-grauman-tooltip="${TimeFormatter.toTime(this.hoverTime)}"]`, {
                onclick: this._onClick.bind(this, vnode),
                ontouchstart: this._onTouchStart.bind(this, vnode),
                ontouchend: this._onTouchEnd.bind(this, vnode),
                ontouchmove: this._onTouchMove.bind(this, vnode),
                onmousedown: this._onMouseDown.bind(this, vnode),
                onmousemove: this._onMouseMove.bind(this, vnode)
            }, [
                m('.progress-background'),
                m('.progress-played', { style: { width: percentPlayed } }),
                loadedRanges.map((range) => {
                    const chunkStyle = {
                        width: `${Math.floor((range[1] - range[0]) / duration * 100, 100)}%`,
                        left: `${range[0] / duration * 100}%`
                    };

                    return m('.progress-loaded', { style: chunkStyle } );
                })
            ])
        ]);
    }
};

export default Scrubber;
