const gulp = require('gulp');
const del = require('del');
const install = require('gulp-install');
const jasmine = require('gulp-jasmine');

gulp.task('test', () =>
    gulp.src('test/*.spec.js')
        // gulp-jasmine works on filepaths so you can't have any plugins before it
        .pipe(jasmine({
            verbose: true,
            includeStackTrace: true
        }))
);

