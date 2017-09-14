module.exports = {
    plugins: [
        require('cssnano')({
            autoprefixer: { add: true, remove: true, browsers: ['last 2 versions'] },
            discardCommends: { removeAll: true },
            discardUnused: false,
            mergeIdents: false,
            reduceIdents: false,
            safe: true
        })
    ]
};
