import { GraphicsPreset } from '../game/ultraGraphics';

export interface UserAccountProfile {
  playerName: string;
  displayName: string;
  callsign: string;
  level: number;
  tier: string;
  uid: string;
  avatarId: string;
  serverRegion: string;
  pingMs: number;
  isGoogleConnected: boolean;
  googleEmail: string;
  googleDisplayName: string;
  googleAvatar: string;
  cloudSyncTime: string;
  assistantName: string;
  assistantRole: string;
  engineVersion: string;
  preferredGraphics: GraphicsPreset;
}

export type UserProfile = UserAccountProfile;

const STORAGE_KEY = 'bgmi_user_account_profile';

class UserAccountManager {
  public profile: UserAccountProfile;
  private listeners: ((profile: UserAccountProfile) => void)[] = [];

  constructor() {
    this.profile = this.loadProfile();
  }

  public getProfile(): UserAccountProfile {
    return this.profile;
  }

  public subscribe(listener: (profile: UserAccountProfile) => void): () => void {
    this.listeners.push(listener);
    listener(this.profile);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l({ ...this.profile }));
  }

  private loadProfile(): UserAccountProfile {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.displayName) parsed.displayName = parsed.playerName || 'Shan PKJ';
        if (!parsed.preferredGraphics) parsed.preferredGraphics = 'EXTREME_HDR';
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to load user account profile from localStorage:', e);
    }

    // Default profile populated with user name and assistant name
    return {
      playerName: 'Shan PKJ',
      displayName: 'Shan PKJ',
      callsign: '[ELITE] SHAN_PKJ',
      level: 4,
      tier: 'Crown V',
      uid: 'OP-839651990085',
      avatarId: 'commando',
      serverRegion: 'Asia - East',
      pingMs: 24,
      isGoogleConnected: true,
      googleEmail: 'shanpkj@gmail.com',
      googleDisplayName: 'Shan PKJ',
      googleAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      cloudSyncTime: 'Just now',
      assistantName: 'Antigravity AI (Google DeepMind)',
      assistantRole: 'AI Tactical Systems Architect',
      engineVersion: 'v4.8.0 Extreme Ultra HDR',
      preferredGraphics: 'EXTREME_HDR',
    };
  }

  public save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profile));
    } catch (e) {
      console.warn('Failed to save user account profile:', e);
    }
    this.notify();
  }

  public updatePlayerName(name?: string) {
    const safeName = (name || '').trim();
    if (!safeName) return;
    this.profile.playerName = safeName;
    this.profile.displayName = safeName;
    this.profile.callsign = `[PRO] ${safeName.toUpperCase().replace(/\s+/g, '_')}`;
    this.profile.cloudSyncTime = 'Just now';
    this.save();
  }

  public setGraphicsPreset(preset: GraphicsPreset) {
    this.profile.preferredGraphics = preset;
    this.save();
  }

  public connectGoogle(email: string = 'shanpkj@gmail.com', displayName: string = 'Shan PKJ') {
    this.profile.isGoogleConnected = true;
    this.profile.googleEmail = email;
    this.profile.googleDisplayName = displayName;
    this.profile.displayName = displayName;
    this.profile.cloudSyncTime = 'Just now';
    this.save();
  }

  public disconnectGoogle() {
    this.profile.isGoogleConnected = false;
    this.profile.cloudSyncTime = 'Local Only';
    this.save();
  }

  public setAvatar(avatarId: string) {
    this.profile.avatarId = avatarId;
    this.save();
  }

  public syncCloud() {
    this.profile.cloudSyncTime = 'Just now';
    this.save();
  }
}

export const userAccountManager = new UserAccountManager();
