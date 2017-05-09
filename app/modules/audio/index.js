import audioActions from '../../actions/audio';
import audioFactory from '../../factories/audio';

const audioState = audioFactory();

export default {
	state: audioState,
	actions: audioActions.bindTo(audioState)
};
