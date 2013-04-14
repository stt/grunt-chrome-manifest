'use strict';

var path = require('path');

module.exports = function (grunt) {

  var _ = grunt.util._;

  grunt.registerMultiTask('chromeManifest', '', function () {
    var options = this.options();
    var src = this.data.src;
    var dest = this.data.dest;
    var manifest = grunt.file.readJSON(path.join(src, 'manifest.json'));
    var background = path.join(dest, options.background || 'background.js');
    var buildnumber = manifest.version.split('.');
    var uglifyName = options.uglify || 'uglify';
    var cssminName = options.cssmin || 'cssmin';
    var concat = grunt.config('concat') || {};
    var uglify = grunt.config(uglifyName) || {};
    var cssmin = grunt.config(cssminName) || {};

    // update concat config for scripts in background field.
    concat.background = {
      src: [],
      dest: background
    };

    _.each(manifest.background.scripts, function (script) {
      concat.background.src.push(path.join(src, script));
    });

    // update uglify config for concated background.js.
    uglify[background] = background;

    // update uglify and css config for content scripts field.
    _.each(manifest.content_scripts, function (contentScript) {
      _.each(contentScript.js, function (js) {
        uglify[path.join(dest, js)] = path.join(src, js);
      });

      _.each(contentScript.css, function (css) {
        cssmin[path.join(dest, css)] = path.join(src, css);
      });
    });

    // update grunt configs.
    grunt.config('concat', concat);
    grunt.config(cssminName, cssmin);
    grunt.config(uglifyName, uglify);

    // set updated build number to manifest on dest.
    if (options.buildnumber) {
      var versionUp = function (numbers, index) {
        if (!numbers[index]) {
          throw 'Build number overflow.' + numbers;
        }
        if (numbers[index] + 1 <= 65535) {
          numbers[index]++;
          return numbers.join('.');
        } else {
          versionUp(numbers, ++index);
        }
      };
      manifest.version = versionUp(buildnumber, buildnumber.length - 1);
      grunt.file.write(path.join(src, 'manifest.json'), JSON.stringify(manifest, null, 2));
    }

    // set updated background script list to manifest on dest.
    manifest.background.scripts = [options.background || 'background.js'];

    // write updated manifest to dest path
    grunt.file.write(path.join(dest, 'manifest.json'), JSON.stringify(manifest, null, 2));
  });

};
