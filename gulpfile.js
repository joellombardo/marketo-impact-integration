const gulp = require('gulp');
const terser = require('gulp-terser');
const path = require('path');

// Paths to JavaScript files
const paths = {
    scripts: {
        src: './js/*.js', // Source JS files
        dest: './js/min/' // Destination for minified files
    }
};

// Task to minify JavaScript
function minifyScripts() {
    return gulp.src(paths.scripts.src)
        .pipe(terser()) // Minify using terser
        .pipe(gulp.dest(paths.scripts.dest)); // Output to destination
}

// Watch task: Minify on save
function watchFiles() {
    gulp.watch(paths.scripts.src, minifyScripts);
}

// Default task
exports.default = gulp.series(minifyScripts, watchFiles);

