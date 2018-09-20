import m from 'mithril';

const PlayAlert = {
    view(vnode) {
        return m('div', {
            onclick: vnode.attrs.onTogglePlay,
            class: 'icon-container-wrapper'
        }, m('div.icon-container',{} , m('i.icon-play')));
    }
};

export default PlayAlert;
