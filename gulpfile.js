var gulp = require('gulp'),
    compass = require('gulp-compass'),
    gutil = require('gulp-util'),
    jshint = require('gulp-jshint'),
    browserSync = require('browser-sync').create();

gulp.task('compass', function() {

    // process.chdir('nurvey/static/assets/');
    // gutil.log(process.cwd());

    gulp.src('nurvey/static/assets/sass/*.scss')
        // .on('end', function() {gutil.log(process.cwd())} )
        .pipe(compass({
            config_file: 'nurvey/static/assets/config.rb',
            sass: 'nurvey/static/assets/sass',
            css: 'nurvey/static/assets/stylesheets',
            font: 'nurvey/static/assets/fonts'
        }))
        .pipe(gulp.dest('nurvey/static/assets/stylesheets'))
        .pipe(browserSync.stream());
});

gulp.task('lint', function() {
    return gulp.src('js/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('watch', function() {
    browserSync.init({
        proxy: 'localhost:8000'
    });
    gulp.watch('nurvey/static/assets/sass/*.scss', ['compass']);
    gulp.watch('nurvey/static/templates/**/*.html').on('change', browserSync.reload);
    gulp.watch('nurvey/static/assets/javascripts/*/*.js', ['lint']);
});

gulp.task('default', ['watch', 'compass', 'lint']);
