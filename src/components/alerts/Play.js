import m from 'mithril';

const PlayAlert = {
    view(/* vnode */) {
        return m('div', {
            class: 'icon-container'
        }, m('i.icon-play'));
    }
};

export default PlayAlert;
