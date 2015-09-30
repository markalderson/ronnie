module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    coffee: {
      compile: {
        files: {
          '<%= pkg.name %>.js': '<%= pkg.name %>.coffee',
          'test/<%= pkg.name %>.js': 'test/<%= pkg.name %>.coffee'
        }
      }
    },
    concat: {
      options: {
        separator: '\n',
      },
      dist: {
        src: ['node_modules/qlite/qlite.js', 'ronnie.js'],
        dest: 'ronnie.js',
      },
    },
    karma: {
      unit: {
        configFile: 'karma-conf.js'
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> v. <%= pkg.version %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: '<%= pkg.name %>.js',
        dest: '<%= pkg.name %>.min.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('compile', ['coffee', 'concat']);
  grunt.registerTask('test', ['karma']);
  grunt.registerTask('build', ['uglify']);
  grunt.registerTask('default', ['compile', 'test', 'build']);
};