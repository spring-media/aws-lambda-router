const gulp = require('gulp');
const jasmine = require('gulp-jasmine');

gulp.task('test', () =>
    gulp.src('test/*.spec.js')
        // gulp-jasmine works on filepaths so you can't have any plugins before it
        .pipe(jasmine({
            verbose: true,
            includeStackTrace: true
        }))
);

