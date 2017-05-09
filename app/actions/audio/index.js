import { actions } from 'blixt';
import T from 'blixt/types';
import * as K from '../../shared/const.js';

const audioType = T({
	ctx: T.any,
	oscillator: T.any,
	gainNode: T.any
});

const freqMap = {
	a: 392,
	b: 523.25,
	c: 659.25,
	d: 783.99
};

export default actions({
	playSound({ state }, color) {
		const osc = state.ctx.createOscillator();
		osc.connect(state.gainNode);
		osc.type = 'sine';
		osc.frequency.value = freqMap[color];
		osc.start(state.ctx.currentTime);
		state.gainNode.gain.exponentialRampToValueAtTime(1, state.ctx.currentTime + 0.01);
		state.gainNode.connect(state.ctx.destination);
		setTimeout(function() {
			state.gainNode.gain.exponentialRampToValueAtTime(0.0001, state.ctx.currentTime + 0.01);
			state.gainNode.disconnect();
			osc.stop(state.ctx.currentTime);
		}, K.ACTIVE_TIME);
	}
}, audioType);
