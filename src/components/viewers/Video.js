import m from 'mithril';
import './Video.scss';

const VideoViewer = {
    onremove(vnode) {
        vnode.dom.querySelector('video').remove();
    },

    view(vnode) {
        return m('.viewer', {
            onclick: vnode.attrs.onTogglePlay,
            oncontextmenu(e) { e.preventDefault(); }
        }, [
            m('video', vnode.attrs.mediaAttrs)
        ]);
    }
};

export default VideoViewer;
