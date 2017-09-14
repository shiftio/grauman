(function () {
    'use strict';

    function getData(file, callback, keys) {
        var oReq = new XMLHttpRequest();

        oReq.addEventListener("load", function (e) {
            var data = JSON.parse(e.target.responseText),
                files = [];

            keys = keys || Object.keys(data);

            files = keys.reduce(function (acc, current) {
                return acc.concat(data[current].map(function (file) {
                    return new Grauman.MediaFile(file);
                }));
            }, files);

            callback(files);
        });

        oReq.open('GET', file);
        oReq.send();
    }

    function drawLinks(files, onclick) {
        var linkContainer = document.querySelector('.container-links');

        linkContainer.addEventListener('click', function (e) {
            if (e.target.nodeName === 'A') {
                e.preventDefault();
                onclick(files[e.target.getAttribute('data-index')]);
            }
        });

        files.forEach(function (file, i) {
            var container  = document.createElement('div');

            container.setAttribute('class', 'asset-link');
            container.innerHTML = ['<a href="#" data-index="', i, '">', file.title, '</a>'].join('');
            linkContainer.appendChild(container);
        });
    }

    window.graumanTest = {
        getData: getData,
        drawLinks: drawLinks
    };
}());
