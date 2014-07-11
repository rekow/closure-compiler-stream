#closure-compiler-stream
Streaming interface for closure compiler.

##Installation
Add to your `devDependencies`:
```javascript
  "dependencies": {...},
  "devDependencies": {
    "closure-compiler-stream": "~0.1.2"
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
    .pipe(gulp.dest('path/to/minifed/js/'));
});
```

##api

```javascript
closure(options)
```
Accepts the same options hash as [closure-compiler](https://www.npmjs.org/package/closure-compiler), and returns a `Readable` stream.
