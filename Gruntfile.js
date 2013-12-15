module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),

    concat: {
      basic: {
        src: [
          "js/models/*.js",
          "js/views/*.js",
        ],
        dest: "js/build/production.js"
      },
      extras: {
        src: "styles/*.css",
        dest: "styles/style.css"
      }
    },

    uglify: {
      build: {
        src: "js/build/production.js",
        dest: "js/build/production.min.js"
      }
    }
  });

  grunt.loadNpmTasks("grunt-contrib-concat");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.registerTask("default", ["concat", "uglify"]);
};
