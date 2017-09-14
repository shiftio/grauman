import m from 'mithril';
import classNames from 'classnames';
import './SettingsButton.scss';

/**
 * Settings button component
 * @prop {Object} attrs
 * @prop {number} attrs.speed - Playback speed
 * @prop {boolean} attrs.loop - Loop playback
 * @prop {function} attrs.onChangeSpeed
 * @prop {function} attrs.onToggleLoop
 */
const SettingsButton = {
    isHovering: false,

    _onHover() {
        this.isHovering = true;
    },

    _onLeave() {
        this.isHovering = false;
    },

    _isSpeedSelected(speed, attrs) {
        return classNames('radio-button', {
            'active': speed === attrs.speed
        });
    },

    _onChangeSpeed(speed, attrs) {
        if (speed === attrs.speed) {
            return;
        }

        attrs.onChangeSpeed(speed);
    },

    _createSpeedButton(speed, attrs) {
        const text = speed === 1 ? 'Normal' : speed;
        return m('div', {
            class: this._isSpeedSelected(speed, attrs), onclick: this._onChangeSpeed.bind(this, speed, attrs)
        }, text);
    },

    view(vnode) {
        const { isHovering } = vnode.state;
        const { loop, onToggleLoop } = vnode.attrs;
        const buttonProps = {
            onmouseenter: this._onHover.bind(this),
            onmouseleave: this._onLeave.bind(this)
        };
        const speedSettings = [0.5, 1, 1.25, 1.5].map((speed) => {
            return this._createSpeedButton(speed, vnode.attrs);
        });

        return m('.control.button.settings', buttonProps, [
            m('i.icon-gear'),
            isHovering
                ? m('.menu-container', [
                    m('div', { 'data-attr': 'loop', class: loop ? 'active' : '', onclick: onToggleLoop }, [
                        'Loop ',
                        m('input[type=checkbox]', { checked: loop })
                    ]),
                    m('div', { 'data-attr': 'speed' }, 'Playback Speed'),
                    m('.radio-container', speedSettings)
                ])
                : ''
        ]);
    }
};

export default SettingsButton;
