import m from 'mithril';
import PlayButton from './PlayButton';
import ElapsedTime from './ElapsedTime';
import TotalTime from './TotalTime';
import FullscreenButton from './FullscreenButton';
import SettingsButton from './SettingsButton';
import VolumeButton from './VolumeButton';
import Scrubber from './Scrubber';
import './MediaControls.scss';

/**
 * Media Controls component
 * @prop {Object} attrs
 * @prop {function} attrs.onTogglePlay - Play button event handler
 * @prop {function} attrs.onToggleFullscreen - Fullscreen button event handler
 * @prop {function} attrs.onChangeSpeed - Change speed event handler
 * @prop {function} attrs.onToggleLoop - Change loop setting of playback
 * @prop {string} attrs.elapsedTime - Elapsed playback time
 * @prop {string} attrs.totalTime - Total playback time
 * @prop {string} attrs.type - Media type
 * @prop {boolean} attrs.playing - Is media playing
 * @prop {boolean} attrs.paused - Is media paused
 * @prop {boolean} attrs.stopped - Is media stopped
 * @prop {boolean} attrs.fullscreen - Is media in fullscreen mode
 */
const MediaControls = {
    view(vnode) {
        const {
            onTogglePlay,
            onToggleFullscreen,
            onToggleLoop,
            onToggleMute,
            onChangeVolume,
            onChangeSpeed,
            onSeek,
            onLockControls,
            isSeekingLocked,
            isFullscreenEnabled,
            isVolumeControllable,
            type,
            elapsedTime,
            totalTime,
            fullscreen,
            speed,
            loop,
            volume,
            muted,
            duration,
            currentTime,
            loadedRanges
        } = vnode.attrs;

        return m('div.controls', {
            onmouseenter: function (/* e */) { onLockControls(true); },
            onmouseleave: function (/* e */) { onLockControls(false); }
        }, [
            m('div.left', [
                m(PlayButton, { ...vnode.attrs, onClick: onTogglePlay }),
                m(ElapsedTime, { type, enabled: true }, elapsedTime)
            ]),
            m(Scrubber, { duration, currentTime, loadedRanges, onSeek, isSeekingLocked }),
            m('div.right', [
                m(TotalTime, { type }, totalTime),
                isFullscreenEnabled ? m(FullscreenButton, { fullscreen, onClick: onToggleFullscreen }) : '',
                m(VolumeButton, { isVolumeControllable, volume, muted, onChangeVolume, onToggleMute }),
                m(SettingsButton, { speed, loop, onToggleLoop, onChangeSpeed }),
            ])
        ]);
    }
};

export default MediaControls;
