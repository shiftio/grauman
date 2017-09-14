export function closest(element, selector) {
    if (window.Element && typeof Element.prototype.closest === 'function') {
        return Element.prototype.closest.call(element, selector);
    }

    const matches = (element.ownerDocument).querySelectorAll(selector);
    let i;

    do {
        i = matches.length;

        // eslint-disable-next-line no-empty
        while (--i >= 0 && matches.item(i) !== element) {}
    } while ((i < 0) && (element = element.parentElement));

    return element;
}

const Polyfills = {
    closest
};

export default Polyfills;
