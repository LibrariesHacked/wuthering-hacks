var gulp = require('gulp');
var gls = require('gulp-live-server');
var htmlclean = require('gulp-htmlclean');
var cleanCSS = require('gulp-clean-css');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var inject = require('gulp-inject');
var del = require('del');
var ghpages = require('gh-pages');

var paths = {
  src: '**/*',
  srcData: 'data/dashboard*.*',
  srcHTML: '*.html',
  srcCNAME: 'CNAME',
  srcCSS: 'css/*.css',
  srcNodeCSS: [
    'node_modules/bootswatch/dist/materia/bootstrap.min.css',
    'node_modules/font-awesome/css/font-awesome.min.css',
    'node_modules/dc/dc.min.css',
    'node_modules/mapbox-gl/dist/mapbox-gl.css',
    'node_modules/leaflet/dist/leaflet.css'
  ],
  srcMapStyle: 'style.json',
  srcFonts: 'node_modules/font-awesome/fonts/*.*',
  srcJS: 'js/*.js',
  srcNodeJS: [
    'node_modules/jquery/dist/jquery.js',
    'node_modules/popper.js/dist/umd/popper.min.js',
    'node_modules/bootstrap/dist/js/bootstrap.js',
    'node_modules/jquery-csv/src/jquery.csv.js',
    'node_modules/crossfilter2/crossfilter.js',
    'node_modules/d3/dist/d3.js',
    'node_modules/dc/dc.js',
    'node_modules/leaflet/dist/leaflet.js',
    'node_modules/dc.leaflet/dc.leaflet.js',
    'node_modules/mapbox-gl/dist/mapbox-gl.js',
    'node_modules/mapbox-gl-leaflet/leaflet-mapbox-gl.js',
    'node_modules/colorbrewer/index.js'
  ],
  tmp: 'tmp',
  tmpData: 'tmp/data/',
  tmpCSS: 'tmp/css/',
  tmpFonts: 'tmp/fonts/',
  tmpJS: 'tmp/js',
  dist: 'dist',
  distData: 'dist/data/',
  distCSS: 'dist/css/',
  distFonts: 'dist/fonts/',
  distJS: 'dist/js/'
};

gulp.task('data', function () {
  return gulp.src(paths.srcData)
    .pipe(gulp.dest(paths.tmpData));
});

gulp.task('data:dist', function () {
  return gulp.src(paths.srcData)
    .pipe(gulp.dest(paths.distData));
});

gulp.task('html', function () {
  return gulp.src(paths.srcHTML)
    .pipe(gulp.dest(paths.tmp));
});

gulp.task('html:dist', function () {
  return gulp.src(paths.srcHTML)
    .pipe(htmlclean())
    .pipe(gulp.dest(paths.dist));
});

gulp.task('cname:dist', function () {
  return gulp.src(paths.srcCNAME)
    .pipe(gulp.dest(paths.dist));
});

gulp.task('cssnode', function () {
  return gulp.src(paths.srcNodeCSS)
    .pipe(gulp.dest(paths.tmpCSS));
});

gulp.task('cssnode:dist', function () {
  return gulp.src(paths.srcNodeCSS)
    .pipe(concat('packages.min.css'))
    .pipe(cleanCSS())
    .pipe(gulp.dest(paths.distCSS));
});

gulp.task('css', function () {
  return gulp.src(paths.srcCSS)
    .pipe(gulp.dest(paths.tmpCSS));
});

gulp.task('css:dist', function () {
  return gulp.src(paths.srcCSS)
    .pipe(concat('style.min.css'))
    .pipe(cleanCSS())
    .pipe(gulp.dest(paths.distCSS));
});

gulp.task('mapstyle', function () {
  return gulp.src(paths.srcMapStyle)
    .pipe(gulp.dest(paths.tmp));
});

gulp.task('mapstyle:dist', function () {
  return gulp.src(paths.srcMapStyle)
    .pipe(gulp.dest(paths.dist));
});

gulp.task('fonts', function () {
  return gulp.src(paths.srcFonts)
    .pipe(gulp.dest(paths.tmpFonts));
});

gulp.task('fonts:dist', function () {
  return gulp.src(paths.srcFonts)
    .pipe(gulp.dest(paths.distFonts));
});

gulp.task('jsnode', function () {
  return gulp.src(paths.srcNodeJS)
    .pipe(gulp.dest(paths.tmpJS));
});

gulp.task('jsnode:dist', function () {
  return gulp.src(paths.srcNodeJS)
    .pipe(concat('packages.min.js'))
    .pipe(gulp.dest(paths.distJS));
});

gulp.task('js', function () {
  return gulp.src(paths.srcJS)
    .pipe(gulp.dest(paths.tmpJS));
});

gulp.task('js:dist', function () {
  return gulp.src(paths.srcJS)
    .pipe(concat('script.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest(paths.distJS));
});

gulp.task('copy', gulp.series('data', 'html', 'mapstyle', 'fonts', 'cssnode', 'css', 'jsnode', 'js'));

gulp.task('copy:dist', gulp.series('data:dist', 'cname:dist', 'html:dist', 'mapstyle:dist', 'fonts:dist', 'cssnode:dist', 'css:dist', 'jsnode:dist', 'js:dist'));

gulp.task('inject', function () {
  var target = gulp.src('tmp/*.html');
  var sourcejs = gulp.src(['tmp/js/jquery.js', 'tmp/js/crossfilter.js', 'tmp/js/d3.js', 'tmp/js/dc.js', 'tmp/js/leaflet.js', 'tmp/js/mapbox-gl.js', 'tmp/js/*.js'], { read: false });
  var sourcecss = gulp.src('tmp/css/*.css', { read: false });
  return target
    .pipe(inject(sourcecss, { relative: true }))
    .pipe(inject(sourcejs, { relative: true }))
    .pipe(gulp.dest('./tmp'));
});

gulp.task('inject:dist', function () {
  var target = gulp.src('dist/*.html');
  var sourcejs = gulp.src(['dist/js/*.js'], { read: false });
  var sourcecss = gulp.src('dist/css/*.css', { read: false });
  return target
    .pipe(inject(sourcecss, { relative: true }))
    .pipe(inject(sourcejs, { relative: true }))
    .pipe(gulp.dest('./dist'));
});

gulp.task('serve', function () {
  var server = gls.static('tmp', 8080);
  server.start();
});

gulp.task('debug', gulp.series('copy', 'inject', 'serve'));

gulp.task('build', gulp.series('copy:dist', 'inject:dist'));

gulp.task('clean', function () {
  return del([paths.tmp, paths.dist]);
});

gulp.task('deploy', function () {
  return ghpages.publish('dist');
});
