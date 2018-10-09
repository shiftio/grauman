import m from 'mithril';

const PlayAlert = {
    view(vnode) {
        return m('div.play-alert', {
            onclick: vnode.attrs.onTogglePlay,
            class: 'icon-container'
        }, m('i.icon-play'));
    }
};

export default PlayAlert;
