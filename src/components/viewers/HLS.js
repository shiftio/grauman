import m from 'mithril';
import Hls from 'hls.js/lib/hls';
import './Video.scss';

const HLSViewer = {
    isLive: false,

    oncreate(vnode) {
        const hls = new Hls();

        // forward all HLS.js events.
        Object.keys(Hls.Events).forEach((key) => {
            hls.on(Hls.Events[key], (name, data = {}) => {
                vnode.attrs.eventForwarder({
                    type: name,
                    data
                });
            });
        });

        hls.on(Hls.Events.LEVEL_UPDATED, (eventName, data) => {
            const isLive = data.details.live;

            if (data.level === hls.streamController.level && isLive !== vnode.state.isLive) {
                vnode.state.isLive = isLive;
                vnode.attrs.onLockSeek(isLive);
            }
        });

        hls.loadSource(vnode.attrs.mediaAttrs.src);
        hls.attachMedia(vnode.dom.querySelector('video'));

        this.hls = hls;
    },

    onremove() {
        this.hls.destroy();
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

export default HLSViewer;
