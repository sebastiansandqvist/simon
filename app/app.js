import blixt from 'blixt';
import batch from 'blixt/helpers/batch';
import T from 'blixt/types';
import h from 'mithril/hyperscript';
import m from 'mithril/render';

import Game from './views/_Game.js';
import game from './modules/game';

T.disabled = process.env.NODE_ENV === 'production';

const mountNode = document.getElementById('app');
const render = () => m.render(mountNode, h(Game));

const app = blixt({
  modules: {
    game,
  },
  onUpdate(appState, actionName) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Action: ' + actionName);
    }
    batch(render)();
  },
});

render();

export default app;
