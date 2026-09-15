import * as THREE from 'three';
import { CameraMode, GamePhase, KillfeedEntry, PlayerStats, Stance, WeaponState, MapId, GameMode, CharacterId, SquadMember, TdmState } from '../types/game';
import { WEAPON_DEFINITIONS } from './weapons';
import { soundEngine } from '../audio/soundEngine';
import { WorldBuilder, WorldData } from './worldBuilder';
import { Vehicle } from './vehicle';
import { ZoneSystem } from './zoneSystem';
import { AirDropManager } from './airdrop';
import { BotManager, Bot } from './bots';
import { progressionManager } from '../systems/progressionSystem';
import { voiceChatSystem } from '../systems/voiceChat';
import { UltraGraphicsSystem, GraphicsPreset } from './ultraGraphics';
import { MAP_CONFIGS } from './gameModes';
import { CHARACTERS } from './characters';

export interface GameEngineCallbacks {
  onStatsUpdate: (stats: PlayerStats) => void;
  onWeaponUpdate: (weapon: WeaponState, activeSlot: number) => void;
  onZoneUpdate: (zone: any) => void;
  onKillfeed: (entry: KillfeedEntry) => void;
  onHitmarker: (isHeadshot: boolean) => void;
  onDamageTaken: (amount: number) => void;
  onVehiclePrompt: (prompt: string | null) => void;
  onLootPrompt: (prompt: string | null) => void;
  onPhaseChange: (phase: GamePhase) => void;
  onCompassHeading: (degrees: number) => void;
  onAliveUpdate: (alive: number) => void;
  onParachuteHeight: (height: number) => void;
  onXpEarned?: (popups: string[]) => void;
  onSquadUpdate?: (squad: SquadMember[]) => void;
  onTdmUpdate?: (tdm: TdmState) => void;
  onVehicleUpdate?: (info: { name: string; speedKmh: number; health: number; maxHealth: number; isOccupied: boolean } | null) => void;
}

export interface GameInitConfig {
  mapId?: MapId;
  gameMode?: GameMode;
  characterId?: CharacterId;
  graphicsPreset?: GraphicsPreset;
}

export class GameEngine {
  private container: HTMLElement;
  private callbacks: GameEngineCallbacks;

  // Deployment Settings
  public mapId: MapId = 'ERANGEL';
  public gameMode: GameMode = 'SQUAD';
  public characterId: CharacterId = 'VICTOR';

  // Three.js Core
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private animFrameId: number = 0;
  private clock: THREE.Clock;

  // Subsystems
  public worldData!: WorldData;
  public vehicles: Vehicle[] = [];
  public activeVehicle: Vehicle | null = null;
  public get vehicle(): Vehicle {
    return this.activeVehicle || this.vehicles[0];
  }
  public zoneSystem!: ZoneSystem;
  public airdropManager!: AirDropManager;
  public botManager!: BotManager;

  // Player State
  public phase: GamePhase = 'PLANE_DROP';
  public cameraMode: CameraMode = 'THIRD_PERSON';
  public stance: Stance = 'STAND';
  public isAiming: boolean = false;
  public isSprinting: boolean = false;
  public isGrounded: boolean = false;

  public playerPos: THREE.Vector3 = new THREE.Vector3(0, 260, 0);
  public playerVelocity: THREE.Vector3 = new THREE.Vector3();
  public playerYaw: number = 0;
  public playerPitch: number = 0;

  // Parachute State
  public isParachuteOpen: boolean = false;
  public parachuteMesh: THREE.Mesh | null = null;

  // Ultra Graphics Engine
  public ultraGraphics!: UltraGraphicsSystem;
  public graphicsPreset: GraphicsPreset = 'EXTREME_HDR';

  // Articulated Character Skeleton Limbs & Hands (Third Person)
  public playerMesh: THREE.Group = new THREE.Group();
  public hipGroup: THREE.Group = new THREE.Group();
  public torsoGroup: THREE.Group = new THREE.Group();
  public neckHeadGroup: THREE.Group = new THREE.Group();
  public leftShoulder: THREE.Group = new THREE.Group();
  public rightShoulder: THREE.Group = new THREE.Group();
  public leftElbow: THREE.Group = new THREE.Group();
  public rightElbow: THREE.Group = new THREE.Group();
  public leftHand: THREE.Group = new THREE.Group();
  public rightHand: THREE.Group = new THREE.Group();
  public leftHip: THREE.Group = new THREE.Group();
  public rightHip: THREE.Group = new THREE.Group();
  public leftKnee: THREE.Group = new THREE.Group();
  public rightKnee: THREE.Group = new THREE.Group();
  public tppGunMesh: THREE.Group = new THREE.Group();

  // First Person Hands & Weapon Viewmodel Rig
  public fppViewmodelRig: THREE.Group = new THREE.Group();
  public fppLeftArm: THREE.Group = new THREE.Group();
  public fppRightArm: THREE.Group = new THREE.Group();
  public fppGunGroup: THREE.Group = new THREE.Group();
  public fppRecoilKick: number = 0;
  public fppRecoilRot: number = 0;

  // Gait Animation Cycle
  private walkCycle: number = 0;

  // Weapon Inventory
  public weapons: WeaponState[] = [
    { config: WEAPON_DEFINITIONS.M416, currentAmmo: 30, reserveAmmo: 180, isReloading: false, reloadProgress: 0 },
    { config: WEAPON_DEFINITIONS.AWM, currentAmmo: 5, reserveAmmo: 25, isReloading: false, reloadProgress: 0 },
    { config: WEAPON_DEFINITIONS.AKM, currentAmmo: 30, reserveAmmo: 120, isReloading: false, reloadProgress: 0 },
  ];
  public activeSlot: number = 0;
  private lastFireTime: number = 0;
  private recoilPitch: number = 0;

  // Player Stats
  public stats: PlayerStats = {
    health: 100,
    maxHealth: 100,
    boost: 60,
    armor: 100,
    helmet: 100,
    kills: 0,
    damageDealt: 0,
    survivalTime: 0,
    distanceTraveled: 0,
  };

  // Inputs
  public input = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    sprint: false,
    crouch: false,
    prone: false,
    fire: false,
    aim: false,
  };

  private footstepTimer: number = 0;
  private muzzleLight: THREE.PointLight | null = null;

  constructor(
    container: HTMLElement,
    callbacks: GameEngineCallbacks,
    initConfig: GameInitConfig = {}
  ) {
    this.container = container;
    this.callbacks = callbacks;
    this.mapId = initConfig.mapId || 'ERANGEL';
    this.gameMode = initConfig.gameMode || 'SQUAD';
    this.characterId = initConfig.characterId || 'VICTOR';
    if (initConfig.graphicsPreset) {
      this.graphicsPreset = initConfig.graphicsPreset;
    }
    this.clock = new THREE.Clock();

    const mapConfig = MAP_CONFIGS[this.mapId] || MAP_CONFIGS.ERANGEL;

    // 1. Scene Setup with map-specific sky and atmospheric fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(mapConfig.skyColor);
    this.scene.fog = new THREE.FogExp2(mapConfig.fogColor, mapConfig.fogDensity);

    // 2. Camera Setup
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 1500);

    // 3. Renderer Setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    container.appendChild(this.renderer.domElement);

    // 4. Atmospheric Lighting
    this.setupLighting();

    // 5. Build 3D World for selected map
    this.worldData = WorldBuilder.buildWorld(this.scene, this.mapId);

    // 5b. Ultra Graphics Engine
    this.ultraGraphics = new UltraGraphicsSystem(this.scene);
    if (this.worldData.waterMesh) {
      this.ultraGraphics.registerWaterMesh(this.worldData.waterMesh);
    }
    this.ultraGraphics.initGrass(this.worldData.getTerrainHeight);
    this.ultraGraphics.applyPreset(this.graphicsPreset, this.renderer, this.worldData.getTerrainHeight);

    // 6. Spawn Vehicle Fleet
    this.spawnVehicleFleet();

    // 7. Zone & Airdrops
    this.zoneSystem = new ZoneSystem(this.scene);
    this.airdropManager = new AirDropManager(this.scene);

    // 8. Bot & Squad System
    this.botManager = new BotManager(this.scene);
    const botCount = this.gameMode === 'SQUAD' ? 45 : this.gameMode === 'DEATHMATCH' ? 8 : this.gameMode === 'SNIPER_ARENA' ? 30 : 60;
    this.botManager.spawnBots(botCount, this.worldData.getTerrainHeight, this.playerPos, this.gameMode);

    // 9. Build Player Character Mesh & First Person Viewmodel Arms
    this.buildPlayerCharacter();
    this.buildFirstPersonArms();

    // 10. Apply active tactical gameplay boosts & perks
    this.applyActiveBoosts();

    // 11. Start drop phase or instant spawn
    if (this.gameMode === 'DEATHMATCH') {
      this.startTdmSpawn();
    } else {
      this.startDropPhase();
    }

    // Listeners & Resize
    window.addEventListener('resize', this.onResize);

    // Start loop
    this.animate();
  }

  private setupLighting() {
    const mapConfig = MAP_CONFIGS[this.mapId] || MAP_CONFIGS.ERANGEL;

    // Ambient light
    const ambient = new THREE.AmbientLight(mapConfig.skyColor, 0.75);
    this.scene.add(ambient);

    // Directional sunlight
    const sun = new THREE.DirectionalLight(mapConfig.sunColor, 1.4);
    sun.position.set(mapConfig.sunPosition[0], mapConfig.sunPosition[1], mapConfig.sunPosition[2]);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 10;
    sun.shadow.camera.far = 1000;
    const shadowD = 180;
    sun.shadow.camera.left = -shadowD;
    sun.shadow.camera.right = shadowD;
    sun.shadow.camera.top = shadowD;
    sun.shadow.camera.bottom = -shadowD;
    this.scene.add(sun);

    // Muzzle flash point light
    this.muzzleLight = new THREE.PointLight(0xffaa22, 0, 10);
    this.scene.add(this.muzzleLight);
  }

  private startTdmSpawn() {
    this.phase = 'PLAYING';
    this.callbacks.onPhaseChange('PLAYING');
    this.playerPos.set(0, this.worldData.getTerrainHeight(0, -60) + 1.2, -60);
    this.playerVelocity.set(0, 0, 0);
    this.playerMesh.position.copy(this.playerPos);
    this.playerMesh.visible = true;
  }

  private spawnVehicleFleet() {
    this.vehicles = [];
    const h = this.worldData.getTerrainHeight;

    if (this.mapId === 'WAREHOUSE_TDM') {
      this.vehicles.push(new Vehicle(this.scene, -25, 20, 'BUGGY', h));
      this.vehicles.push(new Vehicle(this.scene, 25, -20, 'MOTORBIKE', h));
    } else {
      // Spawn vehicle fleet across map
      this.vehicles.push(new Vehicle(this.scene, 15, 30, 'BUGGY', h));
      this.vehicles.push(new Vehicle(this.scene, -30, 45, 'UAZ', h));
      this.vehicles.push(new Vehicle(this.scene, 40, -25, 'MOTORBIKE', h));
      this.vehicles.push(new Vehicle(this.scene, -60, -40, 'DACIA', h));
      this.vehicles.push(new Vehicle(this.scene, 65, 60, 'BRDM', h));
      this.vehicles.push(new Vehicle(this.scene, -85, 75, 'UAZ', h));
      this.vehicles.push(new Vehicle(this.scene, 85, -70, 'BUGGY', h));
    }
  }

  public honkVehicle() {
    if (this.activeVehicle && this.activeVehicle.isOccupied) {
      this.activeVehicle.honk();
    }
  }

  /**
   * Constructs fully articulated soldier mesh with shoulders, elbows,
   * detailed hands with fingers, hips, knees, and combat boots.
   */
  private buildPlayerCharacter() {
    const char = CHARACTERS[this.characterId] || CHARACTERS.VICTOR;
    // Materials
    const suitMat = new THREE.MeshStandardMaterial({ color: char.style.camoColor, roughness: 0.8 });
    const vestMat = new THREE.MeshStandardMaterial({ color: char.style.vestColor, roughness: 0.5, metalness: 0.2 });
    const pouchMat = new THREE.MeshStandardMaterial({ color: 0x483a27, roughness: 0.9 });
    const skinMat = new THREE.MeshStandardMaterial({ color: char.style.skinTone, roughness: 0.7 });
    const gloveMat = new THREE.MeshStandardMaterial({ color: 0x141814, roughness: 0.5, metalness: 0.3 });
    const kneePadMat = new THREE.MeshStandardMaterial({ color: 0x111611, roughness: 0.4, metalness: 0.4 });
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x181412, roughness: 0.9 });
    const helmetMat = new THREE.MeshStandardMaterial({ color: char.style.helmetColor, roughness: 0.35, metalness: 0.6 });
    const visorMat = new THREE.MeshStandardMaterial({ color: 0x08151f, metalness: 0.95, roughness: 0.05, opacity: 0.9, transparent: true });
    const gunMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.25 });

    // Root Group for Entire Player Character
    this.playerMesh = new THREE.Group();

    // 1. Pelvis / Hip Root Group (Enables vertical bounce & hip sway)
    this.hipGroup = new THREE.Group();
    this.hipGroup.position.y = 0.95;
    this.playerMesh.add(this.hipGroup);

    // Pelvis Core Block
    const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.26), suitMat);
    pelvis.position.y = 0;
    pelvis.castShadow = true;
    this.hipGroup.add(pelvis);

    // Tactical Utility Belt
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.3), vestMat);
    belt.position.y = 0.08;
    this.hipGroup.add(belt);

    // Side Holster on Right Hip
    const holster = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.22, 0.14), vestMat);
    holster.position.set(0.24, -0.05, 0);
    this.hipGroup.add(holster);

    // 2. Torso Group (Chest, Shoulders, Head & Neck)
    this.torsoGroup = new THREE.Group();
    this.torsoGroup.position.set(0, 0.12, 0);
    this.hipGroup.add(this.torsoGroup);

    // Chest / Tactical Plate Carrier
    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.58, 0.32), vestMat);
    chest.position.y = 0.32;
    chest.castShadow = true;
    this.torsoGroup.add(chest);

    // Front Armor Ballistic Plate
    const frontPlate = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.44, 0.08), vestMat);
    frontPlate.position.set(0, 0.34, 0.18);
    this.torsoGroup.add(frontPlate);

    // 3x Magazine Pouches on Vest Stomach
    for (let i = -1; i <= 1; i++) {
      const magPouch = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.18, 0.07), pouchMat);
      magPouch.position.set(i * 0.12, 0.2, 0.22);
      this.torsoGroup.add(magPouch);
    }

    // Level 3 Assault Rucksack / Backpack on Back
    const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.52, 0.22), suitMat);
    backpack.position.set(0, 0.36, -0.22);
    backpack.castShadow = true;
    this.torsoGroup.add(backpack);

    // Bedroll on top of backpack
    const bedroll = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.44, 8), pouchMat);
    bedroll.rotation.z = Math.PI / 2;
    bedroll.position.set(0, 0.65, -0.22);
    this.torsoGroup.add(bedroll);

    // 3. Neck & Head Group
    this.neckHeadGroup = new THREE.Group();
    this.neckHeadGroup.position.set(0, 0.62, 0);
    this.torsoGroup.add(this.neckHeadGroup);

    // Neck
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.14, 8), skinMat);
    neck.position.y = 0.07;
    this.neckHeadGroup.add(neck);

    // Head with balaclava
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.3, 0.28), vestMat);
    head.position.y = 0.24;
    head.castShadow = true;
    this.neckHeadGroup.add(head);

    // Spetsnaz Level 3 Helmet Shell
    const helmet = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 12, 10, 0, Math.PI * 2, 0, Math.PI / 1.65),
      helmetMat
    );
    helmet.position.set(0, 0.28, 0);
    helmet.castShadow = true;
    this.neckHeadGroup.add(helmet);

    // Level 3 Helmet Ballistic Face Visor
    const visorRim = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.06), helmetMat);
    visorRim.position.set(0, 0.24, 0.16);
    this.neckHeadGroup.add(visorRim);

    const visorGlass = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.04), visorMat);
    visorGlass.position.set(0, 0.24, 0.18);
    this.neckHeadGroup.add(visorGlass);

    // Tactical Comms Headset with Mic
    const headsetEar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 8), vestMat);
    headsetEar.rotation.z = Math.PI / 2;
    headsetEar.position.set(-0.16, 0.24, 0);
    this.neckHeadGroup.add(headsetEar);

    // 4. Left Arm & Hand Assembly (Holding front rifle handguard)
    this.leftShoulder = new THREE.Group();
    this.leftShoulder.position.set(-0.35, 0.52, 0);
    this.torsoGroup.add(this.leftShoulder);

    // Left Upper Arm (camo sleeve)
    const leftUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.32, 8), suitMat);
    leftUpperArm.position.y = -0.16;
    leftUpperArm.castShadow = true;
    this.leftShoulder.add(leftUpperArm);

    // Left Elbow Joint
    this.leftElbow = new THREE.Group();
    this.leftElbow.position.set(0, -0.32, 0);
    this.leftShoulder.add(this.leftElbow);

    // Left Forearm
    const leftForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.3, 8), suitMat);
    leftForearm.position.y = -0.15;
    leftForearm.castShadow = true;
    this.leftElbow.add(leftForearm);

    // Left Hand (with tactical combat glove & fingers)
    this.leftHand = new THREE.Group();
    this.leftHand.position.set(0, -0.3, 0);
    this.leftElbow.add(this.leftHand);

    const leftHandPalm = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.1, 0.06), gloveMat);
    leftHandPalm.position.set(0, -0.04, 0);
    this.leftHand.add(leftHandPalm);

    // Left Fingers wrapping around gun forend handguard
    const leftFingers = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.08), gloveMat);
    leftFingers.position.set(0, -0.07, 0.03);
    this.leftHand.add(leftFingers);

    // 5. Right Arm & Hand Assembly (Holding trigger and pistol grip)
    this.rightShoulder = new THREE.Group();
    this.rightShoulder.position.set(0.35, 0.52, 0);
    this.torsoGroup.add(this.rightShoulder);

    // Right Upper Arm
    const rightUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.32, 8), suitMat);
    rightUpperArm.position.y = -0.16;
    rightUpperArm.castShadow = true;
    this.rightShoulder.add(rightUpperArm);

    // Right Elbow Joint
    this.rightElbow = new THREE.Group();
    this.rightElbow.position.set(0, -0.32, 0);
    this.rightShoulder.add(this.rightElbow);

    // Right Forearm
    const rightForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.3, 8), suitMat);
    rightForearm.position.y = -0.15;
    rightForearm.castShadow = true;
    this.rightElbow.add(rightForearm);

    // Right Hand (Gloved with trigger finger)
    this.rightHand = new THREE.Group();
    this.rightHand.position.set(0, -0.3, 0);
    this.rightElbow.add(this.rightHand);

    const rightHandPalm = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.1, 0.06), gloveMat);
    rightHandPalm.position.set(0, -0.04, 0);
    this.rightHand.add(rightHandPalm);

    // Right Fingers gripping pistol grip
    const rightFingers = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.07, 0.07), gloveMat);
    rightFingers.position.set(0, -0.07, 0.02);
    this.rightHand.add(rightFingers);

    // 6. Tactical Rifle / Gun Model (Held firmly in hands)
    this.tppGunMesh = new THREE.Group();
    this.tppGunMesh.position.set(0.16, 0.28, 0.38);

    // Gun Receiver
    const gunReceiver = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.44), gunMat);
    gunReceiver.castShadow = true;
    this.tppGunMesh.add(gunReceiver);

    // Barrel with Flash Hider
    const gunBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.45, 8), gunMat);
    gunBarrel.rotation.x = Math.PI / 2;
    gunBarrel.position.set(0, 0.03, 0.42);
    this.tppGunMesh.add(gunBarrel);

    // Flash Hider / Muzzle Brake
    const muzzleBrake = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.08, 8), gunMat);
    muzzleBrake.rotation.x = Math.PI / 2;
    muzzleBrake.position.set(0, 0.03, 0.68);
    this.tppGunMesh.add(muzzleBrake);

    // Curved Magazine
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.1), vestMat);
    mag.position.set(0, -0.12, 0.1);
    mag.rotation.x = -0.2;
    this.tppGunMesh.add(mag);

    // 4x Scope / Optic Sight
    const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.2, 8), gunMat);
    scope.rotation.x = Math.PI / 2;
    scope.position.set(0, 0.12, 0.05);
    this.tppGunMesh.add(scope);

    // Stock
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.24), vestMat);
    stock.position.set(0, 0.02, -0.28);
    this.tppGunMesh.add(stock);

    this.torsoGroup.add(this.tppGunMesh);

    // 7. Left Leg Assembly
    this.leftHip = new THREE.Group();
    this.leftHip.position.set(-0.16, -0.08, 0);
    this.hipGroup.add(this.leftHip);

    // Left Thigh
    const leftThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.44, 8), suitMat);
    leftThigh.position.y = -0.22;
    leftThigh.castShadow = true;
    this.leftHip.add(leftThigh);

    // Left Knee Joint
    this.leftKnee = new THREE.Group();
    this.leftKnee.position.set(0, -0.44, 0);
    this.leftHip.add(this.leftKnee);

    // Left Knee Pad
    const leftKneePad = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.08), kneePadMat);
    leftKneePad.position.set(0, 0, 0.1);
    this.leftKnee.add(leftKneePad);

    // Left Shin / Calf
    const leftShin = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.085, 0.42, 8), suitMat);
    leftShin.position.y = -0.21;
    leftShin.castShadow = true;
    this.leftKnee.add(leftShin);

    // Left Combat Tactical Boot
    const leftBoot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.28), bootMat);
    leftBoot.position.set(0, -0.42, 0.04);
    leftBoot.castShadow = true;
    this.leftKnee.add(leftBoot);

    // 8. Right Leg Assembly
    this.rightHip = new THREE.Group();
    this.rightHip.position.set(0.16, -0.08, 0);
    this.hipGroup.add(this.rightHip);

    // Right Thigh
    const rightThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.44, 8), suitMat);
    rightThigh.position.y = -0.22;
    rightThigh.castShadow = true;
    this.rightHip.add(rightThigh);

    // Right Knee Joint
    this.rightKnee = new THREE.Group();
    this.rightKnee.position.set(0, -0.44, 0);
    this.rightHip.add(this.rightKnee);

    // Right Knee Pad
    const rightKneePad = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.08), kneePadMat);
    rightKneePad.position.set(0, 0, 0.1);
    this.rightKnee.add(rightKneePad);

    // Right Shin / Calf
    const rightShin = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.085, 0.42, 8), suitMat);
    rightShin.position.y = -0.21;
    rightShin.castShadow = true;
    this.rightKnee.add(rightShin);

    // Right Combat Tactical Boot
    const rightBoot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.28), bootMat);
    rightBoot.position.set(0, -0.42, 0.04);
    rightBoot.castShadow = true;
    this.rightKnee.add(rightBoot);

    // Add Player Model to Scene
    this.scene.add(this.playerMesh);
  }

  /**
   * Constructs first-person viewmodel tactical arms and weapon rig attached to camera
   */
  private buildFirstPersonArms() {
    this.fppViewmodelRig = new THREE.Group();
    this.fppViewmodelRig.position.set(0, -0.28, -0.45);

    const char = CHARACTERS[this.characterId] || CHARACTERS.VICTOR;
    const suitMat = new THREE.MeshStandardMaterial({ color: char.style.camoColor, roughness: 0.8 });
    const gloveMat = new THREE.MeshStandardMaterial({ color: char.style.vestColor, roughness: 0.5, metalness: 0.3 });
    const gunMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.25 });
    const opticLensMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });

    // Right Arm & Hand (from bottom-right of viewport)
    this.fppRightArm = new THREE.Group();
    this.fppRightArm.position.set(0.24, -0.15, 0.1);

    const rArm = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.45, 8), suitMat);
    rArm.rotation.set(0.6, -0.4, 0.7);
    rArm.position.set(0.08, -0.1, 0.05);
    this.fppRightArm.add(rArm);

    const rHand = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.1, 0.07), gloveMat);
    rHand.position.set(0, 0.06, -0.05);
    rHand.rotation.set(0.4, -0.2, 0.2);
    this.fppRightArm.add(rHand);

    // Left Arm & Hand (supporting barrel handguard from bottom-left)
    this.fppLeftArm = new THREE.Group();
    this.fppLeftArm.position.set(-0.2, -0.16, 0.15);

    const lArm = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.48, 8), suitMat);
    lArm.rotation.set(0.4, 0.5, -0.8);
    lArm.position.set(-0.1, -0.08, 0.05);
    this.fppLeftArm.add(lArm);

    const lHand = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.1, 0.07), gloveMat);
    lHand.position.set(0.12, 0.14, -0.22);
    lHand.rotation.set(-0.2, 0.4, -0.5);
    this.fppLeftArm.add(lHand);

    // Central 3D Weapon Model
    this.fppGunGroup = new THREE.Group();
    this.fppGunGroup.position.set(0.14, 0.06, -0.12);

    // Receiver
    const rec = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.38), gunMat);
    this.fppGunGroup.add(rec);

    // Long Barrel
    const bbl = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8), gunMat);
    bbl.rotation.x = Math.PI / 2;
    bbl.position.set(0, 0.03, 0.42);
    this.fppGunGroup.add(bbl);

    // Handguard
    const hg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.09, 0.28), suitMat);
    hg.position.set(0, 0.03, 0.32);
    this.fppGunGroup.add(hg);

    // Scope & Reticle
    const sc = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.18, 8), gunMat);
    sc.rotation.x = Math.PI / 2;
    sc.position.set(0, 0.1, 0.06);
    this.fppGunGroup.add(sc);

    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.026, 12), opticLensMat);
    lens.position.set(0, 0.1, -0.031);
    this.fppGunGroup.add(lens);

    // Magazine
    const fppMag = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.2, 0.09), gloveMat);
    fppMag.position.set(0, -0.12, 0.1);
    fppMag.rotation.x = -0.2;
    this.fppGunGroup.add(fppMag);

    this.fppViewmodelRig.add(this.fppRightArm);
    this.fppViewmodelRig.add(this.fppLeftArm);
    this.fppViewmodelRig.add(this.fppGunGroup);

    this.camera.add(this.fppViewmodelRig);
    this.fppViewmodelRig.visible = false;
  }

  /**
   * Procedural IK walking and sprinting animation with articulated joints
   */
  private updateWalkingAnimation(delta: number, isMoving: boolean) {
    if (isMoving) {
      const strideRate = this.isSprinting ? 14.0 : this.stance === 'CROUCH' ? 7.0 : 8.5;
      this.walkCycle += delta * strideRate;
    }

    const isSprint = this.isSprinting && this.stance === 'STAND' && isMoving;
    const isCrouch = this.stance === 'CROUCH';
    const isProne = this.stance === 'PRONE';

    if (isProne) {
      // Flat army crawl
      this.playerMesh.rotation.x = -Math.PI / 2 + 0.1;
      this.hipGroup.position.y = 0.22;
      this.torsoGroup.rotation.x = 0;
      this.leftHip.rotation.x = isMoving ? Math.sin(this.walkCycle) * 0.4 : 0;
      this.rightHip.rotation.x = isMoving ? -Math.sin(this.walkCycle) * 0.4 : 0;
      this.leftShoulder.rotation.x = 1.2;
      this.rightShoulder.rotation.x = 1.2;
      return;
    } else {
      this.playerMesh.rotation.x = 0;
    }

    // 1. Torso Lean (Aggressive forward tilt when sprinting, upright when walking)
    const targetTorsoTilt = isSprint ? 0.28 : isCrouch ? 0.2 : 0.05;
    this.torsoGroup.rotation.x = THREE.MathUtils.lerp(this.torsoGroup.rotation.x, targetTorsoTilt, 0.15);

    // 2. Hip Height & Vertical Bounce
    const baseHipY = isCrouch ? 0.65 : 0.95;
    const bounce = isMoving ? Math.abs(Math.sin(this.walkCycle)) * (isSprint ? 0.07 : 0.04) : 0;
    this.hipGroup.position.y = THREE.MathUtils.lerp(this.hipGroup.position.y, baseHipY - bounce, 0.25);

    // 3. Hip Lateral Sway (Natural gait weight shifting)
    const sway = isMoving ? Math.sin(this.walkCycle) * (isSprint ? 0.05 : 0.025) : 0;
    this.hipGroup.rotation.z = THREE.MathUtils.lerp(this.hipGroup.rotation.z, sway, 0.2);

    // 4. Leg Kinematics (Thigh swing & knee flexing)
    const legMaxSwing = isSprint ? 0.92 : isCrouch ? 0.45 : 0.6;
    const legSwing = isMoving ? Math.sin(this.walkCycle) * legMaxSwing : 0;

    // Left Leg
    const crouchKneeOffset = isCrouch ? 0.45 : 0;
    this.leftHip.rotation.x = THREE.MathUtils.lerp(this.leftHip.rotation.x, legSwing + crouchKneeOffset, 0.25);
    const leftKneeBend = isMoving ? Math.max(0, -legSwing) * (isSprint ? 1.25 : 0.75) : 0;
    this.leftKnee.rotation.x = THREE.MathUtils.lerp(this.leftKnee.rotation.x, leftKneeBend + crouchKneeOffset, 0.25);

    // Right Leg
    this.rightHip.rotation.x = THREE.MathUtils.lerp(this.rightHip.rotation.x, -legSwing + crouchKneeOffset, 0.25);
    const rightKneeBend = isMoving ? Math.max(0, legSwing) * (isSprint ? 1.25 : 0.75) : 0;
    this.rightKnee.rotation.x = THREE.MathUtils.lerp(this.rightKnee.rotation.x, rightKneeBend + crouchKneeOffset, 0.25);

    // 5. Arm & Weapon Poses (Tactical ready vs sprint carry vs ADS aim)
    if (this.isAiming) {
      // Cheek-weld high-ready precision aim
      this.rightShoulder.rotation.set(1.42, -0.15, -0.1);
      this.rightElbow.rotation.set(0.65, 0, 0);
      this.leftShoulder.rotation.set(1.35, 0.4, 0.1);
      this.leftElbow.rotation.set(0.85, 0, 0);
      this.tppGunMesh.position.set(0.04, 0.38, 0.44);
    } else if (isSprint) {
      // Tactical sprint high carry
      const armPump = Math.sin(this.walkCycle) * 0.35;
      this.rightShoulder.rotation.set(0.85 - armPump, -0.1, -0.15);
      this.rightElbow.rotation.set(0.7, 0, 0);
      this.leftShoulder.rotation.set(0.7 + armPump, 0.3, 0.15);
      this.leftElbow.rotation.set(0.9, 0, 0);
      this.tppGunMesh.position.set(0.12, 0.32, 0.36);
    } else {
      // Combat ready idle / walk
      const weaponSway = isMoving ? Math.sin(this.walkCycle) * 0.04 : Math.sin(this.walkCycle * 0.4) * 0.015;
      this.rightShoulder.rotation.set(0.65 + weaponSway, -0.05, 0);
      this.rightElbow.rotation.set(0.55, 0, 0);
      this.leftShoulder.rotation.set(0.6 - weaponSway, 0.25, 0);
      this.leftElbow.rotation.set(0.75, 0, 0);
      this.tppGunMesh.position.set(0.16, 0.28, 0.38);
    }
  }

  /**
   * First-Person viewmodel bobbing, sway, and ADS alignment
   */
  private updateFppArms(delta: number, isMoving: boolean) {
    const isFppActive = this.cameraMode === 'FIRST_PERSON' || this.isAiming;
    this.fppViewmodelRig.visible = isFppActive;
    if (!isFppActive) return;

    // Decay recoil kicks
    this.fppRecoilKick = THREE.MathUtils.lerp(this.fppRecoilKick, 0, 0.22);
    this.fppRecoilRot = THREE.MathUtils.lerp(this.fppRecoilRot, 0, 0.22);

    if (this.isAiming) {
      // Center viewmodel directly on optical line of sight
      const targetPos = new THREE.Vector3(-0.14, -0.22 - this.fppRecoilKick * 0.4, -0.38 - this.fppRecoilKick);
      this.fppViewmodelRig.position.lerp(targetPos, 0.3);
      this.fppViewmodelRig.rotation.x = this.fppRecoilRot;
      this.fppViewmodelRig.rotation.y = 0;
    } else {
      // Natural hip-fire viewmodel with walking figure-8 bobbing
      const bobX = isMoving ? Math.sin(this.walkCycle) * (this.isSprinting ? 0.024 : 0.014) : Math.sin(this.walkCycle * 0.5) * 0.003;
      const bobY = isMoving ? Math.abs(Math.sin(this.walkCycle * 2)) * (this.isSprinting ? 0.018 : 0.01) : Math.cos(this.walkCycle * 0.5) * 0.002;

      const targetPos = new THREE.Vector3(
        bobX,
        -0.28 + bobY - this.fppRecoilKick * 0.6,
        -0.45 - this.fppRecoilKick
      );
      this.fppViewmodelRig.position.lerp(targetPos, 0.25);
      this.fppViewmodelRig.rotation.x = (isMoving ? Math.sin(this.walkCycle) * 0.02 : 0) + this.fppRecoilRot;
      this.fppViewmodelRig.rotation.y = isMoving ? Math.cos(this.walkCycle) * 0.015 : 0;
    }
  }

  private startDropPhase() {
    this.phase = 'PLANE_DROP';
    this.callbacks.onPhaseChange('PLANE_DROP');
    soundEngine.startWindSound();

    // Start high up over Pochinki
    this.playerPos.set(-60, 240, -40);
    this.playerVelocity.set(0, -18, 0);
  }

  private applyActiveBoosts() {
    if (progressionManager.isBoostActive('ADRENALINE')) {
      this.stats.boost = 100;
    }
    if (progressionManager.isBoostActive('TACTICAL_ARMOR')) {
      this.stats.armor = 135;
    }
    this.callbacks.onStatsUpdate({ ...this.stats });
  }

  public deployParachute() {
    if (this.phase === 'PLANE_DROP' && !this.isParachuteOpen) {
      this.isParachuteOpen = true;

      // Parachute canopy with equipped cosmetic color
      const equippedChute = progressionManager.profile.equippedCosmetics.parachute;
      let chuteColor = 0x15803d; // Default dark olive
      if (equippedChute === 'chute_golden_eagle') chuteColor = 0xf59e0b;
      else if (equippedChute === 'chute_crimson_drop') chuteColor = 0xdc2626;

      const chuteGeo = new THREE.SphereGeometry(4.2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
      const chuteMat = new THREE.MeshStandardMaterial({
        color: chuteColor,
        side: THREE.DoubleSide,
        roughness: 0.8,
      });
      this.parachuteMesh = new THREE.Mesh(chuteGeo, chuteMat);
      this.scene.add(this.parachuteMesh);
    }
  }

  private onResize = () => {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public handleMouseMove(movementX: number, movementY: number, sensitivity: number = 0.0022) {
    if (this.phase !== 'PLAYING' && this.phase !== 'PLANE_DROP') return;

    // Scale sensitivity if ADS scope zoom is active
    const currentWeapon = this.weapons[this.activeSlot];
    const zoomScale = this.isAiming ? currentWeapon.config.zoomFov / 65 : 1.0;

    this.playerYaw -= movementX * sensitivity * zoomScale;
    this.playerPitch -= movementY * sensitivity * zoomScale;

    // Pitch limits
    const maxPitch = Math.PI / 2.3;
    this.playerPitch = Math.max(-maxPitch, Math.min(maxPitch, this.playerPitch));
  }

  public setStance(stance: Stance) {
    this.stance = stance;
  }

  public toggleCameraMode() {
    this.cameraMode = this.cameraMode === 'THIRD_PERSON' ? 'FIRST_PERSON' : 'THIRD_PERSON';
  }

  public switchWeapon(slotIndex: number) {
    if (slotIndex >= 0 && slotIndex < this.weapons.length && !this.weapons[this.activeSlot].isReloading) {
      this.activeSlot = slotIndex;
      this.callbacks.onWeaponUpdate(this.weapons[this.activeSlot], this.activeSlot);
      soundEngine.playLootPickup();
    }
  }

  public reloadActiveWeapon() {
    const cur = this.weapons[this.activeSlot];
    if (cur.isReloading || cur.currentAmmo === cur.config.magazineSize || cur.reserveAmmo <= 0) return;

    cur.isReloading = true;
    cur.reloadProgress = 0;
    soundEngine.playReload();
    this.callbacks.onWeaponUpdate(cur, this.activeSlot);

    let reloadDuration = 2200; // 2.2 seconds reload time
    if (progressionManager.isBoostActive('RAPID_RELOAD')) {
      reloadDuration = 1650; // 25% faster reload
    }
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      cur.reloadProgress = Math.min(1.0, elapsed / reloadDuration);
      this.callbacks.onWeaponUpdate(cur, this.activeSlot);

      if (cur.reloadProgress >= 1.0) {
        clearInterval(interval);
        const needed = cur.config.magazineSize - cur.currentAmmo;
        const available = Math.min(needed, cur.reserveAmmo);
        cur.currentAmmo += available;
        cur.reserveAmmo -= available;
        cur.isReloading = false;
        this.callbacks.onWeaponUpdate(cur, this.activeSlot);
      }
    }, 50);
  }

  public shootWeapon() {
    if (this.phase !== 'PLAYING' || this.vehicle.isOccupied) return;

    const cur = this.weapons[this.activeSlot];
    if (cur.isReloading) return;

    if (cur.currentAmmo <= 0) {
      this.reloadActiveWeapon();
      return;
    }

    const now = performance.now();
    const fireInterval = 1000 / cur.config.fireRate;
    if (now - this.lastFireTime < fireInterval) return;
    this.lastFireTime = now;

    // Deduct ammo
    cur.currentAmmo -= 1;
    this.callbacks.onWeaponUpdate(cur, this.activeSlot);

    // Audio
    if (cur.config.id === 'M416') soundEngine.playGunshotM416();
    else if (cur.config.id === 'AWM') soundEngine.playGunshotAWM();
    else soundEngine.playGunshotAKM();

    // Muzzle Flash
    if (this.muzzleLight) {
      this.muzzleLight.intensity = 4.0;
      this.muzzleLight.position.copy(this.camera.position).add(this.camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(1.2));
      setTimeout(() => {
        if (this.muzzleLight) this.muzzleLight.intensity = 0;
      }, 40);
    }

    // Ultra Graphics: Realistic Brass Casing Physics & Muzzle Smoke
    if (this.ultraGraphics) {
      const forwardDir = this.camera.getWorldDirection(new THREE.Vector3());
      const muzzlePos = this.camera.position.clone().addScaledVector(forwardDir, 0.9);
      this.ultraGraphics.spawnMuzzleSmoke(muzzlePos, forwardDir);
      this.ultraGraphics.ejectShellCasing(this.camera.position.clone().addScaledVector(forwardDir, 0.35), forwardDir);
    }
    this.fppRecoilKick = 0.07;
    this.fppRecoilRot = 0.09;

    // Weapon Recoil Climb
    const stanceRecoilFactor = this.stance === 'PRONE' ? 0.4 : this.stance === 'CROUCH' ? 0.7 : 1.0;
    this.recoilPitch = cur.config.recoil * stanceRecoilFactor;
    this.playerPitch = Math.min(Math.PI / 2.3, this.playerPitch + this.recoilPitch);

    // Raycast Bullet Ballistics
    this.castBulletRay(cur);
  }

  private castBulletRay(cur: WeaponState) {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);

    // Check hit on bots
    const aliveBots = this.botManager.bots.filter((b) => b.isAlive);
    let closestHitDist = 500;
    let hitBot: Bot | null = null;
    let isHeadshot = false;

    aliveBots.forEach((bot) => {
      const botCenter = bot.position.clone().add(new THREE.Vector3(0, 1.2, 0));
      const headCenter = bot.position.clone().add(new THREE.Vector3(0, 2.0, 0));

      const ray = raycaster.ray;
      // Head hit sphere check (radius 0.35m)
      const headDist = ray.distanceToPoint(headCenter);
      const bodyDist = ray.distanceToPoint(botCenter);

      const dToOrigin = bot.position.distanceTo(this.camera.position);

      if (headDist < 0.38 && dToOrigin < closestHitDist) {
        closestHitDist = dToOrigin;
        hitBot = bot;
        isHeadshot = true;
      } else if (bodyDist < 0.75 && dToOrigin < closestHitDist) {
        closestHitDist = dToOrigin;
        hitBot = bot;
        isHeadshot = false;
      }
    });

    if (hitBot) {
      // Calculate damage with headshot multiplier
      const multiplier = isHeadshot ? 2.3 : 1.0;
      const dmg = Math.round(cur.config.damage * multiplier);

      this.stats.damageDealt += dmg;
      if (isHeadshot) {
        soundEngine.playHeadshotPing();
      } else {
        soundEngine.playHitmarker();
      }

      this.callbacks.onHitmarker(isHeadshot);

      const isKill = this.botManager.damageBot(
        (hitBot as Bot).id,
        dmg,
        isHeadshot,
        cur.config.name,
        this.callbacks.onKillfeed,
        (deadBot) => {
          this.stats.kills += 1;
          if (this.gameMode === 'DEATHMATCH') {
            this.botManager.tdmState.friendlyScore += 1;
            this.callbacks.onTdmUpdate?.(this.botManager.tdmState);
          }
          this.callbacks.onStatsUpdate({ ...this.stats });

          // Record progression kill XP & feats
          const res = progressionManager.recordKill(cur.config.name, isHeadshot);
          if (this.callbacks.onXpEarned) {
            this.callbacks.onXpEarned(res.popups);
          }
        }
      );

      this.callbacks.onStatsUpdate({ ...this.stats });
    }
  }

  public interactOrEnterVehicle() {
    if (this.activeVehicle && this.activeVehicle.isOccupied) {
      // Exit vehicle
      const veh = this.activeVehicle;
      veh.isOccupied = false;
      this.cameraMode = 'THIRD_PERSON';
      this.playerPos.copy(veh.position).add(new THREE.Vector3(2, 0, 0));
      this.playerPos.y = this.worldData.getTerrainHeight(this.playerPos.x, this.playerPos.z) + 1;
      this.playerMesh.visible = true;
      soundEngine.stopVehicleEngine();
      this.callbacks.onVehiclePrompt(null);
      this.callbacks.onVehicleUpdate?.(null);
      this.activeVehicle = null;
      return;
    }

    // Check if near any vehicle in fleet
    let nearestVeh: Vehicle | null = null;
    let minD = 5.0;
    for (const v of this.vehicles) {
      const d = this.playerPos.distanceTo(v.position);
      if (d < minD) {
        minD = d;
        nearestVeh = v;
      }
    }

    if (nearestVeh) {
      this.activeVehicle = nearestVeh;
      this.activeVehicle.isOccupied = true;
      this.cameraMode = 'VEHICLE';
      this.playerMesh.visible = false;
      soundEngine.startVehicleEngine();
      this.callbacks.onVehiclePrompt(`DRIVING ${nearestVeh.stats.name} (Press F to Dismount • H for Horn)`);
      this.callbacks.onVehicleUpdate?.({
        name: nearestVeh.stats.name,
        speedKmh: nearestVeh.getSpeedKmh(),
        health: nearestVeh.health,
        maxHealth: nearestVeh.stats.maxHealth,
        isOccupied: true,
      });
      return;
    }

    // Check if near airdrop
    if (this.airdropManager.crate && this.airdropManager.crate.isGrounded && !this.airdropManager.crate.hasBeenLooted) {
      const dropPos = new THREE.Vector3(this.airdropManager.crate.x, this.airdropManager.crate.y, this.airdropManager.crate.z);
      if (this.playerPos.distanceTo(dropPos) < 4.0) {
        this.airdropManager.crate.hasBeenLooted = true;
        this.stats.health = 100;
        this.stats.boost = 100;
        this.stats.armor = 100;
        this.stats.helmet = 100;
        this.weapons[1].reserveAmmo += 20; // Extra AWM ammo
        soundEngine.playLootPickup();
        this.callbacks.onStatsUpdate({ ...this.stats });
        this.callbacks.onLootPrompt('Looted Level 3 Gear & AWM Ammo!');
        setTimeout(() => this.callbacks.onLootPrompt(null), 3000);

        // Airdrop objective & XP
        const popups = progressionManager.recordAirdropLooted();
        if (this.callbacks.onXpEarned) {
          this.callbacks.onXpEarned(popups);
        }
      }
    }
  }

  public useMedkit() {
    if (this.stats.health < 100) {
      soundEngine.playUseHeal();
      this.stats.health = Math.min(100, this.stats.health + 75);
      this.callbacks.onStatsUpdate({ ...this.stats });
      this.callbacks.onLootPrompt('Used First Aid Kit (+75 HP)');
      setTimeout(() => this.callbacks.onLootPrompt(null), 2500);
    }
  }

  public useEnergyDrink() {
    soundEngine.playUseHeal();
    this.stats.boost = Math.min(100, this.stats.boost + 40);
    this.callbacks.onStatsUpdate({ ...this.stats });
    this.callbacks.onLootPrompt('Used Energy Drink (+40 Boost)');
    setTimeout(() => this.callbacks.onLootPrompt(null), 2500);
  }

  private animate = () => {
    this.animFrameId = requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.1);

    this.update(delta);

    // Ultra Graphics Engine (Grass animation, water reflections, particles, god rays)
    if (this.ultraGraphics) {
      this.ultraGraphics.update(delta, this.worldData.getTerrainHeight);
    }

    this.renderer.render(this.scene, this.camera);
  };

  private update(delta: number) {
    // 1. Compass Heading Calculation (0 to 360 degrees)
    let headingDeg = ((-this.playerYaw * 180) / Math.PI) % 360;
    if (headingDeg < 0) headingDeg += 360;
    this.callbacks.onCompassHeading(Math.round(headingDeg));

    // 2. Parachute Drop Phase
    if (this.phase === 'PLANE_DROP') {
      this.updateParachuteDrop(delta);
      return;
    }

    if (this.phase !== 'PLAYING') return;

    // Survival time clock
    this.stats.survivalTime += delta;

    // Passive health regeneration from boost bar
    if (this.stats.boost > 0) {
      this.stats.boost = Math.max(0, this.stats.boost - delta * 0.8);
      if (this.stats.health < 100) {
        this.stats.health = Math.min(100, this.stats.health + delta * 1.5);
      }
      this.callbacks.onStatsUpdate({ ...this.stats });
    }

    // 3. Vehicle Handling
    if (this.activeVehicle && this.activeVehicle.isOccupied) {
      const veh = this.activeVehicle;
      veh.update(delta, this.worldData.getTerrainHeight, {
        forward: this.input.forward,
        backward: this.input.backward,
        left: this.input.left,
        right: this.input.right,
        brake: this.input.jump,
      });

      this.playerPos.copy(veh.position);
      const distDelta = Math.abs(veh.speed) * delta;
      this.stats.distanceTraveled += distDelta;

      // Update vehicle UI state
      this.callbacks.onVehicleUpdate?.({
        name: veh.stats.name,
        speedKmh: veh.getSpeedKmh(),
        health: veh.health,
        maxHealth: veh.stats.maxHealth,
        isOccupied: true,
      });

      // Progression drive objective
      const drivePopup = progressionManager.recordDistanceDriven(distDelta);
      if (drivePopup && this.callbacks.onXpEarned) {
        this.callbacks.onXpEarned([drivePopup]);
      }

      // Roadkill check: running over bots
      if (Math.abs(veh.speed) > 7) {
        this.botManager.bots.forEach((bot) => {
          if (bot.isAlive && bot.position.distanceTo(veh.position) < 3.2) {
            this.botManager.damageBot(bot.id, 200, false, `${veh.stats.name} Vehicle`, this.callbacks.onKillfeed, () => {
              this.stats.kills += 1;
              this.callbacks.onStatsUpdate({ ...this.stats });
              const res = progressionManager.recordKill(`${veh.stats.name} Vehicle`, false);
              if (this.callbacks.onXpEarned) {
                this.callbacks.onXpEarned(res.popups);
              }
            });
          }
        });
      }

      // Update Vehicle Camera
      const chaseCamDist = veh.stats.type === 'BRDM' ? 8.5 : veh.stats.type === 'MOTORBIKE' ? 5.5 : 7.0;
      const chaseCamHeight = veh.stats.type === 'BRDM' ? 3.8 : 3.0;
      const camX = veh.position.x - Math.sin(veh.rotationY) * chaseCamDist;
      const camZ = veh.position.z - Math.cos(veh.rotationY) * chaseCamDist;
      const camY = veh.position.y + chaseCamHeight;

      this.camera.position.set(camX, camY, camZ);
      this.camera.lookAt(veh.position.x, veh.position.y + 1.2, veh.position.z);
    } else {
      // 4. On-Foot Movement & Physics
      this.updatePlayerMovement(delta);
      this.updateCamera();
    }

    // 5. Automatic Full-Auto Shooting when fire key held
    if (this.input.fire && this.weapons[this.activeSlot].config.auto) {
      this.shootWeapon();
    }

    // Recoil recovery
    if (this.recoilPitch > 0) {
      const recovery = delta * 0.06;
      this.playerPitch -= Math.min(this.recoilPitch, recovery);
      this.recoilPitch = Math.max(0, this.recoilPitch - recovery);
    }

    // 6. Update Safe Zone & Blue Zone
    const { outsideDamage, isOutside } = this.zoneSystem.update(delta, this.playerPos);
    soundEngine.setOutsideBlueZone(isOutside);
    if (outsideDamage > 0) {
      this.takeDamage(outsideDamage);
    }
    this.callbacks.onZoneUpdate(this.zoneSystem.zone);

    // Zone phase progression check
    const phasePopup = progressionManager.recordZonePhase(this.zoneSystem.zone.phase);
    if (phasePopup && this.callbacks.onXpEarned) {
      this.callbacks.onXpEarned([phasePopup]);
    }

    // 7. Update Airdrop System
    this.airdropManager.update(delta, this.worldData.getTerrainHeight);

    // 8. Update Soldier Bots & AI
    this.botManager.update(
      delta,
      this.playerPos,
      this.worldData.getTerrainHeight,
      (dmg) => {
        this.takeDamage(dmg);
      },
      this.callbacks.onKillfeed
    );

    const aliveCount = this.botManager.getAliveCount() + 1; // +1 for player
    this.callbacks.onAliveUpdate(aliveCount);

    // Squad and TDM synchronization
    if (this.gameMode === 'SQUAD') {
      this.callbacks.onSquadUpdate?.(this.botManager.getSquadMembers(this.playerPos));
    } else if (this.gameMode === 'DEATHMATCH') {
      this.callbacks.onTdmUpdate?.(this.botManager.tdmState);
      if (this.botManager.tdmState.friendlyScore >= this.botManager.tdmState.targetScore) {
        this.triggerVictory();
      } else if (this.botManager.tdmState.enemyScore >= this.botManager.tdmState.targetScore) {
        this.triggerDefeat();
      }
    }

    // Update Proximity & Team Voice Chat System
    let nearestHostilePos: THREE.Vector3 | undefined;
    let nearestHostileDist = 30;
    for (const b of this.botManager.bots) {
      if (b.isAlive) {
        const d = b.position.distanceTo(this.playerPos);
        if (d < nearestHostileDist) {
          nearestHostileDist = d;
          nearestHostilePos = b.position;
        }
      }
    }
    voiceChatSystem.update(delta, this.playerPos, this.playerYaw, nearestHostilePos);

    // Check Victory condition!
    if (aliveCount === 1 && this.phase === 'PLAYING') {
      this.triggerVictory();
    }

    // 9. Check proximity prompts (Vehicles / Ground Loot)
    this.checkProximityPrompts();
  }

  private updateParachuteDrop(delta: number) {
    const terrainY = this.worldData.getTerrainHeight(this.playerPos.x, this.playerPos.z);
    const altAboveGround = this.playerPos.y - terrainY;
    this.callbacks.onParachuteHeight(Math.round(altAboveGround));

    // Auto-deploy parachute at 65m if not yet opened
    if (altAboveGround < 65 && !this.isParachuteOpen) {
      this.deployParachute();
    }

    // Gliding horizontal movement
    const forward = new THREE.Vector3(Math.sin(this.playerYaw), 0, Math.cos(this.playerYaw));
    const glideSpeed = this.isParachuteOpen ? 18 : 34;
    this.playerPos.addScaledVector(forward, -glideSpeed * delta);

    // Fall velocity
    const descentSpeed = this.isParachuteOpen ? 9.0 : 38.0;
    this.playerPos.y -= descentSpeed * delta;

    // Update parachute mesh
    if (this.parachuteMesh) {
      this.parachuteMesh.position.set(this.playerPos.x, this.playerPos.y + 3.8, this.playerPos.z);
    }

    // Touchdown on ground!
    if (this.playerPos.y <= terrainY + 1.2) {
      this.playerPos.y = terrainY + 1.2;
      this.phase = 'PLAYING';
      this.callbacks.onPhaseChange('PLAYING');
      soundEngine.stopWindSound();
      soundEngine.playFootstep(true);

      if (this.parachuteMesh) {
        this.scene.remove(this.parachuteMesh);
        this.parachuteMesh = null;
      }
    }

    // Parachute Chase Cam
    const camDist = this.isParachuteOpen ? 12 : 8;
    this.camera.position.set(
      this.playerPos.x - Math.sin(this.playerYaw) * camDist,
      this.playerPos.y + 4,
      this.playerPos.z - Math.cos(this.playerYaw) * camDist
    );
    this.camera.lookAt(this.playerPos.x, this.playerPos.y + 1, this.playerPos.z);
  }

  private updatePlayerMovement(delta: number) {
    // Base speed modified by stance and sprinting
    let baseSpeed = 5.2; // Walk
    if (this.isSprinting && this.stance === 'STAND') baseSpeed = 8.8; // Sprint
    else if (this.stance === 'CROUCH') baseSpeed = 3.2;
    else if (this.stance === 'PRONE') baseSpeed = 1.4;

    // Boost speed multiplier
    if (this.stats.boost > 60) baseSpeed *= 1.15;

    // Direction vectors
    const forward = new THREE.Vector3(Math.sin(this.playerYaw), 0, Math.cos(this.playerYaw));
    const right = new THREE.Vector3(Math.cos(this.playerYaw), 0, -Math.sin(this.playerYaw));

    const moveDir = new THREE.Vector3();
    if (this.input.forward) moveDir.add(forward.clone().negate());
    if (this.input.backward) moveDir.add(forward);
    if (this.input.left) moveDir.add(right.clone().negate());
    if (this.input.right) moveDir.add(right);

    const isMoving = moveDir.lengthSq() > 0.01;

    if (isMoving) {
      moveDir.normalize();
      this.playerPos.addScaledVector(moveDir, baseSpeed * delta);
      this.stats.distanceTraveled += baseSpeed * delta;

      // Footstep audio cadence
      this.footstepTimer -= delta;
      if (this.footstepTimer <= 0 && this.isGrounded) {
        soundEngine.playFootstep(this.isSprinting);
        this.footstepTimer = this.isSprinting ? 0.32 : 0.52;
      }
    }

    // Gravity & Jump
    const gravity = 22;
    const terrainY = this.worldData.getTerrainHeight(this.playerPos.x, this.playerPos.z);
    const eyeOffset = this.stance === 'PRONE' ? 0.4 : this.stance === 'CROUCH' ? 1.1 : 1.7;

    if (this.input.jump && this.isGrounded && this.stance === 'STAND') {
      this.playerVelocity.y = 7.5;
      this.isGrounded = false;
      soundEngine.playJump();
    }

    this.playerVelocity.y -= gravity * delta;
    this.playerPos.y += this.playerVelocity.y * delta;

    if (this.playerPos.y <= terrainY + eyeOffset) {
      this.playerPos.y = terrainY + eyeOffset;
      this.playerVelocity.y = 0;
      this.isGrounded = true;
    }

    // Update Player Mesh (Position & Rotation)
    this.playerMesh.position.set(this.playerPos.x, this.playerPos.y - eyeOffset, this.playerPos.z);
    this.playerMesh.rotation.y = this.playerYaw + Math.PI;

    // Update Limbs, Joints, Hands Walking / Sprinting IK Animation
    this.updateWalkingAnimation(delta, isMoving);

    // Update First Person Tactical Arms, Gloved Hands, and Weapon Viewmodel
    this.updateFppArms(delta, isMoving);

    // Hide third-person character mesh if First Person or ADS Scope
    this.playerMesh.visible = this.cameraMode === 'THIRD_PERSON' && !this.isAiming;
  }

  private updateCamera() {
    // ADS Zoom FOV
    const activeWeapon = this.weapons[this.activeSlot];
    const targetFov = this.isAiming ? activeWeapon.config.zoomFov : 65;
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, 0.25);
    this.camera.updateProjectionMatrix();

    if (this.cameraMode === 'FIRST_PERSON' || this.isAiming) {
      // First person view right at eye level
      this.camera.position.copy(this.playerPos);
      const lookTarget = this.playerPos.clone().add(
        new THREE.Vector3(
          -Math.sin(this.playerYaw) * Math.cos(this.playerPitch),
          Math.sin(this.playerPitch),
          -Math.cos(this.playerYaw) * Math.cos(this.playerPitch)
        )
      );
      this.camera.lookAt(lookTarget);
    } else {
      // Third Person Over-The-Shoulder Camera (BGMI classic)
      const dist = 3.5;
      const shoulderOffset = 0.65;
      const camHeight = 0.6;

      const cosPitch = Math.cos(this.playerPitch);
      const sinPitch = Math.sin(this.playerPitch);

      const forwardX = -Math.sin(this.playerYaw);
      const forwardZ = -Math.cos(this.playerYaw);
      const rightX = Math.cos(this.playerYaw);
      const rightZ = -Math.sin(this.playerYaw);

      const cx = this.playerPos.x - forwardX * dist * cosPitch + rightX * shoulderOffset;
      const cy = this.playerPos.y + camHeight + sinPitch * dist;
      const cz = this.playerPos.z - forwardZ * dist * cosPitch + rightZ * shoulderOffset;

      this.camera.position.set(cx, cy, cz);

      const lookTarget = this.playerPos.clone().add(new THREE.Vector3(forwardX * 20, sinPitch * 20, forwardZ * 20));
      this.camera.lookAt(lookTarget);
    }
  }

  private checkProximityPrompts() {
    if (this.activeVehicle && this.activeVehicle.isOccupied) return;

    // Check fleet vehicle distance
    let nearVehPrompt: string | null = null;
    for (const veh of this.vehicles) {
      const distToVehicle = this.playerPos.distanceTo(veh.position);
      if (distToVehicle < 4.5) {
        nearVehPrompt = `Press [F] or Tap [DRIVE] to enter ${veh.stats.name}`;
        break;
      }
    }

    if (nearVehPrompt) {
      this.callbacks.onVehiclePrompt(nearVehPrompt);
      return;
    } else {
      this.callbacks.onVehiclePrompt(null);
    }

    // Check Ground Loot
    let foundLoot = false;
    for (const loot of this.worldData.lootItems) {
      const d = Math.sqrt((this.playerPos.x - loot.x) ** 2 + (this.playerPos.z - loot.z) ** 2);
      if (d < 2.5) {
        foundLoot = true;
        this.callbacks.onLootPrompt(`Press [F] to pick up ${loot.name}`);
        break;
      }
    }
    if (!foundLoot) {
      this.callbacks.onLootPrompt(null);
    }
  }

  public takeDamage(amount: number) {
    if (this.phase !== 'PLAYING') return;

    // Armor absorbs 45% of incoming bullet damage
    let finalDmg = amount;
    if (this.stats.armor > 0) {
      const absorbed = amount * 0.45;
      this.stats.armor = Math.max(0, this.stats.armor - absorbed);
      finalDmg = amount * 0.55;
    }

    this.stats.health = Math.max(0, this.stats.health - finalDmg);
    this.callbacks.onDamageTaken(Math.round(finalDmg));
    this.callbacks.onStatsUpdate({ ...this.stats });

    if (this.stats.health <= 0) {
      if (this.gameMode === 'DEATHMATCH') {
        this.botManager.tdmState.enemyScore += 1;
        this.callbacks.onTdmUpdate?.(this.botManager.tdmState);
        this.callbacks.onKillfeed({
          id: `kill_tdm_${Date.now()}`,
          killer: 'Hostile Operator',
          victim: 'Player (You)',
          weapon: 'M416',
          isHeadshot: false,
          isPlayerKiller: false,
          isPlayerVictim: true,
          time: Date.now(),
        });
        if (this.botManager.tdmState.enemyScore >= this.botManager.tdmState.targetScore) {
          this.triggerDefeat();
        } else {
          // Tactical respawn in TDM
          this.stats.health = 100;
          this.stats.armor = 100;
          this.stats.helmet = 100;
          this.callbacks.onStatsUpdate({ ...this.stats });
          this.startTdmSpawn();
        }
      } else {
        this.triggerDefeat();
      }
    }
  }

  private triggerDefeat() {
    this.phase = 'DEFEAT';
    this.callbacks.onPhaseChange('DEFEAT');
    soundEngine.stopVehicleEngine();
    soundEngine.stopWindSound();
    soundEngine.setOutsideBlueZone(false);

    const rank = this.botManager.getAliveCount() + 1;
    progressionManager.recordMatchEnd(false, rank, this.stats.survivalTime);

    this.callbacks.onKillfeed({
      id: `kill_player_dead`,
      killer: 'Hostile Forces',
      victim: 'Player (You)',
      weapon: 'Eliminated',
      isHeadshot: false,
      isPlayerKiller: false,
      isPlayerVictim: true,
      time: Date.now(),
    });
  }

  private triggerVictory() {
    this.phase = 'VICTORY';
    this.callbacks.onPhaseChange('VICTORY');
    soundEngine.stopVehicleEngine();
    soundEngine.stopWindSound();
    soundEngine.setOutsideBlueZone(false);
    soundEngine.playVictoryFanfare();

    progressionManager.recordMatchEnd(true, 1, this.stats.survivalTime);
    if (this.callbacks.onXpEarned) {
      this.callbacks.onXpEarned(['+500 XP Winner Winner Chicken Dinner!']);
    }
  }

  public restartGame() {
    this.stats = {
      health: 100,
      maxHealth: 100,
      boost: 60,
      armor: 100,
      helmet: 100,
      kills: 0,
      damageDealt: 0,
      survivalTime: 0,
      distanceTraveled: 0,
    };
    this.applyActiveBoosts();
    this.weapons.forEach((w) => {
      w.currentAmmo = w.config.magazineSize;
      w.reserveAmmo = w.config.magazineSize * 5;
      w.isReloading = false;
    });
    this.callbacks.onStatsUpdate({ ...this.stats });
    this.callbacks.onWeaponUpdate(this.weapons[this.activeSlot], this.activeSlot);

    // Reset bots
    this.botManager.bots.forEach((b) => this.scene.remove(b.mesh));
    this.botManager.bots = [];
    const botCount = this.gameMode === 'SQUAD' ? 45 : this.gameMode === 'DEATHMATCH' ? 8 : this.gameMode === 'SNIPER_ARENA' ? 30 : 60;
    this.botManager.spawnBots(botCount, this.worldData.getTerrainHeight, new THREE.Vector3(0, 0, 0), this.gameMode);

    // Reset vehicles
    this.vehicles.forEach((v) => this.scene.remove(v.mesh));
    this.activeVehicle = null;
    this.spawnVehicleFleet();

    // Reset spawn / drop phase
    if (this.gameMode === 'DEATHMATCH') {
      this.startTdmSpawn();
    } else {
      this.isParachuteOpen = false;
      this.startDropPhase();
    }
  }

  public setGraphicsQuality(preset: GraphicsPreset) {
    this.graphicsPreset = preset;
    if (this.ultraGraphics) {
      this.ultraGraphics.applyPreset(preset, this.renderer, this.worldData.getTerrainHeight);
    }
  }

  public dispose() {
    cancelAnimationFrame(this.animFrameId);
    window.removeEventListener('resize', this.onResize);
    soundEngine.stopVehicleEngine();
    soundEngine.stopWindSound();
    soundEngine.setOutsideBlueZone(false);
    if (this.ultraGraphics) {
      this.ultraGraphics.dispose();
    }
    if (this.renderer.domElement && this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
