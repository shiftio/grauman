import m from 'mithril';
import './Buffering.scss';

/**
* Loading Alert
*/
const BufferingAlert = {
    view(/* vnode */) {
        return m('.alert',
            m('.spinner', [
                m('.bounce-1'),
                m('.bounce-2'),
                m('.bounce-3')
            ])
        );
    }
};

export default BufferingAlert;
