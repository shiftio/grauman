import m from 'mithril';

/**
 * Play, Pause, Stop button
 * @prop {Object} attrs
 * @prop {function} attrs.onClick - Play button event handler
 * @prop {boolean} attrs.playing - Is media playing
 * @prop {boolean} attrs.paused - Is media paused
 * @prop {boolean} attrs.stopped - Is media stopped
 */
const PlayButton = {
    view(vnode) {
        const { stopped, paused, playing, loading, onClick } = vnode.attrs;
        let button = null;

        if (stopped) {
            button = m('i.icon-repeat.icon-vertical-mirror');
        } else if (playing) {
            button = m('i.icon-pause');
        } else if (paused) {
            button = m('i.icon-play');
        } else if (loading) {
            button = m('i.icon-spinner.icon-spin');
        }

        return m('.control.button', { onclick: () => { if (!loading) { onClick.apply(this, arguments); } } }, [
            button
        ]);
    }
};

export default PlayButton;
