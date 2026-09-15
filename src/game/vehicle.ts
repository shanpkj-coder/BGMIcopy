import * as THREE from 'three';
import { soundEngine } from '../audio/soundEngine';
import { VehicleType } from '../types/game';

export interface VehicleStats {
  type: VehicleType;
  name: string;
  maxSpeed: number; // m/s
  accel: number;
  brakePower: number;
  health: number;
  maxHealth: number;
  seats: number;
  steerResponsiveness: number;
}

export const VEHICLE_CONFIGS: Record<VehicleType, Omit<VehicleStats, 'health'>> = {
  BUGGY: {
    type: 'BUGGY',
    name: 'Desert Dune Buggy',
    maxSpeed: 28, // ~100 km/h
    accel: 18,
    brakePower: 30,
    maxHealth: 180,
    seats: 2,
    steerResponsiveness: 2.5,
  },
  UAZ: {
    type: 'UAZ',
    name: 'Military UAZ 4x4',
    maxSpeed: 25, // ~90 km/h
    accel: 14,
    brakePower: 26,
    maxHealth: 320,
    seats: 4,
    steerResponsiveness: 2.1,
  },
  DACIA: {
    type: 'DACIA',
    name: 'Dacia 1300 Sedan',
    maxSpeed: 33, // ~120 km/h
    accel: 17,
    brakePower: 28,
    maxHealth: 220,
    seats: 4,
    steerResponsiveness: 2.4,
  },
  MOTORBIKE: {
    type: 'MOTORBIKE',
    name: 'Tactical Two-Wheeler',
    maxSpeed: 38, // ~137 km/h
    accel: 26,
    brakePower: 34,
    maxHealth: 130,
    seats: 2,
    steerResponsiveness: 3.4,
  },
  BRDM: {
    type: 'BRDM',
    name: 'Armored BRDM-2 APC',
    maxSpeed: 22, // ~80 km/h
    accel: 11,
    brakePower: 22,
    maxHealth: 600,
    seats: 4,
    steerResponsiveness: 1.6,
  },
};

export class Vehicle {
  public mesh: THREE.Group;
  public position: THREE.Vector3;
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public rotationY: number = 0;
  public rollAngle: number = 0; // for motorbike banking
  public speed: number = 0; // Current speed in m/s
  public steerAngle: number = 0;
  public isOccupied: boolean = false;
  public type: VehicleType;
  public stats: VehicleStats;
  public health: number;

  private wheels: THREE.Mesh[] = [];
  private handlebars: THREE.Group | null = null;

  constructor(
    scene: THREE.Scene,
    startX: number,
    startZ: number,
    type: VehicleType = 'BUGGY',
    getTerrainHeight: (x: number, z: number) => number
  ) {
    this.type = type;
    const cfg = VEHICLE_CONFIGS[type];
    this.stats = { ...cfg, health: cfg.maxHealth };
    this.health = cfg.maxHealth;

    const y = getTerrainHeight(startX, startZ);
    this.position = new THREE.Vector3(startX, y + 0.8, startZ);

    this.mesh = this.buildVehicleMesh(type);
    this.mesh.position.copy(this.position);
    scene.add(this.mesh);
  }

  private buildVehicleMesh(type: VehicleType): THREE.Group {
    switch (type) {
      case 'UAZ':
        return this.createUazMesh();
      case 'DACIA':
        return this.createDaciaMesh();
      case 'MOTORBIKE':
        return this.createMotorbikeMesh();
      case 'BRDM':
        return this.createBrdmMesh();
      case 'BUGGY':
      default:
        return this.createBuggyMesh();
    }
  }

  /**
   * 1. DESERT BUGGY: Open cage, big knobby rear tires, exposed engine
   */
  private createBuggyMesh(): THREE.Group {
    const group = new THREE.Group();
    const chassisMat = new THREE.MeshStandardMaterial({ color: 0x5a6344, metalness: 0.4, roughness: 0.6 });
    const cageMat = new THREE.MeshStandardMaterial({ color: 0x1f2421, metalness: 0.8, roughness: 0.3 });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.7, roughness: 0.3 });

    // Chassis frame
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4, 4.0), chassisMat);
    chassis.position.y = 0.4;
    chassis.castShadow = true;
    group.add(chassis);

    // Cockpit seats
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
    const seatL = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.7), seatMat);
    seatL.position.set(-0.5, 0.8, -0.2);
    const seatR = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.7), seatMat);
    seatR.position.set(0.5, 0.8, -0.2);
    group.add(seatL, seatR);

    // Steering wheel
    const steeringWheel = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 8, 16), new THREE.MeshStandardMaterial({ color: 0x111111 }));
    steeringWheel.position.set(-0.5, 1.1, 0.4);
    steeringWheel.rotation.x = Math.PI / 4;
    group.add(steeringWheel);

    // Roll cage tubular frame
    const barGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.8, 6);
    [[-1, 1.2, 0.8], [1, 1.2, 0.8], [-1, 1.2, -1.0], [1, 1.2, -1.0]].forEach(([bx, by, bz]) => {
      const bar = new THREE.Mesh(barGeo, cageMat);
      bar.position.set(bx, by, bz);
      group.add(bar);
    });

    const roofL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 2.0), cageMat);
    roofL.position.set(-1.0, 2.0, -0.1);
    const roofR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 2.0), cageMat);
    roofR.position.set(1.0, 2.0, -0.1);
    group.add(roofL, roofR);

    // Engine block
    const engine = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 1.2), new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9 }));
    engine.position.set(0, 0.8, -1.4);
    group.add(engine);

    // Wheels
    const wheelPositions = [
      { x: -1.3, y: 0.45, z: 1.4 },
      { x: 1.3, y: 0.45, z: 1.4 },
      { x: -1.3, y: 0.55, z: -1.4 },
      { x: 1.3, y: 0.55, z: -1.4 },
    ];
    wheelPositions.forEach((wp, idx) => {
      const radius = idx < 2 ? 0.45 : 0.55;
      const tire = this.createWheelMesh(radius, 0.35, tireMat, rimMat);
      tire.position.set(wp.x, wp.y, wp.z);
      group.add(tire);
      this.wheels.push(tire);
    });

    return group;
  }

  /**
   * 2. MILITARY UAZ: Enclosed green 4x4, spare tire, winch bumper
   */
  private createUazMesh(): THREE.Group {
    const group = new THREE.Group();
    const uazGreen = new THREE.MeshStandardMaterial({ color: 0x3b4a2b, roughness: 0.7, metalness: 0.3 });
    const darkMetal = new THREE.MeshStandardMaterial({ color: 0x1a1d17, roughness: 0.4, metalness: 0.8 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x88bbdd, roughness: 0.1, metalness: 0.9, opacity: 0.6, transparent: true });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.9 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x4a4e44, metalness: 0.7, roughness: 0.4 });

    // Main lower body
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.9, 4.4), uazGreen);
    body.position.y = 0.75;
    body.castShadow = true;
    group.add(body);

    // Cabin roof enclosure
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.85, 2.6), uazGreen);
    cabin.position.set(0, 1.6, -0.3);
    cabin.castShadow = true;
    group.add(cabin);

    // Windshield
    const windshield = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.65), glassMat);
    windshield.position.set(0, 1.5, 1.02);
    windshield.rotation.x = -0.2;
    group.add(windshield);

    // Front grille and heavy bullbar
    const bullbar = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.6, 0.3), darkMetal);
    bullbar.position.set(0, 0.6, 2.3);
    group.add(bullbar);

    // Headlights
    const hlMat = new THREE.MeshBasicMaterial({ color: 0xfff4d0 });
    const hlL = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.1, 12), hlMat);
    hlL.rotation.x = Math.PI / 2;
    hlL.position.set(-0.7, 0.8, 2.25);
    const hlR = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.1, 12), hlMat);
    hlR.rotation.x = Math.PI / 2;
    hlR.position.set(0.7, 0.8, 2.25);
    group.add(hlL, hlR);

    // Spare tire on back door
    const spare = this.createWheelMesh(0.48, 0.32, tireMat, rimMat);
    spare.rotation.y = Math.PI / 2;
    spare.position.set(0, 1.1, -2.35);
    group.add(spare);

    // 4 Heavy duty wheels
    const wheelPositions = [
      { x: -1.2, y: 0.5, z: 1.4 },
      { x: 1.2, y: 0.5, z: 1.4 },
      { x: -1.2, y: 0.5, z: -1.4 },
      { x: 1.2, y: 0.5, z: -1.4 },
    ];
    wheelPositions.forEach((wp) => {
      const tire = this.createWheelMesh(0.5, 0.36, tireMat, rimMat);
      tire.position.set(wp.x, wp.y, wp.z);
      group.add(tire);
      this.wheels.push(tire);
    });

    return group;
  }

  /**
   * 3. DACIA 1300 SEDAN: Metallic blue, low road profile, 4 doors
   */
  private createDaciaMesh(): THREE.Group {
    const group = new THREE.Group();
    const daciaBlue = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.3, metalness: 0.7 });
    const chrome = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.95, roughness: 0.1 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0xa5f3fc, roughness: 0.1, metalness: 0.9, opacity: 0.5, transparent: true });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.8, roughness: 0.2 });

    // Lower chassis
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.6, 4.2), daciaBlue);
    body.position.y = 0.5;
    body.castShadow = true;
    group.add(body);

    // Cabin greenhouse
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.65, 2.2), daciaBlue);
    cabin.position.set(0, 1.05, -0.2);
    cabin.castShadow = true;
    group.add(cabin);

    // Sloped windshield
    const ws = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.65), glassMat);
    ws.position.set(0, 1.05, 0.95);
    ws.rotation.x = -0.4;
    group.add(ws);

    // Chrome bumpers
    const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.18, 0.15), chrome);
    frontBumper.position.set(0, 0.35, 2.15);
    const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.18, 0.15), chrome);
    rearBumper.position.set(0, 0.35, -2.15);
    group.add(frontBumper, rearBumper);

    // Wheels
    const wheelPositions = [
      { x: -1.1, y: 0.38, z: 1.3 },
      { x: 1.1, y: 0.38, z: 1.3 },
      { x: -1.1, y: 0.38, z: -1.3 },
      { x: 1.1, y: 0.38, z: -1.3 },
    ];
    wheelPositions.forEach((wp) => {
      const tire = this.createWheelMesh(0.4, 0.28, tireMat, rimMat);
      tire.position.set(wp.x, wp.y, wp.z);
      group.add(tire);
      this.wheels.push(tire);
    });

    return group;
  }

  /**
   * 4. TACTICAL MOTORBIKE: High speed 2-wheeler with handlebars and fork
   */
  private createMotorbikeMesh(): THREE.Group {
    const group = new THREE.Group();
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, metalness: 0.6, roughness: 0.4 }); // Crimson bike frame
    const engineMat = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.9, roughness: 0.2 });
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.8 });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 }); // Gold spoke rims

    // Frame body
    const mainFrame = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 1.8), frameMat);
    mainFrame.position.y = 0.8;
    group.add(mainFrame);

    // Engine block
    const engine = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.4, 0.8), engineMat);
    engine.position.set(0, 0.45, 0.1);
    group.add(engine);

    // Dual exhaust pipe
    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 8), engineMat);
    exhaust.rotation.x = Math.PI / 2 - 0.2;
    exhaust.position.set(0.3, 0.5, -0.7);
    group.add(exhaust);

    // Leather seat
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 0.9), seatMat);
    seat.position.set(0, 1.1, -0.3);
    group.add(seat);

    // Steering Handlebars
    this.handlebars = new THREE.Group();
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.06, 0.06), engineMat);
    bar.position.set(0, 1.35, 0.65);
    const hl = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 12), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    hl.rotation.x = Math.PI / 2;
    hl.position.set(0, 1.25, 0.75);
    this.handlebars.add(bar, hl);
    group.add(this.handlebars);

    // Two inline wheels: Front (z = 1.3), Rear (z = -1.1)
    const frontWheel = this.createWheelMesh(0.46, 0.22, tireMat, rimMat);
    frontWheel.position.set(0, 0.46, 1.35);
    group.add(frontWheel);
    this.wheels.push(frontWheel);

    const rearWheel = this.createWheelMesh(0.46, 0.25, tireMat, rimMat);
    rearWheel.position.set(0, 0.46, -1.15);
    group.add(rearWheel);
    this.wheels.push(rearWheel);

    return group;
  }

  /**
   * 5. ARMORED BRDM-2: Heavy 8-ton amphibious bullet-resistant APC
   */
  private createBrdmMesh(): THREE.Group {
    const group = new THREE.Group();
    const brdmCamo = new THREE.MeshStandardMaterial({ color: 0x606c38, roughness: 0.6, metalness: 0.5 }); // Heavy armor olive
    const armorPlate = new THREE.MeshStandardMaterial({ color: 0x283618, roughness: 0.8, metalness: 0.4 });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.95 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x3d4a2b, metalness: 0.7, roughness: 0.5 });

    // Main angled armored hull
    const hull = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.2, 5.0), brdmCamo);
    hull.position.y = 1.0;
    hull.castShadow = true;
    group.add(hull);

    // Sloped front glacis plate
    const frontSloped = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.8, 1.2), armorPlate);
    frontSloped.position.set(0, 1.2, 2.2);
    frontSloped.rotation.x = -0.4;
    group.add(frontSloped);

    // Rotating commander cupola turret hatch
    const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.5, 12), armorPlate);
    turret.position.set(0, 1.85, 0.2);
    group.add(turret);

    // Heavy autocannon barrel
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.6, 8), new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9 }));
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 1.9, 1.4);
    group.add(barrel);

    // 4 Massive armored wheels
    const wheelPositions = [
      { x: -1.45, y: 0.6, z: 1.6 },
      { x: 1.45, y: 0.6, z: 1.6 },
      { x: -1.45, y: 0.6, z: -1.6 },
      { x: 1.45, y: 0.6, z: -1.6 },
    ];
    wheelPositions.forEach((wp) => {
      const tire = this.createWheelMesh(0.65, 0.44, tireMat, rimMat);
      tire.position.set(wp.x, wp.y, wp.z);
      group.add(tire);
      this.wheels.push(tire);
    });

    return group;
  }

  private createWheelMesh(
    radius: number,
    width: number,
    tireMat: THREE.Material,
    rimMat: THREE.Material
  ): THREE.Mesh {
    const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 16);
    tireGeo.rotateZ(Math.PI / 2);
    const tire = new THREE.Mesh(tireGeo, tireMat);

    const rimGeo = new THREE.CylinderGeometry(radius * 0.55, radius * 0.55, width + 0.01, 8);
    rimGeo.rotateZ(Math.PI / 2);
    const rim = new THREE.Mesh(rimGeo, rimMat);
    tire.add(rim);
    tire.castShadow = true;
    return tire;
  }

  public honk() {
    soundEngine.playVehicleHorn();
  }

  public takeDamage(amount: number) {
    this.health = Math.max(0, this.health - amount);
    this.stats.health = this.health;
  }

  public update(
    delta: number,
    getTerrainHeight: (x: number, z: number) => number,
    inputs: { forward: boolean; backward: boolean; left: boolean; right: boolean; brake: boolean }
  ) {
    if (this.isOccupied) {
      const { accel, brakePower, maxSpeed, steerResponsiveness } = this.stats;
      const friction = this.type === 'MOTORBIKE' ? 2.5 : 3.5;

      if (inputs.forward) {
        this.speed = Math.min(maxSpeed, this.speed + accel * delta);
      } else if (inputs.backward) {
        this.speed = Math.max(-maxSpeed * 0.35, this.speed - accel * delta * 0.8);
      } else {
        if (this.speed > 0) {
          this.speed = Math.max(0, this.speed - friction * delta);
        } else if (this.speed < 0) {
          this.speed = Math.min(0, this.speed + friction * delta);
        }
      }

      if (inputs.brake) {
        if (this.speed > 0) {
          this.speed = Math.max(0, this.speed - brakePower * delta);
        } else if (this.speed < 0) {
          this.speed = Math.min(0, this.speed + brakePower * delta);
        }
      }

      // Steering
      if (inputs.left) {
        this.steerAngle = Math.min(0.65, this.steerAngle + steerResponsiveness * delta);
      } else if (inputs.right) {
        this.steerAngle = Math.max(-0.65, this.steerAngle - steerResponsiveness * delta);
      } else {
        this.steerAngle *= 0.85;
      }

      // Turn vehicle based on speed & steer angle
      if (Math.abs(this.speed) > 0.5) {
        const turnMult = this.speed > 0 ? 1 : -1;
        this.rotationY += this.steerAngle * (this.speed / maxSpeed) * steerResponsiveness * delta * turnMult;
      }

      // Motorbike banking lean roll
      if (this.type === 'MOTORBIKE') {
        const targetRoll = -this.steerAngle * (this.speed / maxSpeed) * 0.7;
        this.rollAngle += (targetRoll - this.rollAngle) * 8 * delta;
      } else {
        this.rollAngle = 0;
      }

      // Engine audio pitch
      soundEngine.updateVehicleEngine(Math.abs(this.speed) / maxSpeed);
    } else {
      this.speed *= 0.92;
      this.steerAngle *= 0.9;
      this.rollAngle *= 0.9;
    }

    // Direction vector
    const forwardX = Math.sin(this.rotationY);
    const forwardZ = Math.cos(this.rotationY);

    this.position.x += forwardX * this.speed * delta;
    this.position.z += forwardZ * this.speed * delta;

    // Follow terrain height
    const groundY = getTerrainHeight(this.position.x, this.position.z);
    this.position.y = groundY + (this.type === 'BRDM' ? 0.7 : 0.5);

    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotationY;
    this.mesh.rotation.z = this.rollAngle;

    // Roll wheels
    const rollSpeed = (this.speed / 0.5) * delta;
    this.wheels.forEach((w, idx) => {
      w.rotation.x += rollSpeed;
      if (idx < (this.type === 'MOTORBIKE' ? 1 : 2)) {
        w.rotation.y = this.steerAngle;
      }
    });

    if (this.handlebars) {
      this.handlebars.rotation.y = this.steerAngle * 0.8;
    }
  }

  public getSpeedKmh(): number {
    return Math.round(Math.abs(this.speed) * 3.6);
  }
}
