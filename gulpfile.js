var gulp = require('gulp');
var gls = require('gulp-live-server');
var inject = require('gulp-inject');

var paths = {
  src: '**/*',
  srcData: 'data/dashboard*.*',
  srcHTML: '*.htm',
  srcCSS: 'css/*.css',
  srcNodeCSS: [
    'node_modules/bootswatch/dist/sandstone/bootstrap.min.css',
    'node_modules/font-awesome/css/font-awesome.min.css',
    'node_modules/dc/dc.min.css',
    'node_modules/mapbox-gl/dist/mapbox-gl.css',
  ],
  srcJS: 'js/*.js',
  srcNodeJS: [
    'node_modules/jquery/dist/jquery.min.js',
    'node_modules/popper.js/dist/umd/popper.min.js',
    'node_modules/bootstrap/dist/js/bootstrap.min.js',
    'node_modules/jquery-csv/src/jquery.csv.min.js',
    'node_modules/crossfilter2/crossfilter.min.js',
    'node_modules/d3/dist/d3.min.js',
    'node_modules/dc/dc.min.js',
    'node_modules/leaflet/dist/leaflet.js',
    'node_modules/dc.leaflet/dc.leaflet.min.js',
    'node_modules/mapbox-gl/dist/mapbox-gl.js',
    'node_modules/mapbox-gl-leaflet/leaflet-mapbox-gl.js',
    'node_modules/colorbrewer/index.js'
  ],
  tmp: 'tmp',
  tmpData: 'tmp/data/',
  tmpIndex: 'tmp/index.htm',
  tmpCSS: 'tmp/css/',
  tmpJS: 'tmp/js',
  dist: 'dist',
  distData: 'dist/data/',
  distIndex: 'dist/index.htm',
  distCSS: 'dist/css/*.css',
  distJS: 'dist/js/*.js'
};

gulp.task('data-tmp', function () {
  return gulp.src(paths.srcData).pipe(gulp.dest(paths.tmpData));
});

gulp.task('html-tmp', function () {
  return gulp.src(paths.srcHTML).pipe(gulp.dest(paths.tmp));
});

gulp.task('cssnode-tmp', function () {
  return gulp.src(paths.srcNodeCSS).pipe(gulp.dest(paths.tmpCSS));
});

gulp.task('css-tmp', function () {
  return gulp.src(paths.srcCSS).pipe(gulp.dest(paths.tmpCSS));
});

gulp.task('jsnode-tmp', function () {
  return gulp.src(paths.srcNodeJS).pipe(gulp.dest(paths.tmpJS));
});

gulp.task('js-tmp', function () {
  return gulp.src(paths.srcJS).pipe(gulp.dest(paths.tmpJS));
});

gulp.task('copy-tmp', gulp.series('data-tmp', 'html-tmp', 'cssnode-tmp', 'css-tmp', 'jsnode-tmp', 'js-tmp'));

gulp.task('injectjs-tmp', function () {
  var target = gulp.src('tmp/*.htm');
  var sources = gulp.src(['tmp/js/jquery.min.js', 'tmp/js/*.js'], { read: false });
  return target.pipe(inject(sources, { relative: true })).pipe(gulp.dest('./tmp'));
});

gulp.task('injectcss-tmp', function () {
  var target = gulp.src('tmp/*.htm');
  var sources = gulp.src('tmp/css/*.css', { read: false });
  return target.pipe(inject(sources, { relative: true })).pipe(gulp.dest('./tmp'));
});

gulp.task('serve-tmp', function () {
  var server = gls.static('tmp', 8080);
  server.start();
});

gulp.task('debug', gulp.series('copy-tmp', 'injectjs-tmp', 'injectcss-tmp', 'serve-tmp'));