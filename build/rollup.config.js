const nodeResolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const buble = require('rollup-plugin-buble');
const replace = require('rollup-plugin-replace');
const uglify = require('rollup-plugin-uglify');

const config = {
	entry: 'app/app.js',
	dest: 'public/js/app.js',
	format: 'iife',
	moduleName: 'memoryGame',
	plugins: [
		nodeResolve({ browser: true }),
		commonjs(),
		replace({
			'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
		}),
		buble()
	]
};

if (process.env.NODE_ENV === 'production') {
	config.plugins.push(uglify());
}

module.exports = config;
