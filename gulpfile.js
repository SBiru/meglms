'use strict';
var p = require('./package.json');
var gulp = require('gulp');
var requireDir = require('require-dir');
var uglifycss = require('gulp-uglifycss');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');
var rename = require('gulp-rename');
var removeFiles = require('gulp-remove-files');
var dest = require('gulp-dest');
var inject = require('gulp-inject');
var git = require('gulp-git');

var dir = requireDir('./gulp/files');
var jsAngularLibs = dir.jsAngularLibs;
var jsUtil = dir.jsUtil;
var jsAngularControllers = dir.jsAngularControllers;
var jsAngularServices = dir.jsAngularServices;
var jsAngularDirectives = dir.jsAngularDirectives;
var jsAppFabric = dir.jsAppFabric;

var scripts = jsUtil.concat(
    jsAngularLibs,
    jsAngularControllers,
    jsAngularServices,
    jsAngularDirectives
);
var fabricScripts = jsAppFabric;
var cssFiles=dir.cssFiles;

gulp.task('scripts',['fabric'], function () {
    gulp.src('./public/build/meglms.*.js*')
        .pipe(removeFiles());
    return gulp.src(scripts,{ base: 'public/js' })
        .pipe(sourcemaps.init())
        .pipe(concat('/public/build/meglms.'+ p.version+'.min.js'))
        .pipe(sourcemaps.write({includeContent: false, sourceRoot: '/public/js'}))
    .pipe(gulp.dest('./'));
});
gulp.task('fabric', function () {
  //  return gulp.src(fabricScripts)
     //   .pipe(concat('./public/js/directives/app_fabric'))
        //.pipe(uglify())
      //  .pipe(rename('build.js'))
      //  .pipe(gulp.dest('./public/js/directives/app_fabric'))
      //  .pipe(git.add());
});
gulp.task('styles', function () {
    gulp.src('./public/build/meglms.*.css*')
        .pipe(removeFiles());
    return gulp.src(cssFiles)
        .pipe(sourcemaps.init())
        .pipe(concat('/public/build/meglms.'+ p.version+'.min.css'))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('./'));

});
gulp.task('inject',['styles','scripts'],function(){
    var target = gulp.src(dir.targetHtml,{base:'./public/views'});

    var sources = gulp.src(['./public/build/meglms.'+ p.version+'.min.js','./public/build/meglms.'+ p.version+'.min.css'], {read: false})
        .pipe(git.add());
    return target.pipe(inject(sources),{relative: true})
        .pipe(gulp.dest('./public/views'))
});
gulp.task('watch',function(){
    gulp.watch(cssFiles, ['styles','inject']);
    gulp.watch(scripts, ['fabric','scripts','inject']);

});
gulp.task('watch',function(){
    gulp.watch(cssFiles, ['styles']);
    gulp.watch(scripts, ['scripts']);

});

gulp.task('default', ['inject','watch']);
//gulp.task('default', ['fabric','scripts','styles','inject']);
