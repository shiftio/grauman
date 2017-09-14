function _getFrame(seconds, fps) {
    return Math.floor(seconds.toFixed(5) * fps);
}

function _wrap(n) {
    return ((n < 10) ? '0' + n : n);
}

export default class TimeFormatter {
    static toTime(seconds) {
        let minutes = Math.floor(seconds / 60 % 60);
        let hours = Math.floor(seconds / 3600);
        let string;

        seconds = Math.floor(seconds % 60);

        minutes = minutes < 10 ? '0' + minutes : minutes;
        seconds = seconds < 10 ? '0' + seconds : seconds;

        if (hours > 0) {
            hours = hours < 10 ? '0' + hours : hours;
            string = `${hours}:${minutes}:${seconds}`;
        } else {
            string = `${minutes}:${seconds}`;
        }

        return string;
    }

    static toSMPTE(seconds, fps) {
        const frame = _getFrame(seconds, fps);
        const _hour = ((fps * 60) * 60), _minute = (fps * 60);
        const _hours = (frame / _hour).toFixed(0);
        const _minutes = (Number((frame / _minute).toString().split('.')[0]) % 60);
        const _seconds = (Number((frame / fps).toString().split('.')[0]) % 60);

        return [
            _wrap(_hours),
            _wrap(_minutes),
            _wrap(_seconds),
            _wrap(Math.floor(frame % fps))
        ].join(';');
    }
}
