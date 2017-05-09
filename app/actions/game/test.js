import blixt from 'blixt';
import test from 'testesterone';
import T from 'blixt/types';
import app from '../../app.js';

T.throws = true;

test('game', function(it) {

	it('initializes game', function(expect) {
		expect(blixt.getState('game', 'activeChoice')).to.equal(null);
		expect(blixt.getState('game', 'score')).to.equal(0);
		expect(blixt.getState('game', 'history')).to.deep.equal([]);
		expect(blixt.getState('game', 'playerHistory')).to.deep.equal([]);
		expect(blixt.getState('game', 'gameOver')).to.equal(false);
		expect(blixt.getState('game', 'isDisabled')).to.equal(true);
	});

})();
