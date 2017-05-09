const nodeResolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const buble = require('rollup-plugin-buble');
const replace = require('rollup-plugin-replace');

module.exports = {
	// entry: determined by cli (from /app/actions/[action]/test.js)
	dest: 'test/tmp.bundle.js',
	format: 'iife',
	moduleName: 'memoryGameTests',
	plugins: [
		nodeResolve({ browser: true }),
		commonjs(),
		replace({
			'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
		}),
		buble()
	]
};