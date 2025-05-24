'use strict';

//npm install gulp gulp-minify-css gulp-uglify gulp-clean gulp-cleanhtml gulp-jshint gulp-strip-debug gulp-zip --save-dev

const { src, dest, series, parallel, watch } = require('gulp');
const del = require('del');
const cleanhtml = require('gulp-cleanhtml');
// minifycss = require('gulp-minify-css'),
const jshint = require('gulp-jshint');
const stripDebug = require('gulp-strip-debug').default;
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');
const jasmine = require('gulp-jasmine');
const jeditor = require('gulp-json-editor');
const zip = require('gulp-zip');
const terser = require('gulp-terser');
const babel = require('gulp-babel');

// Clean build directory
function clean() {
	return del(['build/**/*']);
}

// Copy static folders to build directory
function assets() {
	return src(['src/icons/**/*', 'src/_locales/**/*'], { base: 'src' })
		.pipe(dest('build'));
}

// Copy and compress HTML files
function html() {
	return src('src/*.html')
		.pipe(cleanhtml())
		.pipe(dest('build'));
}

// Run scripts through JSHint
function jshintTask() {
	return src('src/scripts/*.js')
		.pipe(jshint())
		.pipe(jshint.reporter('default'));
}

// Run test script with jasmine
function test() {
	return src('test/*.js')
		.pipe(jasmine());
}

// Process all scripts
function scripts() {
	// Process main scripts
	return src(['src/scripts/**/*.js', 'src/chrome/**/*.js'])
		.pipe(babel({
			presets: ['@babel/preset-env']
		}))
		.pipe(stripDebug())  // Strip console.log and debugger statements
		.pipe(terser({
			compress: {
				drop_console: true,  // Remove console.* statements
				drop_debugger: true  // Remove debugger statements
			},
			mangle: true
		}))
		.pipe(dest('build/scripts'));
}

// Process manifest
function manifest() {
	return src('src/manifest.json')
		.pipe(jeditor(function(json) {
			// You can modify the manifest here if needed
			return json;
		}))
		.pipe(dest('build'));
}

// Minify styles
function styles() {
	// return gulp.src('src/styles/**/*.css')
	// 	.pipe(minifycss({root: 'src/styles', keepSpecialComments: 0}))
	// 	.pipe(gulp.dest('build/styles'));
	return src('src/styles/**')
		.pipe(dest('build/styles'));
}

// Package extension
function packageExtension() {
	const manifest = require('./src/manifest.json');
	const distFileName = `avim-chrome-${manifest.version}.zip`;
	return src('build/**/*')
		.pipe(zip(distFileName))
		.pipe(dest('dist'));
}

// Watch files
function watchFiles() {
	watch('src/scripts/*.js', scripts);
	watch('src/*.html', html);
	watch('src/manifest.json', manifest);
	watch(['src/icons/**/*', 'src/_locales/**/*'], assets);
}

// Define complex tasks
const build = series(
	clean,
	parallel(
		series(jshintTask, scripts),
		html,
		assets,
		manifest,
		styles
	),
	packageExtension
);

// Export tasks
exports.clean = clean;
exports.scripts = scripts;
exports.html = html;
exports.assets = assets;
exports.manifest = manifest;
exports.packageExtension = packageExtension;
exports.watch = watchFiles;
exports.test = test;
exports.build = build;
exports.default = build;
