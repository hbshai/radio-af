var gulp = require('gulp')
  , less = require('gulp-less')
  , path = require('path')
  , concat = require('gulp-concat')
  , del = require('del')
  , jade = require('gulp-jade');


function compileJade(locals) {
  gulp.src(['./jade/index.jade'])
    .pipe(jade({
      locals: locals
    }))
    .pipe(gulp.dest('./www/'))
}

// The Jade task -- compile some (not all, yet) jade templates to html
gulp.task('jade', function() {
  compileJade({})
});


// The LESS task -- find less files and compile them to css
gulp.task('less', function () {
     gulp.src('./less/*.less')
    .pipe(less({
          paths: [ path.join(__dirname, 'less', 'includes') ]
    }))
    .pipe(gulp.dest('./www/css'));
});

gulp.task('clean', function(cb) {
    del(['www/css/style.css'], cb);
});

// Watch all the .less files, then run the less task
gulp.task('watch-less', function() {
    gulp.watch('./less/*.less', ['less']);
});
// Watch some jade for the good of good
gulp.task('watch-jade', function() {
    gulp.watch(['./jade/index.jade'], ['jade']);
    });


// Default will run 'watch-less' and 'less' task
gulp.task('default', ['less', 'jade', 'watch-less', 'watch-jade']);
