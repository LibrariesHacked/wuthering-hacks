var gulp = require('gulp');
var inject = require('gulp-inject');

var paths = {
  src: '**/*',
  srcHTML: '*.htm',
  srcCSS: 'css/*.css',
  srcNodeCSS: [
    'node_modules/bootswatch/dist/sandstone/bootstrap.min.css',
    'node_modules/font-awesome/css/font-awesome.min.css',
    'node_modules/dc/dc.min.css'
  ],
  srcJS: 'js/*.js',
  srcNodeJS: [
    'node_modules/jquery/dist/jquery.min.js',
    'node_modules/popper.js/dist/umd/popper.min.js',
    'node_modules/bootstrap/dist/js/bootstrap.min.js',
    'node_modules/jquery-csv/src/jquery.csv.min.js',
    'node_modules/crossfilter2/crossfilter.min.js',
    'node_modules/d3/dist/d3.min.js',
    'node_modules/dc/dc.min.js'
  ],
  tmp: 'tmp',
  tmpIndex: 'tmp/index.htm',
  tmpCSS: 'tmp/css/',
  tmpJS: 'tmp/js',
  dist: 'dist',
  distIndex: 'dist/index.htm',
  distCSS: 'dist/css/*.css',
  distJS: 'dist/js/*.js'
};

gulp.task('html', function () {
  return gulp.src(paths.srcHTML).pipe(gulp.dest(paths.tmp));
});

gulp.task('cssnode', function () {
  return gulp.src(paths.srcNodeCSS).pipe(gulp.dest(paths.tmpCSS));
});

gulp.task('css', function () {
  return gulp.src(paths.srcCSS).pipe(gulp.dest(paths.tmpCSS));
});

gulp.task('jsnode', function () {
  return gulp.src(paths.srcNodeJS).pipe(gulp.dest(paths.tmpJS));
});

gulp.task('js', function () {
  return gulp.src(paths.srcJS).pipe(gulp.dest(paths.tmpJS));
});

gulp.task('copy', gulp.series('html', 'cssnode', 'css', 'jsnode', 'js'));

gulp.task('injectjs', function () {
  var target = gulp.src('tmp/*.htm');
  var sources = gulp.src('tmp/js/*.js', { read: false, relative: true });
  return target.pipe(inject(sources)).pipe(gulp.dest('./tmp'));
});

gulp.task('injectcss', function () {
  var target = gulp.src('tmp/*.htm');
  var sources = gulp.src('tmp/js/*.css', { read: false, relative: true });
  return target.pipe(inject(sources)).pipe(gulp.dest('./tmp'));
});

gulp.task('tmp', gulp.series('copy', 'injectjs', 'injectcss'));