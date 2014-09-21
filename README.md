#closure-compiler-stream
Streaming interface for closure compiler.

##Installation
Add to your `devDependencies`:
```javascript
  "dependencies": {...},
  "devDependencies": {
    "closure-compiler-stream": "~0.1.13"
  },
  ...
```
or install directly:
```javascript
npm install --save-dev closure-compiler-stream
```

then import in your build script:
```javascript
var closure = require('closure-compiler-stream');
```

##Usage
As a simple streaming compiler:
```javascript
var closure = require('closure-compiler-stream'),
  fs = require('fs');

// As an intermediary step in a flow
fs.createReadStream('path/to/js/src')
  .pipe(closure())
  .pipe(fs.createWriteStream('path/to/minified.js'));

// As the terminus in a flow
fs.createReadStream('path/to/js/src')
  .pipe(closure({
    js_output_file: 'path/to/minified.js'
  }));
```

With streaming build tools like [gulp](https://github.com/gulpjs/gulp/):
```javascript
var gulp = require('gulp'),
  closure = require('closure-compiler-stream'),
  sourcemaps = require('gulp-sourcemaps');

// Basic compile
gulp.task('closure', function () {
  return gulp.src('path/to/js/*.js')
    .pipe(closure())
    .pipe(gulp.dest('path/to/minified/js/'));
});

// With sourcemaps
gulp.task('closure:sourcemap', function () {
  return gulp.src('path/to/js/*.js')
    .pipe(sourcemaps.init())
    .pipe(closure())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('path/to/minified/js/'));
});
```

##API

```javascript
var writableStream = closure(options);
```
`options` is a map of [flags](https://github.com/steida/gulp-closure-compiler/blob/master/flags.txt) to invoke the compiler with. Options accepts one additional key `jar`, which can be a string path to a Closure Compiler jar file - use this to override the version of Closure Compiler to use.

To specify modules use the following schema:
```javascript
module: [
  ['module_name:#files:deps:', 'sourceFile1.js', 'sourceFile2.js']
];
```
which would be outputted as the flags:
```
--module module_name:#files:deps: --js sourceFile1.js --js sourceFile2.js
```

Returns a `Writable` stream.
