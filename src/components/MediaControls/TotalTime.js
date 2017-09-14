import m from 'mithril';
import classNames from 'classnames';

/**
 * Total time component
 * @prop {Object} attrs
 * @prop {string} attrs.type - Media type
 */
const TotalTime = {
    view(vnode) {
        const { type } = vnode.attrs;
        const className = classNames('control time total', type);

        return m('div', { class: className }, vnode.children);
    }
};

export default TotalTime;
