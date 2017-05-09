import app from '../../app.js';
import blixt from 'blixt';
import * as K from '../../shared/const.js';
import T from 'blixt/types';

const gameType = T({
	colors: T.arrayOf(T.string),
	activeChoice: [T.string, T.NULL],
	highScore: T.int,
	score: T.int,
	history: T.arrayOf(T.string),
	playerHistory: T.arrayOf(T.string),
	gameOver: T.bool,
	isDisabled: T.bool
}, 'Game');

function randomChoice(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}

const keyMap = {
	49: 'a',
	50: 'b',
	51: 'c',
	52: 'd'
};

function onKeyOnce(fn) {
	let lastFired = null;
	window.onkeydown = function(e) {
		if (lastFired !== e.which) {
			lastFired = e.which;
			fn(e);
		}
	};
	window.onkeyup = function(e) {
		if (e.which === lastFired) {
			lastFired = null;
		}
	};
}

export default blixt.actions({
	start({ actions, state }) {
		state.gameOver = false;
		state.score = 0;
		state.history.length = 0;
		state.playerHistory.length = 0;
		state.activeChoice = null;
		state.isDisabled = true;
		setTimeout(actions.levelUp, K.GAME_STARTUP_TIME);
	},
	playLevel({ state, actions }, index = 0) {
		if (index < state.history.length) {
			state.activeChoice = state.history[index];
			app.audio.playSound(state.activeChoice);
			setTimeout(function() {
				state.activeChoice = null;
				blixt.update('Set active to null');
				setTimeout(actions.playLevel, K.BETWEEN_TIME, index + 1);
			}, K.ACTIVE_TIME);
		}
		else {
			actions.awaitPlayerAction();
		}
	},
	levelUp({ actions, state }) {
		state.playerHistory.length = 0;
		state.history.push(randomChoice(state.colors));
		state.score = state.history.length - 1;
		if (state.score > state.highScore) {
			state.highScore = state.score;
			localStorage.setItem('highScore', state.highScore);
		}
		setTimeout(actions.playLevel, K.LEVEL_STARTUP_TIME);
	},
	awaitPlayerAction({ state, actions }) {
		state.isDisabled = false;
		onKeyOnce(function(e) {
			const key = keyMap[e.which];
			if (key) {
				actions.activateSquare(key);
			}
		});
	},
	gameOver({ state }) {
		state.gameOver = true;
	},
	activateSquare({ state, actions }, key) {
		const index = state.playerHistory.length;
		state.playerHistory.push(key);
		app.audio.playSound(key);
		state.activeChoice = key;
		setTimeout(function() {
			state.activeChoice = null;
			blixt.update('activateSquare [done]');
		}, K.ACTIVE_TIME);

		if (state.playerHistory[index] !== state.history[index]) {
			window.onkeydown = null;
			window.onkeyup = null;
			actions.gameOver();
		}
		if (state.playerHistory.length === state.history.length) {
			window.onkeydown = null;
			window.onkeyup = null;
			if (!state.gameOver) {
				state.isDisabled = true;
				actions.levelUp();
			}
		}
	}
}, gameType);
