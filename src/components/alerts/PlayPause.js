import m from 'mithril';
import classNames from 'classnames';
import './PlayPause.scss';

/**
 * Play / Pause notification icon
 * @prop {Object} attrs
 * @prop {string} attrs.type - Type of notification
 */
const PlayPauseAlert = {
    showAnimation: false,

    oncreate() {
        setTimeout(() => {
            this.showAnimation = true;
            m.redraw(true);
        }, 90);
    },

    view(vnode) {
        const { type } = vnode.attrs;
        const { showAnimation } = vnode.state;

        const className = classNames('icon-container', {
            animate: showAnimation
        });

        return m('div', { class: className }, [
            m('i', { class: `icon-${type}` })
        ]);
    }
};

export default PlayPauseAlert;
