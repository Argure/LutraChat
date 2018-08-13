/* global module */
/* global require */

var Fiber = require('fibers');
var sass = require('node-sass');

module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    sass: {
      options: {
        fiber: Fiber,
        implementation: sass,
        sourceMap: false,
        outputStyle: 'expanded'
      },
      dist: {
        files: { 'app/css/lutrachat.css': 'scss/lutrachat.scss' }
      }
    },

    postcss: {
      options: {
        map: false,
        processors: [require('autoprefixer')({ browsers: ['last 2 versions'] })]
      },
      dist: {
        src: [
          'app/css/*.css',
          '!*.min.css'
        ]
      }
    },

    cssmin: {
      options: { level: { 2: {} } },
      target: {
        files: [
          {
            cwd: 'app/css',
            dest: 'app/css',
            expand: true,
            ext: '.min.css',
            src: [
              '*.css',
              '!*.min.css'
            ]
          }
        ]
      }
    },

    uglify: {
      options: { mangle: false },
      my_target: {
        files: {
          'app/js/reconnecting-websocket.min.js': 'js/vendor/reconnecting-websocket.js',
          'app/js/helpers.min.js': 'js/helpers.js',
          'app/js/mixer.min.js': 'js/mixer.js',
          'app/js/twitch.min.js': 'js/twitch.js',
          'app/serviceworker.js': 'js/serviceworker.js'
        }
      }
    },

    jsdoc: {
      dist: {
        src: [
          'js/twitch.js'
        ]
      }
    },

    copy: {
      js: {
        files: [
          {
            cwd: 'node_modules/jquery/dist/',
            dest: 'app/js',
            expand: true,
            src: [
              'jquery.min.js',
              'jquery.min.map'
            ]
          },
          {
            cwd: 'js/vendor',
            dest: 'app/js',
            expand: true,
            src: [
              'tmi.js.map',
              'tmi.min.js'
            ]
          }
        ]
      }
    },

    image_resize: {
      favicon16: {
        options: {
          height: 16,
          overwrite: true,
          width: 16
        },
        files: { 'app/assets/icon-16x16.png': 'app/assets/icon.png' }
      },
      favicon32: {
        options: {
          height: 32,
          overwrite: true,
          width: 32
        },
        files: { 'app/assets/icon-32x32.png': 'app/assets/icon.png' }
      },
      appletouch: {
        options: {
          height: 92,
          overwrite: true,
          width: 92
        },
        files: { 'app/assets/apple=touch-icon.png': 'app/assets/icon.png' }
      },
      mstile: {
        options: {
          height: 92,
          overwrite: true,
          width: 92
        },
        files: { 'app/assets/tile.png': 'app/assets/icon.png' }
      }
    }
  });

  grunt.loadNpmTasks('grunt-sass');
  grunt.loadNpmTasks('grunt-postcss');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-image-resize');

  grunt.registerTask('build', [
    'sass',
    'postcss',
    'cssmin',
    'uglify'
  ]);
  grunt.registerTask('dist', [
    'sass',
    'postcss',
    'cssmin',
    'uglify',
    'jsdoc',
    'copy',
    'image_resize'
  ]);
};
