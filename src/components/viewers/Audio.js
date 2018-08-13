import m from 'mithril';
import classnames from 'classnames';
import TimeFormatter from 'TimeFormatter';
import Polyfills from 'Polyfills';
import './Audio.scss';
import { IS_MOBILE } from 'consts';

const AudioViewer = {
    isHovering: false,
    isDragging: false,
    percentPlayed: 0,
    hoverTime: 0,
    cursorX: 0,

    oninit(vnode) {
        this._onDocumentMouseUp = this._onDocumentMouseUp.bind(this, vnode);
        this._onDocumentMouseMove = this._onDocumentMouseMove.bind(this, vnode);
    },

    oncreate(vnode) {
        vnode.attrs.onLockControls(true);
    },

    onupdate(vnode) {
        if (this.isHovering) {
            this.hoverTime = this.cursorX / vnode.dom.offsetWidth * vnode.attrs.duration;
        }

        if (this.isDragging) {
            this.percentPlayed = this.cursorX / vnode.dom.offsetWidth * 100 || 0;
        } else {
            this.percentPlayed = vnode.attrs.currentTime / vnode.attrs.duration * 100 || 0;
        }
    },

    _onMouseMove(vnode, e) {
        const boundingRect = vnode.dom.getBoundingClientRect();
        const cursorX = Math.max(0, e.clientX - boundingRect.left);
        const width = parseInt(vnode.dom.offsetWidth, 10);

        this.cursorX = Math.min(cursorX, width);
    },

    _onMouseEnter() {
        this.isHovering = true;
    },

    _onMouseLeave() {
        this.isHovering = false;
    },

    _onMouseDown(vnode, e) {
        this.isDragging = true;
        this._attachDocumentListeners();

        e.stopPropagation();
        e.preventDefault();
    },

    _attachDocumentListeners() {
        document.addEventListener('mouseup', this._onDocumentMouseUp);
        document.addEventListener('mousemove', this._onDocumentMouseMove);
    },

    _removeDocumentListeners() {
        document.removeEventListener('mouseup', this._onDocumentMouseUp);
        document.removeEventListener('mousemove', this._onDocumentMouseMove);
    },

    _onDocumentMouseUp(vnode) {
        IS_MOBILE && this.onupdate(vnode);
        this.isDragging = false;
        vnode.attrs.onSeek(this.hoverTime);
        Polyfills.closest(vnode.dom, '.media-container').focus();
        this._removeDocumentListeners();
    },

    _onDocumentMouseMove(vnode, e) {
        this._onMouseMove(vnode, e);
    },

    view(vnode) {
        const percentHover = this.hoverTime / vnode.attrs.duration * 100 || 0;

        return m('.viewer', {
            style: { 'background-color': '#fff' },
            onclick: () => {
                IS_MOBILE && this.onupdate(vnode);
                vnode.attrs.onSeek(this.hoverTime);
            },
            onmousemove: this._onMouseMove.bind(this, vnode),
            onmouseenter: this._onMouseEnter.bind(this, vnode),
            onmousedown: this._onMouseDown.bind(this, vnode),
            onmouseleave: this._onMouseLeave.bind(this, vnode)
        }, [
            m('audio', vnode.attrs.mediaAttrs),
            vnode.attrs.file.waveform ? [
                m('.audio-image', {
                    style: { 'background-image': `url("${vnode.attrs.file.waveform}")` }
                }, [
                    m('.audio-playhead', { style: { width: `${this.percentPlayed}%` } }),
                    this.isHovering ? m('.audio-scrubber', { style: { width: `${percentHover}%` } }, [
                        m('.hover-time', { class: classnames({ right: percentHover < 50 }) }, TimeFormatter.toTime(this.hoverTime))
                    ]) : ''
                ])
            ]
            : ''
        ]);
    }
};

export default AudioViewer;
