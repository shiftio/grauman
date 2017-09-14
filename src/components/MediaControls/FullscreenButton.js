import m from 'mithril';
import classNames from 'classnames';

/**
 * Fullscreen button component
 * @prop {Object} attrs
 * @prop {boolean} attrs.fullscreen
 * @prop {boolean} attrs.onClick
 */
const FullscreenButton = {
    view(vnode) {
        const { fullscreen, onClick } = vnode.attrs;
        const className = classNames({
            'icon-compress': fullscreen,
            'icon-expand': !fullscreen
        });

        return m('.control.button.fullscreen', { onclick: onClick }, [
            m('i', { class: className })
        ]);
    }
};

export default FullscreenButton;
