import gameActions from '../../actions/game';
import gameFactory from '../../factories/game';

const gameState = gameFactory();

export default {
  state: gameState,
  actions: gameActions.bindTo(gameState),
};
