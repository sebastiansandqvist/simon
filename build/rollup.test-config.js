const nodeResolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const buble = require('rollup-plugin-buble');

module.exports = {
	// entry: determined by cli (from /app/actions/[action]/test.js)
	dest: 'test/tmp.bundle.js',
	format: 'iife',
	plugins: [
		nodeResolve({ browser: true }),
		commonjs(),
		buble()
	]
};
