import Hls from 'hls.js/lib/hls';

const nativeEvents = {
    ABORT: 'abort',
    CAN_PLAY: 'canplay',
    CAN_PLAY_THROUGH: 'canplaythrough',
    ENDED: 'ended',
    ERROR: 'error',
    LOADED_DATA: 'loadeddata',
    LOADED_METADATA: 'loadedmetadata',
    LOAD_END: 'loadend',
    LOAD_START: 'loadstart',
    PAUSE: 'pause',
    PLAY: 'play',
    PLAYING: 'playing',
    PROGRESS: 'progress',
    RATE_CHANGE: 'ratechange',
    SEEKED: 'seeked',
    SEEKING: 'seeking',
    STALLED: 'stalled',
    SUSPEND: 'suspend',
    TIME_UPDATE: 'timeupdate',
    VOLUME_CHANGE: 'volumechange',
    WAITING: 'waiting'
};

function toProperCase(str) {
    return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

const hlsEvents = Object.keys(Hls.Events).reduce(function (acc, key) {
    acc['HLS_' + key] = 'hls' + toProperCase(key.replace(/_/g, ' ')).replace(/\ /g, '');
    return acc;
}, {});

const Events = Object.freeze(Object.assign(nativeEvents, hlsEvents));

export default Events;

