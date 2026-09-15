/**
 * High-fidelity Web Audio API sound synthesizer for BGMI-like tactical shooter
 */
class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private windSource: AudioBufferSourceNode | null = null;
  private windGain: GainNode | null = null;
  private blueZoneOsc: OscillatorNode | null = null;
  private blueZoneGain: GainNode | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.8;
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : this.masterVolume;
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  private masterVolume: number = 0.8;
  private sfxVolume: number = 0.9;
  private engineVolume: number = 0.7;

  public setMasterVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && !this.isMuted) {
      this.masterGain.gain.value = this.masterVolume;
    }
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
  }

  public setEngineVolume(vol: number) {
    this.engineVolume = Math.max(0, Math.min(1, vol));
  }

  /**
   * Loud tactical vehicle horn
   */
  public playVehicleHorn() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    [415.3, 440.0].forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.25 * this.sfxVolume, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.connect(g);
      g.connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  }

  /**
   * Generic weapon sound dispatcher supporting all weapon types
   */
  public playGunshotForWeapon(weaponId: string) {
    if (weaponId === 'M416' || weaponId === 'SCAR_L') {
      this.playGunshotM416();
    } else if (weaponId === 'AKM' || weaponId === 'BERYL_M762') {
      this.playGunshotAKM();
    } else if (weaponId === 'AWM' || weaponId === 'KAR98K') {
      this.playGunshotAWM();
    } else if (weaponId === 'UZI' || weaponId === 'VECTOR') {
      // Rapid high-frequency SMG snap
      this.playGunshotM416();
    } else if (weaponId === 'S12K') {
      // Heavy shotgun blast
      this.playGunshotAKM();
    } else if (weaponId === 'PANZERFAUST') {
      // Rocket whoosh boom
      this.playGunshotAWM();
    } else {
      this.playGunshotM416();
    }
  }

  /**
   * Gunshot for M416: rapid, tight punch with supersonic crack
   */
  public playGunshotM416() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;

    // Transient punch oscillator
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.08);

    oscGain.gain.setValueAtTime(0.7, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.12);

    // Noise burst for gunshot crack & blast
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.03));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200, t);
    filter.Q.setValueAtTime(1.5, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.6, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noise.start(t);
  }

  /**
   * Gunshot for AWM: Devastating thunderous sniper boom + echo
   */
  public playGunshotAWM() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;

    // Sub-bass heavy impact
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(150, t);
    subOsc.frequency.exponentialRampToValueAtTime(30, t + 0.35);

    subGain.gain.setValueAtTime(1.0, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain);

    subOsc.start(t);
    subOsc.stop(t + 0.45);

    // Crack noise
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(4500, t);
    filter.frequency.exponentialRampToValueAtTime(800, t + 0.4);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.9, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noise.start(t);

    // Bolt action sound after 0.5s
    setTimeout(() => {
      this.playBoltAction();
    }, 450);
  }

  /**
   * Gunshot for AKM: Heavy punchy clatter
   */
  public playGunshotAKM() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.1);

    oscGain.gain.setValueAtTime(0.8, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.14);

    const bufferSize = this.ctx.sampleRate * 0.18;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.04));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1600, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.7, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(t);
  }

  /**
   * Bolt action chambering sound for sniper
   */
  public playBoltAction() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    // Click 1: pull back
    const osc1 = this.ctx.createOscillator();
    const g1 = this.ctx.createGain();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(800, t);
    osc1.frequency.setValueAtTime(1400, t + 0.05);
    g1.gain.setValueAtTime(0.3, t);
    g1.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
    osc1.connect(g1);
    g1.connect(this.masterGain);
    osc1.start(t);
    osc1.stop(t + 0.08);

    // Click 2: push forward
    const t2 = t + 0.18;
    const osc2 = this.ctx.createOscillator();
    const g2 = this.ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(1200, t2);
    osc2.frequency.setValueAtTime(600, t2 + 0.05);
    g2.gain.setValueAtTime(0.4, t2);
    g2.gain.exponentialRampToValueAtTime(0.01, t2 + 0.08);
    osc2.connect(g2);
    g2.connect(this.masterGain);
    osc2.start(t2);
    osc2.stop(t2 + 0.08);
  }

  /**
   * Reload weapon magazine sound
   */
  public playReload() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;

    // Mag eject
    const ejectOsc = this.ctx.createOscillator();
    const ejectGain = this.ctx.createGain();
    ejectOsc.type = 'sine';
    ejectOsc.frequency.setValueAtTime(700, t);
    ejectOsc.frequency.exponentialRampToValueAtTime(300, t + 0.1);
    ejectGain.gain.setValueAtTime(0.3, t);
    ejectGain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
    ejectOsc.connect(ejectGain);
    ejectGain.connect(this.masterGain);
    ejectOsc.start(t);
    ejectOsc.stop(t + 0.12);

    // Mag insert (at 0.7s)
    const t2 = t + 0.7;
    const insertOsc = this.ctx.createOscillator();
    const insertGain = this.ctx.createGain();
    insertOsc.type = 'triangle';
    insertOsc.frequency.setValueAtTime(400, t2);
    insertOsc.frequency.exponentialRampToValueAtTime(900, t2 + 0.08);
    insertGain.gain.setValueAtTime(0.4, t2);
    insertGain.gain.exponentialRampToValueAtTime(0.01, t2 + 0.12);
    insertOsc.connect(insertGain);
    insertGain.connect(this.masterGain);
    insertOsc.start(t2);
    insertOsc.stop(t2 + 0.12);

    // Slide cock (at 1.2s)
    const t3 = t + 1.2;
    const cockOsc = this.ctx.createOscillator();
    const cockGain = this.ctx.createGain();
    cockOsc.type = 'sawtooth';
    cockOsc.frequency.setValueAtTime(1100, t3);
    cockOsc.frequency.exponentialRampToValueAtTime(400, t3 + 0.07);
    cockGain.gain.setValueAtTime(0.35, t3);
    cockGain.gain.exponentialRampToValueAtTime(0.01, t3 + 0.1);
    cockOsc.connect(cockGain);
    cockGain.connect(this.masterGain);
    cockOsc.start(t3);
    cockOsc.stop(t3 + 0.1);
  }

  /**
   * Hit marker sound - crisp feedback tick
   */
  public playHitmarker() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800, t);
    osc.frequency.setValueAtTime(2200, t + 0.02);
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.04);
  }

  /**
   * Headshot helmet dink sound - metallic resonant ping
   */
  public playHeadshotPing() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2800, t);
    osc.frequency.exponentialRampToValueAtTime(1900, t + 0.2);
    g.gain.setValueAtTime(0.6, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  /**
   * Footstep sound
   */
  public playFootstep(isSprinting: boolean = false) {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110 + Math.random() * 30, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.06);

    g.gain.setValueAtTime(isSprinting ? 0.2 : 0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  /**
   * Jump whoosh sound
   */
  public playJump() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.12);
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  /**
   * Item pickup sound (ammo, medkit, energy drink)
   */
  public playLootPickup() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.setValueAtTime(900, t + 0.06);
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  /**
   * Using Medkit / Drink
   */
  public playUseHeal() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.linearRampToValueAtTime(780, t + 0.3);
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.4);
  }

  /**
   * Distant bot gunshot (spatialized simulation)
   */
  public playDistantGunshot(distance: number = 50) {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const factor = Math.max(0.05, 1 - distance / 200);

    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.1);

    g.gain.setValueAtTime(0.4 * factor, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);

    osc.connect(filter);
    filter.connect(g);
    g.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  /**
   * Continuous buggy vehicle engine sound
   */
  public startVehicleEngine() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.engineOsc) return;

    const t = this.ctx.currentTime;
    this.engineOsc = this.ctx.createOscillator();
    this.engineGain = this.ctx.createGain();

    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.setValueAtTime(65, t);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, t);

    this.engineGain.gain.setValueAtTime(0.25, t);

    this.engineOsc.connect(filter);
    filter.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);

    this.engineOsc.start(t);
  }

  public updateVehicleEngine(speedRatio: number) {
    if (!this.ctx || !this.engineOsc || !this.engineGain) return;
    const freq = 55 + Math.min(speedRatio, 1.0) * 160;
    this.engineOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.05);
  }

  public stopVehicleEngine() {
    if (this.engineOsc) {
      try {
        this.engineOsc.stop();
        this.engineOsc.disconnect();
      } catch (e) {}
      this.engineOsc = null;
      this.engineGain = null;
    }
  }

  /**
   * Parachute / Freefall wind sound loop
   */
  public startWindSound() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.windSource) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    this.windSource = this.ctx.createBufferSource();
    this.windSource.buffer = buffer;
    this.windSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(350, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.0, this.ctx.currentTime);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.2, this.ctx.currentTime);

    this.windSource.connect(filter);
    filter.connect(this.windGain);
    this.windGain.connect(this.masterGain);

    this.windSource.start();
  }

  public stopWindSound() {
    if (this.windSource) {
      try {
        this.windSource.stop();
        this.windSource.disconnect();
      } catch (e) {}
      this.windSource = null;
      this.windGain = null;
    }
  }

  /**
   * Blue zone electric crackle / drone when outside safe circle
   */
  public setOutsideBlueZone(isOutside: boolean) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    if (isOutside && !this.blueZoneOsc) {
      this.blueZoneOsc = this.ctx.createOscillator();
      this.blueZoneGain = this.ctx.createGain();
      this.blueZoneOsc.type = 'sawtooth';
      this.blueZoneOsc.frequency.setValueAtTime(80, this.ctx.currentTime);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(240, this.ctx.currentTime);

      this.blueZoneGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

      this.blueZoneOsc.connect(filter);
      filter.connect(this.blueZoneGain);
      this.blueZoneGain.connect(this.masterGain);
      this.blueZoneOsc.start();
    } else if (!isOutside && this.blueZoneOsc) {
      try {
        this.blueZoneOsc.stop();
        this.blueZoneOsc.disconnect();
      } catch (e) {}
      this.blueZoneOsc = null;
      this.blueZoneGain = null;
    }
  }

  /**
   * Winner Winner Chicken Dinner Victory fanfare
   */
  public playVictoryFanfare() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C E G C E G
    notes.forEach((freq, idx) => {
      const start = t + idx * 0.12;
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      g.gain.setValueAtTime(0.35, start);
      g.gain.exponentialRampToValueAtTime(0.001, start + 0.45);
      osc.connect(g);
      g.connect(this.masterGain!);
      osc.start(start);
      osc.stop(start + 0.45);
    });
  }

  /**
   * Play zone warning siren
   */
  public playZoneWarning() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.linearRampToValueAtTime(880, t + 0.3);
    osc.frequency.linearRampToValueAtTime(440, t + 0.6);

    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.7);
  }
}

export const soundEngine = new SoundEngine();
