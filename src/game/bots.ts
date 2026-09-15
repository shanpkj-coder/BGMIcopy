import * as THREE from 'three';
import { soundEngine } from '../audio/soundEngine';
import { KillfeedEntry, GameMode, SquadMember, TdmState } from '../types/game';

export interface Bot {
  id: string;
  name: string;
  mesh: THREE.Group;
  position: THREE.Vector3;
  targetPos: THREE.Vector3;
  health: number;
  maxHealth: number;
  isAlive: boolean;
  state: 'PATROL' | 'COMBAT' | 'TAKING_COVER';
  fireTimer: number;
  moveSpeed: number;
  weaponName: string;
  isTargetingPlayer: boolean;
  team: 'FRIENDLY' | 'ENEMY';
  squadIndex?: number; // 2, 3, 4
  respawnTime?: number;
}

const BOT_NAMES = [
  'Viper_Sniper',
  'Ghost_Alpha',
  'Pabji_King',
  'Delta_Hunter',
  'Shadow_99',
  'Ragnarok_OP',
  'Hawk_Eye',
  'Titan_Soldier',
  'Falcon_Ace',
  'Commando_Pro',
  'Raven_Shooter',
  'Dynamo_Gamer',
  'Mortal_Strike',
  'Scout_Elite',
  'Jonathan_Aim',
  'Nova_Stalker',
  'Spectre_Ops',
  'Apex_Predator',
];

export class BotManager {
  public bots: Bot[] = [];
  public deathCrates: THREE.Group[] = [];
  public gameMode: GameMode = 'SQUAD';
  public tdmState: TdmState = {
    friendlyScore: 0,
    enemyScore: 0,
    targetScore: 40,
    timeLeft: 600,
    streak: 0,
    respawnCountdown: 0,
  };

  private scene: THREE.Scene;
  private tracerMaterial: THREE.LineBasicMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.tracerMaterial = new THREE.LineBasicMaterial({ color: 0xfacc15, linewidth: 2 });
  }

  public spawnBots(
    count: number,
    getTerrainHeight: (x: number, z: number) => number,
    playerStartPos: THREE.Vector3,
    mode: GameMode = 'SQUAD'
  ) {
    this.gameMode = mode;
    this.bots = [];

    const isTdm = mode === 'DEATHMATCH';
    const isSniper = mode === 'SNIPER_ARENA';

    const enemyWeapons = isSniper
      ? ['AWM', 'KAR98K']
      : isTdm
      ? ['M416', 'BERYL_M762', 'AKM', 'SCAR_L', 'UZI', 'VECTOR']
      : ['M416', 'AKM', 'SCAR_L', 'BERYL_M762', 'KAR98K', 'UZI', 'S12K', 'M249'];

    // 1. In SQUAD mode, spawn 3 Friendly AI Squadmates
    if (mode === 'SQUAD') {
      const squadmates = [
        { name: 'Alpha_Raptor', callsign: 'SQ-02 ALPHA', num: 2, weapon: 'M416' },
        { name: 'Bravo_Ghost', callsign: 'SQ-03 BRAVO', num: 3, weapon: 'AKM' },
        { name: 'Charlie_Medic', callsign: 'SQ-04 CHARLIE', num: 4, weapon: 'SCAR_L' },
      ];

      squadmates.forEach((sq, idx) => {
        const offsetAngle = (idx * Math.PI * 2) / 3;
        const x = playerStartPos.x + Math.cos(offsetAngle) * (6 + idx * 2);
        const z = playerStartPos.z + Math.sin(offsetAngle) * (6 + idx * 2);
        const y = getTerrainHeight(x, z);

        const mesh = this.createSoldierMesh(true, true);
        mesh.position.set(x, y, z);
        this.scene.add(mesh);

        this.bots.push({
          id: `squadmate_${sq.num}`,
          name: sq.name,
          mesh,
          position: new THREE.Vector3(x, y, z),
          targetPos: new THREE.Vector3(x, y, z),
          health: 100,
          maxHealth: 100,
          isAlive: true,
          state: 'PATROL',
          fireTimer: 1.0,
          moveSpeed: 5.5,
          weaponName: sq.weapon,
          isTargetingPlayer: false,
          team: 'FRIENDLY',
          squadIndex: sq.num,
        });
      });
    }

    // 2. In DEATHMATCH mode, spawn 3 Friendly Bots and 4 Enemy Bots inside Warehouse
    if (isTdm) {
      // 3 Friendly Teammates in Blue Base (z = -60)
      for (let i = 0; i < 3; i++) {
        const x = -30 + i * 30;
        const z = -65;
        const y = getTerrainHeight(x, z);
        const mesh = this.createSoldierMesh(false, true);
        mesh.position.set(x, y, z);
        this.scene.add(mesh);

        this.bots.push({
          id: `tdm_friendly_${i}`,
          name: `TeamAlpha_${i + 2}`,
          mesh,
          position: new THREE.Vector3(x, y, z),
          targetPos: new THREE.Vector3(x + (Math.random() - 0.5) * 40, y, 0),
          health: 100,
          maxHealth: 100,
          isAlive: true,
          state: 'COMBAT',
          fireTimer: Math.random(),
          moveSpeed: 5.0,
          weaponName: enemyWeapons[i % enemyWeapons.length],
          isTargetingPlayer: false,
          team: 'FRIENDLY',
        });
      }

      // 4 Enemy Bots in Red Base (z = 60)
      for (let i = 0; i < 4; i++) {
        const x = -40 + i * 26;
        const z = 65;
        const y = getTerrainHeight(x, z);
        const mesh = this.createSoldierMesh(true, false);
        mesh.position.set(x, y, z);
        this.scene.add(mesh);

        this.bots.push({
          id: `tdm_enemy_${i}`,
          name: `EnemyRed_${i + 1}`,
          mesh,
          position: new THREE.Vector3(x, y, z),
          targetPos: new THREE.Vector3(x + (Math.random() - 0.5) * 40, y, 0),
          health: 100,
          maxHealth: 100,
          isAlive: true,
          state: 'COMBAT',
          fireTimer: Math.random(),
          moveSpeed: 5.0,
          weaponName: enemyWeapons[(i + 2) % enemyWeapons.length],
          isTargetingPlayer: false,
          team: 'ENEMY',
        });
      }
      return;
    }

    // 3. Standard Battle Royale & Sniper Arena enemies
    const enemyCount = isSniper ? 30 : count;
    for (let i = 0; i < enemyCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 35 + Math.random() * 340;
      const x = playerStartPos.x + Math.cos(angle) * dist;
      const z = playerStartPos.z + Math.sin(angle) * dist;
      const y = getTerrainHeight(x, z);

      if (y < 2) continue;

      const mesh = this.createSoldierMesh(i % 3 === 0, false);
      mesh.position.set(x, y, z);
      this.scene.add(mesh);

      const name = BOT_NAMES[i % BOT_NAMES.length] + (i >= BOT_NAMES.length ? `_${i}` : '');
      const weapon = enemyWeapons[i % enemyWeapons.length];

      this.bots.push({
        id: `bot_${i}`,
        name,
        mesh,
        position: new THREE.Vector3(x, y, z),
        targetPos: new THREE.Vector3(x + (Math.random() - 0.5) * 40, y, z + (Math.random() - 0.5) * 40),
        health: 100,
        maxHealth: 100,
        isAlive: true,
        state: 'PATROL',
        fireTimer: Math.random() * 2,
        moveSpeed: 3.5 + Math.random() * 1.8,
        weaponName: weapon,
        isTargetingPlayer: false,
        team: 'ENEMY',
      });
    }
  }

  private createSoldierMesh(isElite: boolean, isFriendly: boolean): THREE.Group {
    const group = new THREE.Group();

    // Friendly team wears bright blue tactical accents; Enemy wears dark camo/red
    const camoColor = isFriendly ? 0x2b3d54 : isElite ? 0x2e352b : 0x3f4a38;
    const vestColor = isFriendly ? 0x1d4ed8 : isElite ? 0x1c1e1b : 0x4a4e44;
    const skinColor = 0xc49a7a;

    const suitMat = new THREE.MeshStandardMaterial({ color: camoColor, roughness: 0.8 });
    const vestMat = new THREE.MeshStandardMaterial({ color: vestColor, roughness: 0.6 });
    const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.7 });
    const gunMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 });

    // Torso & Tactical Vest
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.4), vestMat);
    torso.position.y = 1.35;
    torso.castShadow = true;
    group.add(torso);

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), skinMat);
    head.position.y = 1.95;
    group.add(head);

    // Helmet
    const helmetMat = new THREE.MeshStandardMaterial({
      color: isFriendly ? 0x2563eb : isElite ? 0x111827 : 0x374151,
      roughness: 0.4,
      metalness: 0.5,
    });
    const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.28, 0.42), helmetMat);
    helmet.position.y = 2.12;
    group.add(helmet);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.28, 0.9, 0.32);
    const legL = new THREE.Mesh(legGeo, suitMat);
    legL.position.set(-0.2, 0.45, 0);
    legL.castShadow = true;
    const legR = new THREE.Mesh(legGeo, suitMat);
    legR.position.set(0.2, 0.45, 0);
    legR.castShadow = true;
    group.add(legL, legR);

    // Weapon
    const gun = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.8), gunMat);
    gun.position.set(0.3, 1.25, 0.45);
    group.add(gun);

    return group;
  }

  public update(
    delta: number,
    playerPos: THREE.Vector3,
    getTerrainHeight: (x: number, z: number) => number,
    onPlayerHit: (damage: number) => void,
    addKillfeed: (entry: KillfeedEntry) => void
  ) {
    const isTdm = this.gameMode === 'DEATHMATCH';

    // Handle TDM Respawns & Timer
    if (isTdm) {
      this.tdmState.timeLeft = Math.max(0, this.tdmState.timeLeft - delta);
      this.bots.forEach((bot) => {
        if (!bot.isAlive && bot.respawnTime) {
          bot.respawnTime -= delta;
          if (bot.respawnTime <= 0) {
            // Respawn at team base
            bot.isAlive = true;
            bot.health = bot.maxHealth;
            bot.mesh.visible = true;
            const spawnZ = bot.team === 'FRIENDLY' ? -65 : 65;
            bot.position.set((Math.random() - 0.5) * 60, getTerrainHeight(0, spawnZ), spawnZ);
            bot.mesh.position.copy(bot.position);
          }
        }
      });
    }

    this.bots.forEach((bot) => {
      if (!bot.isAlive) return;

      if (bot.team === 'FRIENDLY') {
        // Friendly squadmate AI: Follow player or seek nearest enemy
        const distToPlayer = bot.position.distanceTo(playerPos);
        const nearestEnemy = this.bots.find((e) => e.team === 'ENEMY' && e.isAlive && e.position.distanceTo(bot.position) < 45);

        if (nearestEnemy) {
          bot.mesh.lookAt(nearestEnemy.position.x, bot.position.y, nearestEnemy.position.z);
          bot.fireTimer -= delta;
          if (bot.fireTimer <= 0) {
            bot.fireTimer = 0.4 + Math.random() * 0.5;
            this.createBulletTracer(bot.position.clone().add(new THREE.Vector3(0, 1.3, 0)), nearestEnemy.position);
            soundEngine.playGunshotForWeapon(bot.weaponName);
            nearestEnemy.health -= 18;
            if (nearestEnemy.health <= 0) {
              this.eliminateBot(nearestEnemy, bot.name, bot.weaponName, false, addKillfeed);
              if (isTdm) this.tdmState.friendlyScore += 1;
            }
          }
        } else if (distToPlayer > 10) {
          // Move towards player
          const dir = new THREE.Vector3().subVectors(playerPos, bot.position).normalize();
          bot.position.addScaledVector(dir, bot.moveSpeed * delta);
          bot.mesh.lookAt(bot.position.x + dir.x, bot.position.y, bot.position.z + dir.z);
        }
        const y = getTerrainHeight(bot.position.x, bot.position.z);
        bot.position.y = y;
        bot.mesh.position.copy(bot.position);
        return;
      }

      // Enemy Bot AI
      const distToPlayer = bot.position.distanceTo(playerPos);
      const canSeePlayer = distToPlayer < (isTdm ? 60 : 50);

      if (canSeePlayer) {
        bot.state = 'COMBAT';
        bot.isTargetingPlayer = true;
        bot.mesh.lookAt(playerPos.x, bot.position.y, playerPos.z);

        bot.fireTimer -= delta;
        if (bot.fireTimer <= 0) {
          bot.fireTimer = 0.5 + Math.random() * 0.8;
          const tracerStart = bot.position.clone().add(new THREE.Vector3(0, 1.3, 0));
          this.createBulletTracer(tracerStart, playerPos);
          soundEngine.playGunshotForWeapon(bot.weaponName);

          const hitChance = Math.max(0.12, 0.45 - distToPlayer * 0.006);
          if (Math.random() < hitChance) {
            const dmg = 8 + Math.floor(Math.random() * 10);
            onPlayerHit(dmg);
          }
        }

        if (distToPlayer > 15) {
          const dir = new THREE.Vector3().subVectors(playerPos, bot.position).normalize();
          bot.position.addScaledVector(dir, bot.moveSpeed * delta * 0.6);
        }
      } else {
        const dir = new THREE.Vector3().subVectors(bot.targetPos, bot.position);
        dir.y = 0;
        const dist = dir.length();
        if (dist > 2) {
          dir.normalize();
          bot.position.addScaledVector(dir, bot.moveSpeed * delta);
          bot.mesh.lookAt(bot.position.x + dir.x, bot.position.y, bot.position.z + dir.z);
        }
      }

      const y = getTerrainHeight(bot.position.x, bot.position.z);
      bot.position.y = y;
      bot.mesh.position.copy(bot.position);
    });

    // Random background bot skirmish kills in classic BR
    if (!isTdm && Math.random() < 0.025 && this.getAliveCount() > 5) {
      this.simulateBotSkirmish(addKillfeed);
    }
  }

  private createBulletTracer(start: THREE.Vector3, target: THREE.Vector3) {
    const end = target.clone().add(new THREE.Vector3((Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5));
    const geo = new THREE.BufferGeometry().setFromPoints([start, end]);
    const line = new THREE.Line(geo, this.tracerMaterial);
    this.scene.add(line);

    setTimeout(() => {
      this.scene.remove(line);
      geo.dispose();
    }, 80);
  }

  public damageBot(
    botId: string,
    damage: number,
    isHeadshot: boolean,
    playerWeapon: string,
    addKillfeed: (entry: KillfeedEntry) => void,
    onEliminated?: (bot: Bot) => void
  ): boolean {
    const bot = this.bots.find((b) => b.id === botId && b.isAlive);
    if (!bot) return false;

    bot.health -= damage;
    bot.state = 'COMBAT';
    bot.isTargetingPlayer = true;

    // Flash red
    bot.mesh.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).material) {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        const origColor = mat.color.getHex();
        mat.color.setHex(0xff0000);
        setTimeout(() => mat.color.setHex(origColor), 100);
      }
    });

    if (bot.health <= 0) {
      bot.isAlive = false;
      this.eliminateBot(bot, 'Player (You)', playerWeapon, isHeadshot, addKillfeed);
      if (this.gameMode === 'DEATHMATCH') {
        this.tdmState.friendlyScore += 1;
        this.tdmState.streak += 1;
        bot.respawnTime = 3.0; // 3 sec respawn
        bot.mesh.visible = false;
      }
      if (onEliminated) onEliminated(bot);
      return true;
    }

    return false;
  }

  private eliminateBot(
    bot: Bot,
    killer: string,
    weapon: string,
    isHeadshot: boolean,
    addKillfeed: (entry: KillfeedEntry) => void
  ) {
    if (this.gameMode !== 'DEATHMATCH') {
      bot.mesh.visible = false;
      this.spawnDeathLootCrate(bot.position);
    }

    addKillfeed({
      id: `kill_${Date.now()}_${Math.random()}`,
      killer,
      victim: bot.name,
      weapon,
      isHeadshot,
      isPlayerKiller: killer.includes('You'),
      isPlayerVictim: false,
      time: Date.now(),
    });
  }

  private spawnDeathLootCrate(pos: THREE.Vector3) {
    const crateGroup = new THREE.Group();
    crateGroup.position.copy(pos);

    const boxMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });
    const crate = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.2), boxMat);
    crate.position.y = 0.4;
    crate.castShadow = true;
    crateGroup.add(crate);

    const light = new THREE.PointLight(0x22c55e, 1.5, 6);
    light.position.y = 1.0;
    crateGroup.add(light);

    this.scene.add(crateGroup);
    this.deathCrates.push(crateGroup);
  }

  private simulateBotSkirmish(addKillfeed: (entry: KillfeedEntry) => void) {
    const aliveBots = this.bots.filter((b) => b.isAlive && b.team === 'ENEMY');
    if (aliveBots.length < 2) return;

    const killerIdx = Math.floor(Math.random() * aliveBots.length);
    let victimIdx = Math.floor(Math.random() * aliveBots.length);
    while (victimIdx === killerIdx) {
      victimIdx = Math.floor(Math.random() * aliveBots.length);
    }

    const killer = aliveBots[killerIdx];
    const victim = aliveBots[victimIdx];

    victim.isAlive = false;
    victim.mesh.visible = false;
    this.spawnDeathLootCrate(victim.position);

    addKillfeed({
      id: `bot_kill_${Date.now()}_${Math.random()}`,
      killer: killer.name,
      victim: victim.name,
      weapon: killer.weaponName,
      isHeadshot: Math.random() < 0.25,
      isPlayerKiller: false,
      isPlayerVictim: false,
      time: Date.now(),
    });
  }

  public getAliveCount(): number {
    return this.bots.filter((b) => b.isAlive && b.team === 'ENEMY').length + 1;
  }

  public getSquadMembers(playerPos: THREE.Vector3): SquadMember[] {
    return this.bots
      .filter((b) => b.team === 'FRIENDLY')
      .map((b) => ({
        id: b.id,
        name: b.name,
        callsign: `SQ-0${b.squadIndex || 2}`,
        number: b.squadIndex || 2,
        health: b.health,
        maxHealth: b.maxHealth,
        isAlive: b.isAlive,
        isKnocked: !b.isAlive,
        kills: 1,
        distance: Math.round(b.position.distanceTo(playerPos)),
        status: b.isAlive ? (b.state === 'COMBAT' ? 'ENGAGING' : 'FOLLOWING') : 'DOWNED',
      }));
  }
}
