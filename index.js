var cc = require('closure-compiler'),
  through2 = require('through2'),
  stream = require('stream'),

  merge = function (obj1, obj2) {
    for (var k in obj2) {
      if (obj2.hasOwnProperty(k)) {
        obj1[k] = obj2[k]
      }
    }
    return obj1;
  };

module.exports = function (options) {
  var files = [],
    writer = new stream.PassThrough(),
    transform;

  transform = through2.obj(function (file, enc, cb) {
    if (file.isNull()) {
      this.push(file);
      return cb();
    }
    if (file.isStream()) {
      this.emit('error', 'streaming not supported');
      return cb();
    }

    files.push(file.contents.toString('utf8'));
    cb();
  }, function () {
    var opts = merge({}, options);
    cc.compile(files.join('\n'), opts, function (err, out) {
      if (err) {
        writer.emit('error', err);
        return;
      }
      writer.write(out);
      writer.end();
    });
  });

  transform.pipe = function () {
    return writer.pipe.apply(writer, arguments)
  };

  return transform;
};