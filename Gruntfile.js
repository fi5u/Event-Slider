module.exports = function(grunt) {

	grunt.initConfig({

		// Import package manifest
		pkg: grunt.file.readJSON("jquery.event-slider.json"),

		// Banner definitions
		meta: {
			banner: "/*\n" +
				" *  <%= pkg.title || pkg.name %> - v<%= pkg.version %>\n" +
				" *  <%= pkg.description %>\n" +
				" *  <%= pkg.homepage %>\n" +
				" *\n" +
				" *  Made by <%= pkg.author.name %>\n" +
				" *  Under <%= pkg.licenses[0].type %> License\n" +
				" */\n"
		},

		// Concat definitions
		concat: {
			dist: {
				src: ["src/jquery.event-slider.js"],
				dest: "dist/jquery.event-slider.js"
			},
			options: {
				banner: "<%= meta.banner %>"
			}
		},

		// Lint definitions
		jshint: {
			files: ["src/jquery.event-slider.js"],
			options: {
                'boss': true,
                'curly': true,
                'eqeqeq': true,
                'eqnull': true,
                'expr': true,
                'immed': true,
                'noarg': true,
                'onevar': true,
                'quotmark': 'single',
                'smarttabs': true,
                'trailing': true,
                'unused': true,
                'node': true
			}
		},

		// Minify definitions
		uglify: {
			my_target: {
				src: ["dist/jquery.event-slider.js"],
				dest: "dist/jquery.event-slider.min.js"
			},
			options: {
				banner: "<%= meta.banner %>"
			}
		},

        // Compass definitions
        compass: {
            target: {
                options: {
                    sassDir: "src/scss",
                    cssDir: "dist",
                    environment: "development",
                    outputStyle: "nested"
                }
            },
            target2: {
                options: {
                    sassDir: "demo",
                    cssDir: "demo",
                    environment: "development",
                    outputStyle: "expanded"
                }
            }
        },

        // Watch definitions
        watch: {
            options: {
                livereload: true,
                port: 9001
            },
            target: {
                css: {
                    files: ["src/scss/style.scss"],
                    tasks: ["compass"]
                },
                html: {
                    files: ["demo/index.html"],
                    tasks: ["compass"]
                },
                js: {
                    files: ["src/jquery.event-slider.js"],
                    tasks: ["default"]
                }
            }
        },

        connect: {
            options: {
                port: 9001,
                livereload: 35729,
                hostname: "localhost",
                base: "demo"
            },
            livereload: {
                options: {
                    open: true,
                    base: [
                        "demo"
                    ]
                }
            }
        },

	});

	grunt.loadNpmTasks("grunt-contrib-concat");
	grunt.loadNpmTasks("grunt-contrib-jshint");
	grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-compass");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-contrib-connect");



	grunt.registerTask("default", ["jshint", "concat", "uglify", "compass"]);
	grunt.registerTask("travis", ["jshint"]);
    grunt.registerTask("watch", ["default", "connect", "watch"]);
};
