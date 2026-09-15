import * as THREE from 'three';

export type VoiceChannel = 'TEAM' | 'ALL' | 'MUTE';

export interface SquadmateVoice {
  id: string;
  name: string;
  isTalking: boolean;
  isMuted: boolean;
  volume: number; // 0 to 1
  lastCallout: string;
  lastCalloutTime: number;
  position: THREE.Vector3;
}

export class VoiceChatSystem {
  public channel: VoiceChannel = 'TEAM';
  public isSelfMuted: boolean = false;
  public isDeafened: boolean = false;
  public isPushToTalk: boolean = true;
  public isPttActive: boolean = false;

  public micLevel: number = 0; // 0 to 1 for visualizer
  public hasMicPermission: boolean = false;

  private audioCtx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private radioFilter: BiquadFilterNode | null = null;

  // Squad members
  public squadmates: SquadmateVoice[] = [
    {
      id: 'squad_1',
      name: 'Viper_47',
      isTalking: false,
      isMuted: false,
      volume: 0.85,
      lastCallout: 'Comms check. Solid copy.',
      lastCalloutTime: Date.now(),
      position: new THREE.Vector3(10, 0, 10),
    },
    {
      id: 'squad_2',
      name: 'Falcon_Lead',
      isTalking: false,
      isMuted: false,
      volume: 0.85,
      lastCallout: 'Holding vantage point.',
      lastCalloutTime: Date.now(),
      position: new THREE.Vector3(-15, 0, 20),
    },
    {
      id: 'squad_3',
      name: 'Raven_OP',
      isTalking: false,
      isMuted: false,
      volume: 0.85,
      lastCallout: 'Covering our flank.',
      lastCalloutTime: Date.now(),
      position: new THREE.Vector3(25, 0, -15),
    },
  ];

  public proximityChatterAlert: { message: string; distance: number; bearing: number } | null = null;
  private chatterTimer: number = 10;

  constructor() {
    // Lazy initialize Web Audio on user gesture
  }

  public async requestMicAccess(): Promise<boolean> {
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.audioCtx = new AudioContextClass();
      }

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        const source = this.audioCtx.createMediaStreamSource(this.micStream);
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 64;

        // Bandpass filter for military radio frequency profile
        this.radioFilter = this.audioCtx.createBiquadFilter();
        this.radioFilter.type = 'bandpass';
        this.radioFilter.frequency.setValueAtTime(1800, this.audioCtx.currentTime);
        this.radioFilter.Q.setValueAtTime(1.8, this.audioCtx.currentTime);

        source.connect(this.radioFilter);
        this.radioFilter.connect(this.analyser);

        this.hasMicPermission = true;
        return true;
      }
    } catch (err) {
      console.warn('Microphone permission not granted or running in sandboxed iframe:', err);
      this.hasMicPermission = false;
    }
    return false;
  }

  public setChannel(channel: VoiceChannel) {
    this.channel = channel;
    this.playRadioChirp(channel !== 'MUTE');
  }

  public toggleSelfMute() {
    this.isSelfMuted = !this.isSelfMuted;
    this.playRadioChirp(!this.isSelfMuted);
  }

  public toggleDeafen() {
    this.isDeafened = !this.isDeafened;
  }

  public setSquadmateMuted(id: string, muted: boolean) {
    const s = this.squadmates.find((m) => m.id === id);
    if (s) s.isMuted = muted;
  }

  public setSquadmateVolume(id: string, vol: number) {
    const s = this.squadmates.find((m) => m.id === id);
    if (s) s.volume = Math.max(0, Math.min(1, vol));
  }

  public setPtt(active: boolean) {
    if (this.isPttActive !== active) {
      this.isPttActive = active;
      if (active) {
        this.playRadioChirp(true);
      } else {
        this.playRadioSquelchTail();
      }
    }
  }

  public update(delta: number, playerPos: THREE.Vector3, playerYaw: number, nearbyEnemyPos?: THREE.Vector3) {
    // 1. Process local mic meter
    if (this.analyser && this.micStream && !this.isSelfMuted && this.channel !== 'MUTE') {
      const data = new Uint8Array(this.analyser.frequencyBinCount);
      this.analyser.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i];
      const avg = sum / data.length / 255;
      this.micLevel = this.isPushToTalk ? (this.isPttActive ? avg : 0) : avg;
    } else {
      this.micLevel = this.isPttActive && !this.isSelfMuted ? 0.65 : 0;
    }

    // 2. Simulated squad tactical radio chatter
    this.chatterTimer -= delta;
    if (this.chatterTimer <= 0) {
      this.chatterTimer = 18 + Math.random() * 22;
      this.triggerRandomSquadCallout(playerPos);
    }

    // Turn off talking state after 3s
    this.squadmates.forEach((m) => {
      if (m.isTalking && Date.now() - m.lastCalloutTime > 3200) {
        m.isTalking = false;
      }
    });

    // 3. Proximity voice chatter detection from enemy bots
    if (this.channel === 'ALL' && !this.isDeafened && nearbyEnemyPos) {
      const d = playerPos.distanceTo(nearbyEnemyPos);
      if (d < 24) {
        // Calculate bearing relative to player
        const dx = nearbyEnemyPos.x - playerPos.x;
        const dz = nearbyEnemyPos.z - playerPos.z;
        let bearing = Math.round((Math.atan2(dx, -dz) * 180) / Math.PI);
        if (bearing < 0) bearing += 360;

        this.proximityChatterAlert = {
          message: 'Hostile Voice Chatter (Proximity)',
          distance: Math.round(d),
          bearing,
        };
      } else {
        this.proximityChatterAlert = null;
      }
    } else {
      this.proximityChatterAlert = null;
    }
  }

  private triggerRandomSquadCallout(playerPos: THREE.Vector3) {
    if (this.channel === 'MUTE' || this.isDeafened) return;

    const available = this.squadmates.filter((m) => !m.isMuted);
    if (available.length === 0) return;

    const squad = available[Math.floor(Math.random() * available.length)];
    const callouts = [
      'Enemy spotted near compound! Bearing 140.',
      'Marking a supply crate ahead. Good loot.',
      'Play zone is closing. Let us get inside the circle.',
      'Buggy vehicle spotted down the road. I can drive.',
      'Covering the ridge. Watch out for snipers.',
      'Got plenty of 5.56 ammo if anyone needs.',
    ];

    squad.isTalking = true;
    squad.lastCallout = callouts[Math.floor(Math.random() * callouts.length)];
    squad.lastCalloutTime = Date.now();

    // Play radio transmission tone
    this.playRadioTransmissionChirp(squad.volume);
  }

  private initAudio() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  /**
   * Military radio squelch start chirp
   */
  private playRadioChirp(on: boolean) {
    this.initAudio();
    if (!this.audioCtx) return;

    const t = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const g = this.audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(on ? 850 : 620, t);
    osc.frequency.setValueAtTime(on ? 1200 : 450, t + 0.03);

    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(g);
    g.connect(this.audioCtx.destination);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  /**
   * Radio squelch tail burst when releasing PTT key
   */
  private playRadioSquelchTail() {
    this.initAudio();
    if (!this.audioCtx) return;

    const t = this.audioCtx.currentTime;
    const bufferSize = this.audioCtx.sampleRate * 0.08;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.audioCtx.sampleRate * 0.02));
    }

    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2400, t);

    const g = this.audioCtx.createGain();
    g.gain.setValueAtTime(0.15, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    noise.connect(filter);
    filter.connect(g);
    g.connect(this.audioCtx.destination);

    noise.start(t);
  }

  /**
   * Incoming squadmate transmission beep
   */
  private playRadioTransmissionChirp(volumeMultiplier: number) {
    this.initAudio();
    if (!this.audioCtx || this.isDeafened) return;

    const t = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const g = this.audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1050, t);
    osc.frequency.setValueAtTime(1450, t + 0.04);

    g.gain.setValueAtTime(0.15 * volumeMultiplier, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(g);
    g.connect(this.audioCtx.destination);

    osc.start(t);
    osc.stop(t + 0.09);
  }
}

export const voiceChatSystem = new VoiceChatSystem();
