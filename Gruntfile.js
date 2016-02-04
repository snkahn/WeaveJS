/*global module */

var libraries = ['react', 'react-dom', 'jquery', 'lodash', 'd3', 'c3', 'react-bootstrap', 'openlayers', 'jszip', 'react-vendor-prefix', 'swfobject-amd'];
var libraries_colon = libraries.map(function (d) { return d + ":"});

module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        ts: {
            default: {
                tsconfig: true
            }
        },
        babel: {
            options: {
                babelrc: ".babelrc"
            },
            dist: {
               files: [{
                   "expand": true,
                   "cwd": "outts/",
                   "src": ["**/*.jsx", "**/*.js"],
                   "dest": "lib/",
                   "ext": ".js"
               }]
           }
        },
        browserify: {
            // default options for browserify
            options: {
                browserifyOptions: {
                    plugin: [['minifyify']]
                },
                transform: ["babelify"],
                external: libraries,
                watch: true
            },
            distlibs: {
                src: ['src/'],
                dest: 'dist/libs.js',
                options: {
                    alias: libraries_colon,
                    external: null,
                    transform: null,
                    browserifyOptions: {
                        debug: false,
                    }
                },
            },
            devlibs: {
                src: ['src/'],
                dest: 'dist/libs.js',
                options: {
                    alias: libraries_colon,
                    external: null,
                    transform: null,
                    browserifyOptions: {
                        debug: true,
                    }
                }
            },
            // this generates a minified ouput of the app without the libs
            dist: {
                files: [{'dist/index.min.js': 'src/index.js'}]
            },
            // generates a non minified output without the libs but with source maps
            dev: {
                options: {
                    browserifyOptions: {
                        debug: true,
                        plugin: [],
                        extensions: ['.jsx']
                    }
                },
                files: [{'dist/index.js': 'src/index.js'}]
            },
        },
        copy: {
            main: {expand: true, flatten: true, cwd: 'src/', src: '**/*.html', dest: 'dist/'},
            css: {expand: true, flatten: true, cwd: 'src/', src: 'css/*.css', dest: 'dist/'},
            olcss: {expand: true, flatten: true, cwd: 'node_modules/openlayers/css', src: 'ol.css', dest: 'dist/'},
            fontawesomecss: {expand: true, flatten: true, cwd: 'node_modules/font-awesome/css', src: 'font-awesome.css', dest: 'dist/css/'},
            fontawesomefont: {expand: true, flatten: true, cwd: 'node_modules/font-awesome/fonts', src: '*', dest: 'dist/fonts/'},
            fonts: {expand: true, flatten: true, cwd: 'node_modules/bootstrap', src: 'fonts/*.*', dest: 'dist/fonts/'},
            images: {expand: true, flatten: true, cwd: 'img/', src: '*', dest: 'dist/img/'},
            weavesessions: {expand: true, flatten: true, cwd: 'weave_sessions', src: "*", dest: "dist/"}
        },
        clean: {
            ts: ["outts"],
            babel: ["lib"],
            dist: ["dist/*.js", "dist/*.css", "dist/*.html"]
        },
    });

    grunt.loadNpmTasks('grunt-ts');
    grunt.loadNpmTasks('grunt-babel');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-minifyify');

    grunt.registerTask('devlibs', ['browserify:devlibs']);
    grunt.registerTask('distlibs', ['browserify:distlibs']);

    grunt.registerTask('default', ['ts', 'babel', 'browserify:dev', 'copy']);
    grunt.registerTask('dist', ['dist', 'browserify:distlibs', 'copy']);
    grunt.registerTask('devall', ['clean', 'default', 'devlibs', 'copy']);
    grunt.registerTask('all', ['clean', 'default', 'distlibs', 'dist']);
};
