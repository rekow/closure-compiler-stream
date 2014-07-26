var cc = require('closure-compiler'),
  through2 = require('through2'),
  tmp = require('temp-write'),
  fs = require('fs'),
  stream = require('stream'),
  exec = require('child_process').exec,

  merge = function (obj1, obj2) {
    for (var k in obj2) {
      if (obj2.hasOwnProperty(k)) {
        obj1[k] = obj2[k];
      }
    }
    return obj1;
  },

  flattenFlags = function (flags) {
    var str = [],
      k, v,
      flatten = function (_k, _v) {
        if (_v === null) {
          str.push('--' + _k);
          return;
        }
        if (typeof _v === 'string') {
          str.push('--' + _k + '="' + _v + '"');
          return;
        }
        if (_v.length && _v.slice) {
          _v.forEach(function (flag) {
            flatten(_k, flag);
          });
          return;
        }
        str.push('--' + _k + '=' + _v);
      };
    for (k in flags) {
      v = flags[k];
      flatten(k, v);
    }
    return str.join(' ');
  };

module.exports = function (options) {
  var files = [],
    proxy = through2.obj(function (file, enc, cb) {
      this.push(file);
      cb();
    }),
    transform;

  transform = through2.obj(function (file, enc, cb) {

    if (!file || file.contents === null) {
      this.push(file);
      return cb();
    }
    if (file.contents instanceof stream.Stream) {
      this.emit('error', 'streaming not supported');
      return cb();
    }

    files.push(file.path);
    cb();
  }, function () {
    var args = [],
      opts = merge({
        js: files
      }, options);

    args.push('java');
    args.push('-jar');
    args.push(opts.jar ? opts.jar : cc.JAR_PATH);

    delete opts.jar;

    args.push(flattenFlags(opts));

    exec(args.join(' '), function (err, stdout, stderr) {
      var filename, file, pathParts;
      if (err) {
        proxy.emit('error', err);
        return;
      }
      console.log('%s', stderr);

      filename = opts.js_output_file || tmp.sync(out);
      file = fs.lstatSync(filename);

      pathParts = filename.split('/');

      file.contents = stdout.toString('utf8');
      file.relative = pathParts.pop();
      file.base = pathParts.join('/');
      file.cwd = process.cwd();

      file.isStream = function () {
        return false;
      };
      file.isBuffer = function () {
        return false;
      };
      file.isNull = function () {
        return file.contents === null;
      };

      proxy.end(file);
    });

  });

  transform.pipe = function () {
    return proxy.pipe.apply(proxy, arguments);
  };

  return transform;
};