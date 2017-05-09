import test from 'testesterone';
import T from 'blixt/types';
import audioActions from './';
import audioFactory from '../../factories/audio.js';

T.throws = true;

test('audio', function(it) {

	// todo: figure out how to test whether sound is playing
	it('works', function(expect) {
		expect(function() {
			audioActions.bindTo(audioFactory()).playSound('a');
		}).to.not.explode();
	});

})();
