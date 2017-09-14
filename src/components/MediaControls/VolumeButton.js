import m from 'mithril';
import throttle from 'lodash.throttle';
import classnames from 'classnames';
import Polyfills from 'Polyfills';
import './VolumeButton.scss';

const VolumeButton = {
    isHovering: false,
    lastMouseCoords: [0, 0],

    oninit(vnode) {
        this._onDocumentMouseMove = throttle(this._onDocumentMouseMove.bind(this, vnode), 25);
        this._onDocumentMouseUp = this._onDocumentMouseUp.bind(this, vnode);
    },

    onupdate(vnode) {
        const { volume } = vnode.attrs;

        if (!this.isHovering && !this.isDragging) {
            return;
        }

        const hitbox = vnode.dom.querySelector('.slider-hitbox');
        const track = vnode.dom.querySelector('.slider-background');
        const slider = vnode.dom.querySelector('.slider');
        const hitboxStyle = window.getComputedStyle(hitbox, null);
        const trackStyle = window.getComputedStyle(track, null);
        const sliderStyle = window.getComputedStyle(slider, null);

        const sliderHeight = parseInt(sliderStyle.height, 10);
        const trackHeight = parseInt(trackStyle.height, 10);

        const trackTopMargin = (
            parseInt(hitboxStyle.marginTop, 10) +
            parseInt(hitboxStyle.paddingTop, 10) +
            parseInt(hitboxStyle.borderTopWidth, 10) +
            parseInt(trackStyle.marginTop, 10) +
            parseInt(trackStyle.paddingTop, 10) +
            parseInt(trackStyle.borderTopWidth, 10)
        );

        const volumePercent = Math.abs(trackHeight - (trackHeight * volume));

        this.sliderOffset = `${trackTopMargin - sliderHeight / 2 + volumePercent}px`;
    },

    _onHover() {
        this.isHovering = true;
    },

    _onLeave() {
        this.isHovering = false;
    },

    _onMouseDown(vnode, e) {
        this.isDragging = true;
        this._attachDocumentListeners();

        e.preventDefault();
        e.stopPropagation();
    },

    _onTouchStart(vnode, e) {
        this.isDragging = true;

        e.preventDefault();
        e.stopPropagation();
    },

    _onTouchEnd(vnode, e) {
        if (!e.touches.length || Array.prototype.slice.call(e.touches).find(function (t) { return t.identifier === 0; })) {
            this.isDragging = false;
            this.lastMouseCoords[0] = this.lastMouseCoords[1] = -1;
            Polyfills.closest(vnode.dom, '.media-container').focus();
        }
    },

    _onTouchMove(vnode, e) {
        if (this.isDragging) {
            const touch = Array.prototype.slice.call(e.touches).find(function (t) { return t.identifier === 0; });

            if (touch) {
                vnode.attrs.onChangeVolume(this._calculateVolume(touch, vnode.dom));
            }
        }
    },

    _onDocumentMouseMove(vnode, e) {
        if (this.isDragging) {
            vnode.attrs.onChangeVolume(this._calculateVolume(e, vnode.dom));
        }
    },

    _onDocumentMouseUp(vnode, e) {
        this.isDragging = false;
        this.lastMouseCoords[0] = this.lastMouseCoords[1] = -1;
        this._removeDocumentListeners();
        Polyfills.closest(vnode.dom, '.media-container').focus();
        vnode.attrs.onChangeVolume(this._calculateVolume(e, vnode.dom));
    },

    _calculateVolume(e, container) {
        const hitbox = container.querySelector('.slider-hitbox');
        const track = hitbox.querySelector('.slider-background');
        const trackStyle = window.getComputedStyle(track, null);
        const { top } = track.getBoundingClientRect();

        const bottom = top + parseInt(trackStyle.height, 10) || 0;
        const length = bottom - top;

        let volume = 0;

        if (e.clientY >= top && e.clientY <= bottom) {
            volume = 1 - ((e.clientY - top) / length);
        } else if (e.clientY < top) {
            volume = 1;
        } else {
            volume = 0;
        }

        return volume;
    },

    _attachDocumentListeners() {
        document.addEventListener('mousemove', this._onDocumentMouseMove);
        document.addEventListener('mouseup', this._onDocumentMouseUp);
    },

    _removeDocumentListeners() {
        document.removeEventListener('mousemove', this._onDocumentMouseMove);
        document.removeEventListener('mouseup', this._onDocumentMouseUp);
    },

    view(vnode) {
        const { isVolumeControllable, volume, muted, onToggleMute } = vnode.attrs;
        const { isHovering, isDragging, sliderOffset } = vnode.state;
        const volumeClass = classnames('fa', {
            'icon-volume-up': volume > 0.5,
            'icon-volume-down': volume <= 0.5,
        });

        return m('.control.button.sound', {
            onmouseenter: this._onHover.bind(this),
            onmouseleave: this._onLeave.bind(this)
        }, [
            isVolumeControllable && (isHovering || isDragging) ?
                m('.slider-container', [
                    m('.slider-hitbox', {
                        onmousedown: this._onMouseDown.bind(this, vnode),
                        ontouchstart: this._onTouchStart.bind(this, vnode),
                        ontouchmove: this._onTouchMove.bind(this, vnode),
                        ontouchend: this._onTouchEnd.bind(this, vnode)
                    }, [
                        m('.slider-background'),
                        m('.slider', { style: { top: sliderOffset } })
                    ])
                ])
                : '',
            m('.volume-icon', { onclick: onToggleMute },
                (muted || volume === 0) ?
                    m('div', [
                        m('.icon-volume-off'),
                        muted ? m('.icon-close') : undefined
                    ])
                    : m('div', { class: volumeClass })
            )
        ]);
    }
};

export default VolumeButton;
