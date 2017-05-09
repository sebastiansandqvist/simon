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

const RAMP_DOWN_TIME = 0.01;

export default actions({
	playSound({ state }, color) {
		const osc = state.ctx.createOscillator();
		osc.connect(state.gainNode);
		osc.type = 'sine';
		osc.frequency.value = freqMap[color];
		state.gainNode.connect(state.ctx.destination);
		osc.start();
		state.gainNode.gain.setValueAtTime(0.4, state.ctx.currentTime);
		setTimeout(function() {
			state.gainNode.gain.setValueAtTime(state.gainNode.gain.value, state.ctx.currentTime);
			state.gainNode.gain.exponentialRampToValueAtTime(0.0001, state.ctx.currentTime + RAMP_DOWN_TIME);
			setTimeout(function() {
				state.gainNode.disconnect();
				osc.stop(state.ctx.currentTime);
			}, RAMP_DOWN_TIME * 1000);
		}, K.ACTIVE_TIME - RAMP_DOWN_TIME * 1000);
	}
}, audioType);
