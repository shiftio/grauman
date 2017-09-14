import m from 'mithril';
import classNames from 'classnames';

/**
 * Elapsed time component
 * @prop {Object} attrs
 * @prop {boolean} attrs.enabled - Timer enabled
 * @prop {string} attrs.type - Media type
 */
const ElapsedTime = {
    view(vnode) {
        const { type } = vnode.attrs;
        const className = classNames('elapsed', type, {
            enabled: vnode.attrs.enabled
        });

        return m('div.control.time', { class: className }, vnode.children);
    }
};

export default ElapsedTime;
