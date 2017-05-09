export default function gameFactory() {
	return {
		colors: ['a', 'b', 'c', 'd'],
		activeChoice: null,
		highScore: parseInt(localStorage.getItem('highScore'), 10) || 0,
		score: 0,
		history: [],
		playerHistory: [],
		gameOver: false,
		isDisabled: true
	};
}