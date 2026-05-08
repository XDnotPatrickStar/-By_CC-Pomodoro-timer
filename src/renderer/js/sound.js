const SoundPlayer = {
  audioContext: null,
  gainNode: null,

  init() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
    } catch (e) {
      console.warn('Web Audio API not available:', e);
    }
  },

  async play() {
    if (!this.audioContext || !AppState.settings.soundEnabled) return;

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    const volume = AppState.settings.volume || 0.8;
    this.gainNode.gain.setValueAtTime(Math.min(1, Math.max(0, volume)), this.audioContext.currentTime);

    // Generate a pleasant chime using oscillators
    const now = this.audioContext.currentTime;
    const frequencies = [880, 1108, 1318]; // A5, C#6, E6 (bright chime)

    frequencies.forEach((freq, i) => {
      const osc = this.audioContext.createOscillator();
      const envelope = this.audioContext.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.12);

      envelope.gain.setValueAtTime(0, now + i * 0.12);
      envelope.gain.linearRampToValueAtTime(0.3, now + i * 0.12 + 0.02);
      envelope.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.5);

      osc.connect(envelope);
      envelope.connect(this.gainNode);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.6);
    });
  }
};
