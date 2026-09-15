import * as THREE from 'three';

export type GraphicsPreset = 'LOW' | 'MEDIUM' | 'ULTRA' | 'EXTREME_HDR';

interface ShellCasing {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  rotVelocity: THREE.Vector3;
  lifetime: number;
}

interface DustParticle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  lifetime: number;
  maxLife: number;
  startScale: number;
}

export class UltraGraphicsSystem {
  private scene: THREE.Scene;
  public preset: GraphicsPreset = 'EXTREME_HDR';

  // Volumetric Sun & God Rays
  public sunFlareGroup: THREE.Group = new THREE.Group();
  private godRayMeshes: THREE.Mesh[] = [];

  // 3D Instanced Grass
  public grassInstancedMesh: THREE.InstancedMesh | null = null;
  private grassDummy: THREE.Object3D = new THREE.Object3D();
  private grassTransforms: { x: number; y: number; z: number; scale: number; rot: number }[] = [];

  // Animated Water
  private waterMesh: THREE.Mesh | null = null;
  private waterBasePositions: Float32Array | null = null;

  // Brass Shell Casings & Dust
  private shellCasings: ShellCasing[] = [];
  private shellGeometry: THREE.CylinderGeometry;
  private shellMaterial: THREE.MeshStandardMaterial;

  private dustParticles: DustParticle[] = [];
  private dustGeometry: THREE.SphereGeometry;
  private dustMaterial: THREE.MeshBasicMaterial;

  // Wind & Animation Timers
  private animTimer: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Brass cartridge shell asset
    this.shellGeometry = new THREE.CylinderGeometry(0.018, 0.018, 0.08, 8);
    this.shellMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4af37, // Golden polished brass
      metalness: 0.9,
      roughness: 0.25,
    });

    // Dust particle asset
    this.dustGeometry = new THREE.SphereGeometry(0.35, 6, 6);
    this.dustMaterial = new THREE.MeshBasicMaterial({
      color: 0x927d65,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });

    this.setupSunAndGodRays();
  }

  /**
   * Builds sun corona and atmospheric god rays
   */
  private setupSunAndGodRays() {
    this.sunFlareGroup.position.set(280, 420, 180);

    // Sun core disc
    const sunCoreGeo = new THREE.SphereGeometry(14, 16, 16);
    const sunCoreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
    });
    const sunCore = new THREE.Mesh(sunCoreGeo, sunCoreMat);
    this.sunFlareGroup.add(sunCore);

    // Sun radiant corona flare
    const coronaGeo = new THREE.RingGeometry(14, 48, 24);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xffe6a3,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    const corona = new THREE.Mesh(coronaGeo, coronaMat);
    corona.lookAt(0, 0, 0);
    this.sunFlareGroup.add(corona);

    // Volumetric God Rays (soft radiant light shafts descending across Erangel)
    const rayMat = new THREE.MeshBasicMaterial({
      color: 0xfff6d6,
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    for (let i = 0; i < 7; i++) {
      const rayGeo = new THREE.ConeGeometry(22 + i * 8, 380, 8, 1, true);
      const rayMesh = new THREE.Mesh(rayGeo, rayMat);
      rayMesh.position.set(-30 + i * 15, -180, -20 + i * 8);
      rayMesh.rotation.x = Math.PI;
      rayMesh.rotation.z = 0.15 + (i - 3) * 0.05;
      this.sunFlareGroup.add(rayMesh);
      this.godRayMeshes.push(rayMesh);
    }

    this.scene.add(this.sunFlareGroup);
  }

  /**
   * Initializes 3D instanced grass blades around active zones
   */
  public initGrass(getTerrainHeight: (x: number, z: number) => number) {
    if (this.preset === 'LOW') return;

    const count = this.preset === 'EXTREME_HDR' ? 1200 : 600;
    const bladeGeo = new THREE.ConeGeometry(0.12, 0.75, 4);
    bladeGeo.translate(0, 0.375, 0);

    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0x477a33,
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true,
    });

    this.grassInstancedMesh = new THREE.InstancedMesh(bladeGeo, bladeMat, count);
    this.grassInstancedMesh.receiveShadow = true;

    this.grassTransforms = [];

    // Scatter grass around Pochinki, School, and central hills
    const clusterCenters = [
      { x: -120, z: -100, rad: 110 }, // Pochinki
      { x: 60, z: -180, rad: 90 },    // School
      { x: 0, z: 0, rad: 160 },        // Central Ridge
      { x: 220, z: 220, rad: 90 },    // Military Base
    ];

    for (let i = 0; i < count; i++) {
      const center = clusterCenters[i % clusterCenters.length];
      const ang = Math.random() * Math.PI * 2;
      const r = Math.random() * center.rad;
      const x = center.x + Math.cos(ang) * r;
      const z = center.z + Math.sin(ang) * r;
      const y = getTerrainHeight(x, z);

      if (y < 2) continue; // Skip water

      const scale = 0.6 + Math.random() * 0.8;
      const rot = Math.random() * Math.PI * 2;

      this.grassTransforms.push({ x, y, z, scale, rot });

      this.grassDummy.position.set(x, y, z);
      this.grassDummy.scale.set(scale, scale, scale);
      this.grassDummy.rotation.set(0, rot, 0);
      this.grassDummy.updateMatrix();

      this.grassInstancedMesh.setMatrixAt(i, this.grassDummy.matrix);
    }

    this.grassInstancedMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.grassInstancedMesh);
  }

  /**
   * Hooks into the ocean water mesh for animated wave dynamics
   */
  public registerWaterMesh(water: THREE.Mesh) {
    this.waterMesh = water;
    const pos = water.geometry.attributes.position;
    if (pos) {
      this.waterBasePositions = new Float32Array(pos.array);
    }
  }

  /**
   * Ejects a physical brass bullet casing from the weapon ejection port
   */
  public ejectShellCasing(startPos: THREE.Vector3, forwardDir: THREE.Vector3) {
    if (this.preset === 'LOW') return;

    const mesh = new THREE.Mesh(this.shellGeometry, this.shellMaterial);
    mesh.position.copy(startPos);
    mesh.castShadow = this.preset === 'EXTREME_HDR';

    // Rightward and upward ejection impulse
    const right = new THREE.Vector3().crossVectors(forwardDir, new THREE.Vector3(0, 1, 0)).normalize();
    const velocity = right.clone().multiplyScalar(2.2 + Math.random() * 1.2)
      .add(new THREE.Vector3(0, 1.8 + Math.random() * 0.8, 0))
      .addScaledVector(forwardDir, (Math.random() - 0.5) * 0.8);

    const rotVelocity = new THREE.Vector3(
      (Math.random() - 0.5) * 25,
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 25
    );

    this.scene.add(mesh);
    this.shellCasings.push({
      mesh,
      velocity,
      rotVelocity,
      lifetime: 2.8,
    });
  }

  /**
   * Spawns tactical muzzle smoke puff
   */
  public spawnMuzzleSmoke(pos: THREE.Vector3, forwardDir: THREE.Vector3) {
    if (this.preset === 'LOW') return;

    const mesh = new THREE.Mesh(this.dustGeometry, this.dustMaterial.clone());
    mesh.position.copy(pos);
    mesh.scale.setScalar(0.25);

    const velocity = forwardDir.clone().multiplyScalar(1.5).add(new THREE.Vector3(0, 0.4, 0));

    this.scene.add(mesh);
    this.dustParticles.push({
      mesh,
      velocity,
      lifetime: 0.6,
      maxLife: 0.6,
      startScale: 0.25,
    });
  }

  /**
   * Spawns tire dust cloud behind buggy
   */
  public spawnVehicleDust(pos: THREE.Vector3) {
    if (this.preset === 'LOW') return;

    const mesh = new THREE.Mesh(this.dustGeometry, this.dustMaterial);
    mesh.position.copy(pos).add(new THREE.Vector3((Math.random() - 0.5) * 1.5, 0.2, (Math.random() - 0.5) * 1.5));
    mesh.scale.setScalar(0.5);

    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.8,
      0.8 + Math.random() * 0.6,
      (Math.random() - 0.5) * 0.8
    );

    this.scene.add(mesh);
    this.dustParticles.push({
      mesh,
      velocity,
      lifetime: 1.1,
      maxLife: 1.1,
      startScale: 0.5,
    });
  }

  /**
   * Frame update for all ultra graphics systems
   */
  public update(delta: number, getTerrainHeight: (x: number, z: number) => number) {
    this.animTimer += delta;

    // 1. Animate God Rays breathing/shimmer
    if (this.preset === 'EXTREME_HDR' || this.preset === 'ULTRA') {
      const shimmer = 0.12 + Math.sin(this.animTimer * 1.8) * 0.03;
      this.godRayMeshes.forEach((ray, i) => {
        (ray.material as THREE.MeshBasicMaterial).opacity = shimmer + Math.cos(this.animTimer * 1.2 + i) * 0.02;
      });
    }

    // 2. Animate 3D Grass wind swaying
    if (this.grassInstancedMesh && (this.preset === 'EXTREME_HDR' || this.preset === 'ULTRA')) {
      const windAngle = Math.sin(this.animTimer * 3.2) * 0.18;
      const count = Math.min(this.grassTransforms.length, this.grassInstancedMesh.count);

      for (let i = 0; i < count; i += 3) {
        const t = this.grassTransforms[i];
        if (!t) continue;

        this.grassDummy.position.set(t.x, t.y, t.z);
        this.grassDummy.scale.set(t.scale, t.scale, t.scale);
        this.grassDummy.rotation.set(
          windAngle * 0.5,
          t.rot,
          windAngle + Math.cos(this.animTimer * 2.5 + i * 0.1) * 0.08
        );
        this.grassDummy.updateMatrix();

        this.grassInstancedMesh.setMatrixAt(i, this.grassDummy.matrix);
      }
      this.grassInstancedMesh.instanceMatrix.needsUpdate = true;
    }

    // 3. Animate Ocean Waves
    if (this.waterMesh && this.waterBasePositions && this.preset === 'EXTREME_HDR') {
      const posAttr = this.waterMesh.geometry.attributes.position;
      if (posAttr) {
        const arr = posAttr.array as Float32Array;
        const base = this.waterBasePositions;
        for (let i = 0; i < arr.length; i += 3) {
          const x = base[i];
          const z = base[i + 1];
          // Gentle oceanic roll
          const wave = Math.sin(x * 0.03 + this.animTimer * 2.0) * Math.cos(z * 0.03 + this.animTimer * 1.5) * 0.45;
          arr[i + 2] = wave;
        }
        posAttr.needsUpdate = true;
      }
    }

    // 4. Update Brass Bullet Casings physics
    for (let i = this.shellCasings.length - 1; i >= 0; i--) {
      const s = this.shellCasings[i];
      s.lifetime -= delta;

      // Gravity & air drag
      s.velocity.y -= 14.0 * delta;
      s.mesh.position.addScaledVector(s.velocity, delta);

      s.mesh.rotation.x += s.rotVelocity.x * delta;
      s.mesh.rotation.y += s.rotVelocity.y * delta;
      s.mesh.rotation.z += s.rotVelocity.z * delta;

      // Terrain bounce
      const groundY = getTerrainHeight(s.mesh.position.x, s.mesh.position.z);
      if (s.mesh.position.y <= groundY + 0.04) {
        s.mesh.position.y = groundY + 0.04;
        s.velocity.y *= -0.42; // Elastic bounce
        s.velocity.x *= 0.65;
        s.velocity.z *= 0.65;
        s.rotVelocity.multiplyScalar(0.5);
      }

      if (s.lifetime <= 0) {
        this.scene.remove(s.mesh);
        this.shellCasings.splice(i, 1);
      }
    }

    // 5. Update Dust / Smoke Particles
    for (let i = this.dustParticles.length - 1; i >= 0; i--) {
      const d = this.dustParticles[i];
      d.lifetime -= delta;

      d.mesh.position.addScaledVector(d.velocity, delta);
      d.velocity.y += 0.2 * delta; // Rise gently

      const progress = 1 - d.lifetime / d.maxLife;
      const currentScale = d.startScale * (1 + progress * 2.5);
      d.mesh.scale.setScalar(currentScale);

      const mat = d.mesh.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = (1 - progress) * 0.45;
      }

      if (d.lifetime <= 0) {
        this.scene.remove(d.mesh);
        this.dustParticles.splice(i, 1);
      }
    }
  }

  /**
   * Configures rendering preset
   */
  public applyPreset(
    preset: GraphicsPreset,
    renderer: THREE.WebGLRenderer,
    getTerrainHeight: (x: number, z: number) => number
  ) {
    this.preset = preset;

    if (preset === 'EXTREME_HDR') {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.25;
      this.sunFlareGroup.visible = true;
      if (this.grassInstancedMesh) this.grassInstancedMesh.visible = true;
      else this.initGrass(getTerrainHeight);
    } else if (preset === 'ULTRA') {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      this.sunFlareGroup.visible = true;
      if (this.grassInstancedMesh) this.grassInstancedMesh.visible = true;
      else this.initGrass(getTerrainHeight);
    } else if (preset === 'MEDIUM') {
      renderer.setPixelRatio(1.25);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.BasicShadowMap;
      renderer.toneMapping = THREE.LinearToneMapping;
      this.sunFlareGroup.visible = false;
      if (this.grassInstancedMesh) this.grassInstancedMesh.visible = false;
    } else {
      // LOW / Smooth 60 FPS
      renderer.setPixelRatio(1.0);
      renderer.shadowMap.enabled = false;
      renderer.toneMapping = THREE.LinearToneMapping;
      this.sunFlareGroup.visible = false;
      if (this.grassInstancedMesh) this.grassInstancedMesh.visible = false;
    }
  }

  public dispose() {
    this.shellCasings.forEach((s) => this.scene.remove(s.mesh));
    this.dustParticles.forEach((d) => this.scene.remove(d.mesh));
    if (this.grassInstancedMesh) this.scene.remove(this.grassInstancedMesh);
    this.scene.remove(this.sunFlareGroup);
  }
}
