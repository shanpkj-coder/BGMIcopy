import * as THREE from 'three';
import { soundEngine } from '../audio/soundEngine';
import { AirDropCrate } from '../types/game';

export class AirDropManager {
  private scene: THREE.Scene;
  private planeMesh: THREE.Group | null = null;
  private planeFlyTime: number = 0;
  private planeActive: boolean = false;
  private planeStart: THREE.Vector3 = new THREE.Vector3();
  private planeEnd: THREE.Vector3 = new THREE.Vector3();

  public crate: AirDropCrate | null = null;
  public crateMesh: THREE.Group | null = null;
  private parachuteMesh: THREE.Mesh | null = null;
  private smokeParticles: THREE.Points | null = null;
  private nextDropTimer: number = 40; // First airdrop at 40s

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public update(
    delta: number,
    getTerrainHeight: (x: number, z: number) => number,
    onLootAirdrop?: () => void
  ) {
    // Timer to trigger cargo plane
    if (!this.planeActive && !this.crate) {
      this.nextDropTimer -= delta;
      if (this.nextDropTimer <= 0) {
        this.spawnCargoPlane();
      }
    }

    // 1. Update Cargo Plane Flyover
    if (this.planeActive && this.planeMesh) {
      this.planeFlyTime += delta * 0.08;
      this.planeMesh.position.lerpVectors(this.planeStart, this.planeEnd, this.planeFlyTime);

      // Halfway across flight, drop the crate
      if (this.planeFlyTime >= 0.5 && !this.crate) {
        this.dropCrateFromPlane(this.planeMesh.position, getTerrainHeight);
      }

      if (this.planeFlyTime >= 1.0) {
        // Plane exits map
        this.scene.remove(this.planeMesh);
        this.planeMesh = null;
        this.planeActive = false;
      }
    }

    // 2. Update Falling Crate & Parachute
    if (this.crate && this.crateMesh) {
      if (!this.crate.isGrounded) {
        this.crate.y -= 7.5 * delta; // Parachute descent speed
        if (this.crate.y <= this.crate.groundY + 0.8) {
          this.crate.y = this.crate.groundY + 0.8;
          this.crate.isGrounded = true;

          // Remove parachute when grounded
          if (this.parachuteMesh) {
            this.scene.remove(this.parachuteMesh);
            this.parachuteMesh = null;
          }

          // Create billowing red smoke flare
          this.createRedSmokeFlare();
        }
        this.crateMesh.position.set(this.crate.x, this.crate.y, this.crate.z);
        if (this.parachuteMesh) {
          this.parachuteMesh.position.set(this.crate.x, this.crate.y + 4.5, this.crate.z);
        }
      } else {
        // Billow red smoke particles
        if (this.smokeParticles) {
          const posAttr = this.smokeParticles.geometry.attributes.position;
          for (let i = 0; i < posAttr.count; i++) {
            let py = posAttr.getY(i) + delta * (4 + (i % 5));
            if (py > 25) py = 0;
            posAttr.setY(i, py);
          }
          posAttr.needsUpdate = true;
        }
      }
    }
  }

  private spawnCargoPlane() {
    this.planeActive = true;
    this.planeFlyTime = 0;

    const angle = Math.random() * Math.PI * 2;
    const dist = 550;
    this.planeStart.set(Math.cos(angle) * dist, 110, Math.sin(angle) * dist);
    this.planeEnd.set(-Math.cos(angle) * dist, 110, -Math.sin(angle) * dist);

    this.planeMesh = this.createCargoPlaneMesh();
    this.planeMesh.position.copy(this.planeStart);
    this.planeMesh.lookAt(this.planeEnd);
    this.scene.add(this.planeMesh);
  }

  private createCargoPlaneMesh(): THREE.Group {
    const group = new THREE.Group();
    const planeMat = new THREE.MeshStandardMaterial({
      color: 0x475569, // Military dark grey
      metalness: 0.5,
      roughness: 0.4,
    });

    // Fuselage
    const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.0, 22, 12), planeMat);
    fuselage.rotation.x = Math.PI / 2;
    group.add(fuselage);

    // Wings
    const wings = new THREE.Mesh(new THREE.BoxGeometry(32, 0.4, 4.5), planeMat);
    wings.position.set(0, 0.6, 2);
    group.add(wings);

    // Tail fin
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.5, 3.5), planeMat);
    tail.position.set(0, 2.5, -9);
    group.add(tail);

    return group;
  }

  private dropCrateFromPlane(
    planePos: THREE.Vector3,
    getTerrainHeight: (x: number, z: number) => number
  ) {
    const groundY = getTerrainHeight(planePos.x, planePos.z);
    this.crate = {
      x: planePos.x,
      y: planePos.y - 2,
      z: planePos.z,
      groundY,
      isGrounded: false,
      hasBeenLooted: false,
    };

    // Build BGMI iconic Red & Blue Airdrop Crate
    const group = new THREE.Group();

    // Red bottom container
    const bottomMat = new THREE.MeshStandardMaterial({
      color: 0xb91c1c, // Vibrant red
      roughness: 0.5,
      metalness: 0.2,
    });
    const bottom = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.4, 2.0), bottomMat);
    bottom.castShadow = true;
    group.add(bottom);

    // Blue top tarp cover
    const topMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8, // Blue tarp
      roughness: 0.8,
    });
    const top = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.4, 2.1), topMat);
    top.position.y = 0.8;
    top.castShadow = true;
    group.add(top);

    group.position.set(this.crate.x, this.crate.y, this.crate.z);
    this.scene.add(group);
    this.crateMesh = group;

    // Military Olive-green Parachute dome
    const chuteGeo = new THREE.SphereGeometry(3.5, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const chuteMat = new THREE.MeshStandardMaterial({
      color: 0x4d5b44,
      side: THREE.DoubleSide,
      roughness: 0.8,
    });
    this.parachuteMesh = new THREE.Mesh(chuteGeo, chuteMat);
    this.parachuteMesh.position.set(this.crate.x, this.crate.y + 4.5, this.crate.z);
    this.scene.add(this.parachuteMesh);
  }

  private createRedSmokeFlare() {
    if (!this.crate) return;

    const count = 75;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 1.5;
      positions[i * 3 + 1] = Math.random() * 22;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xef4444, // Red smoke flare
      size: 1.8,
      transparent: true,
      opacity: 0.75,
    });

    this.smokeParticles = new THREE.Points(geometry, material);
    this.smokeParticles.position.set(this.crate.x, this.crate.y + 1, this.crate.z);
    this.scene.add(this.smokeParticles);
  }
}
