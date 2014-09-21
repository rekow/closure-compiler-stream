var through2 = require('through2'),
  tmp = require('temp-write'),
  fs = require('fs'),
  path = require('path'),
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
  },

  flattenModules = function (modules) {
    var str = [];

    modules.forEach(function (files) {
      str.push('--module ' + files.shift());
      str.push('--js ' + files.join(' --js '));
    });

    return str.join(' ');
  };

module.exports = function (options) {
  var files = [],
    proxy = through2.obj(function (file, enc, cb) {
      this.push(file);
      cb();
    }),
    target = options.js_output_file,
    modules = options.module || [],
    rootDir,
    transform;

  delete options.js_output_file;
  delete options.module;

  transform = through2.obj(function (file, enc, cb) {

    var dir;

    if (!file || file.contents === null) {
      this.push(file);
      return cb();
    }
    if (file.contents instanceof stream.Stream) {
      this.emit('error', 'streaming not supported');
      return cb();
    }

    dir = path.dirname(file.path);
    rootDir = rootDir ? dir.length < rootDir.length ? dir : rootDir : dir;

    files.push(file.path);
    cb();
  }, function () {
    var args = [],
      opts = merge(modules.length ? {} : {
        js: files
      }, options);

    args.push('java');
    args.push('-jar');
    args.push(opts.jar ? opts.jar : path.resolve('./lib/compiler.jar'));

    delete opts.jar;

    if (!opts.create_source_map) {
      opts.create_source_map = tmp.sync('');
    }

    if (!opts.source_map_format) {
      opts.source_map_format = 'V3';
    }

    args.push(flattenFlags(opts));
    args.push(flattenModules(modules));

    exec(args.join(' '), function (err, stdout, stderr) {
      var filename, file, pathParts;
      if (err) {
        proxy.emit('error', err);
        return;
      }
      console.log('%s', stderr);

      filename = target || tmp.sync(stdout);

      file = fs.existsSync(filename) ? fs.lstatSync(filename) : {};

      pathParts = filename.split('/');

      file.path = filename;
      file.cwd = process.cwd();
      file.relative = pathParts.pop();
      file.base = target ? pathParts.join('/') : file.cwd;
      file.contents = stdout instanceof Buffer ? stdout : new Buffer(stdout);

      try {
        file.sourceMap = JSON.parse(fs.readFileSync(opts.create_source_map));
        file.sourceMap.sources = file.sourceMap.sources.map(function (src) {
          return src.replace(rootDir + '/', '');
        });
      } catch (e) {}

      file.isStream = file.isDirectory = function () {
        return false;
      };
      file.isBuffer = function () {
        return file.contents instanceof Buffer;
      };
      file.isNull = function () {
        return file.contents === null;
      };

      if (target) {
        fs.createWriteStream(path.resolve(target)).end(file.contents);
      }

      proxy.end(file);
    });

  });

  transform.pipe = function () {
    return proxy.pipe.apply(proxy, arguments);
  };

  return transform;
};