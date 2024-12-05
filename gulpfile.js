const gulp = require('gulp');
const terser = require('gulp-terser');
const zip = require('gulp-zip');
const fs = require('fs');
const path = require('path');

// Paths
const paths = {
    scripts: {
        src: './js/*.js', // Source JS files
        dest: './js/min/' // Destination for minified files
    },
    build: {
        src: './', // Root directory for the plugin
        dest: './dist', // Destination for the release zip
    },
    temp: './temp', // Temporary folder for building the release
};

// Ensure the temp directory exists
function createTempFolder() {
    if (!fs.existsSync(paths.temp)) {
        fs.mkdirSync(paths.temp, { recursive: true });
    }
}

// Delete the temp directory
function deleteTempFolder() {
    if (fs.existsSync(paths.temp)) {
        fs.rmSync(paths.temp, { recursive: true, force: true });
    }
}

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

// Read plugin version from the main PHP file
function getVersion() {
    const mainFile = fs.readFileSync('./marketo-impact-integration.php', 'utf8');
    const versionMatch = mainFile.match(/Version:\s*(.*)/);
    return versionMatch ? versionMatch[1].trim() : 'unknown';
}

// Build the release package
async function buildRelease() {
    const pluginVersion = getVersion();
    const zipFilename = `marketo-impact-integration-v${pluginVersion}.zip`;

    // Create the temp folder
    createTempFolder();

    // Copy files to the temp directory and create the zip
    return gulp.src([
        `${paths.build.src}/**/*`, // Include all files
        `!${paths.build.src}/node_modules/**`, // Exclude development files
        `!${paths.build.src}/dist/**`,
        `!${paths.build.src}/temp/**`,
        `!${paths.build.src}/gulpfile.js`,
        `!${paths.build.src}/package.json`,
        `!${paths.build.src}/package-lock.json`,
        `!${paths.build.src}/composer.json`,
        `!${paths.build.src}/composer.lock`,
        `!${paths.build.src}/README.md`,
        `!${paths.build.src}/.git/**`,
        `!${paths.build.src}/.gitignore`,
    ], { base: '.' }) // Preserve relative paths
        .pipe(gulp.dest(`${paths.temp}/marketo-impact-integration`)) // Copy to temp folder
        .on('end', () => {
            gulp.src(`${paths.temp}/**/*`) // Read files from temp folder
                .pipe(zip(zipFilename)) // Create zip
                .pipe(gulp.dest(paths.build.dest)) // Save zip
                .on('end', deleteTempFolder); // Clean up temp folder
        });
}

// Default task for development
exports.default = gulp.series(minifyScripts, watchFiles);

// Build release task
exports.build = gulp.series(buildRelease);