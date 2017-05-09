export default function audioFactory(defaultFrequency = 850) {
	const ctx = new AudioContext();
	const gainNode = ctx.createGain();
	gainNode.gain.value = 0.0001;
	return {
		ctx,
		gainNode
	};
}