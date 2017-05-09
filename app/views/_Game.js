import app from '../app.js';
import blixt from 'blixt';
import h from 'mithril/hyperscript';

export default function Game() {
	app.game.start();
	const colors = blixt.getState('game', 'colors');
	return {
		view() {
			const state = blixt.getState('game');
			const score = 'Score: ' + state.score;
			const highScore = 'High score: ' + state.highScore;
			const gameOver = state.gameOver ? h('.GameOver', 'Game over', h('button.right', { onclick: app.game.start }, 'Play again')) : null;
			return [
				h('.Game',
					h('h1.left', score),
					h('h1.right', highScore),
					h('.Colors',
						colors.map(function(color, i) {
							const className = [
								color,
								color === state.activeChoice ? 'active' : '',
								state.isDisabled ? 'disabled' : ''
							].join(' ');
							return h('.Color', {
								className,
								onclick() {
									if (!state.isDisabled) {
										app.game.activateSquare(color);
									}
								}
							}, i + 1);
						})
					),
					gameOver
				)
			];
		}
	};
}