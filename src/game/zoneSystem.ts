import * as THREE from 'three';
import { PlayZone } from '../types/game';
import { soundEngine } from '../audio/soundEngine';

export class ZoneSystem {
  public zone: PlayZone;
  private blueCylinderMesh: THREE.Mesh;
  private whiteCircleMesh: THREE.Line;
  private scene: THREE.Scene;

  // Circle phases: [WaitTime, ShrinkDuration, TargetRadius, DamagePerSec]
  private static PHASES = [
    { wait: 35, shrink: 30, radius: 420, damage: 1.5 },
    { wait: 30, shrink: 25, radius: 260, damage: 3.0 },
    { wait: 25, shrink: 20, radius: 150, damage: 6.0 },
    { wait: 20, shrink: 15, radius: 70, damage: 10.0 },
    { wait: 15, shrink: 15, radius: 20, damage: 16.0 },
  ];

  private currentPhaseIndex: number = 0;
  private phaseTimer: number = 0;
  private isShrinking: boolean = false;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    const initialRadius = 600;
    this.zone = {
      phase: 1,
      currentRadius: initialRadius,
      targetRadius: ZoneSystem.PHASES[0].radius,
      currentCenter: { x: 0, z: 0 },
      targetCenter: { x: (Math.random() - 0.5) * 80, z: (Math.random() - 0.5) * 80 },
      timeRemaining: ZoneSystem.PHASES[0].wait,
      isShrinking: false,
      damagePerSec: ZoneSystem.PHASES[0].damage,
    };

    this.phaseTimer = ZoneSystem.PHASES[0].wait;

    // 1. Blue Zone 3D Energy Wall (Cylinder open-ended)
    const cylinderGeo = new THREE.CylinderGeometry(
      initialRadius,
      initialRadius,
      120,
      64,
      1,
      true
    );
    const cylinderMat = new THREE.MeshBasicMaterial({
      color: 0x0ea5e9, // Electric neon blue
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.blueCylinderMesh = new THREE.Mesh(cylinderGeo, cylinderMat);
    this.blueCylinderMesh.position.set(0, 50, 0);
    scene.add(this.blueCylinderMesh);

    // 2. White Circle (Safe Zone Border Line)
    const linePoints: THREE.Vector3[] = [];
    const segments = 90;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      linePoints.push(
        new THREE.Vector3(
          Math.cos(theta) * this.zone.targetRadius,
          3,
          Math.sin(theta) * this.zone.targetRadius
        )
      );
    }
    const whiteCircleGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
    const whiteCircleMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      linewidth: 3,
      transparent: true,
      opacity: 0.85,
    });
    this.whiteCircleMesh = new THREE.Line(whiteCircleGeo, whiteCircleMat);
    this.whiteCircleMesh.position.set(this.zone.targetCenter.x, 3, this.zone.targetCenter.z);
    scene.add(this.whiteCircleMesh);
  }

  public update(delta: number, playerPos: THREE.Vector3): { outsideDamage: number; isOutside: boolean } {
    this.phaseTimer -= delta;
    this.zone.timeRemaining = Math.max(0, Math.ceil(this.phaseTimer));

    const currentConfig = ZoneSystem.PHASES[this.currentPhaseIndex] || ZoneSystem.PHASES[ZoneSystem.PHASES.length - 1];

    if (!this.isShrinking) {
      if (this.phaseTimer <= 0) {
        // Transition to shrinking state
        this.isShrinking = true;
        this.zone.isShrinking = true;
        this.phaseTimer = currentConfig.shrink;
        soundEngine.playZoneWarning();
      }
    } else {
      // Actively shrinking
      const shrinkProgress = 1 - Math.max(0, this.phaseTimer) / currentConfig.shrink;
      const prevRadius = this.currentPhaseIndex === 0 ? 600 : ZoneSystem.PHASES[this.currentPhaseIndex - 1].radius;
      
      this.zone.currentRadius = THREE.MathUtils.lerp(prevRadius, this.zone.targetRadius, shrinkProgress);
      
      // Interpolate center towards target center
      const prevCenterX = this.zone.currentCenter.x;
      const prevCenterZ = this.zone.currentCenter.z;
      this.zone.currentCenter.x = THREE.MathUtils.lerp(prevCenterX, this.zone.targetCenter.x, 0.05);
      this.zone.currentCenter.z = THREE.MathUtils.lerp(prevCenterZ, this.zone.targetCenter.z, 0.05);

      if (this.phaseTimer <= 0) {
        // Advance to next phase
        this.isShrinking = false;
        this.zone.isShrinking = false;
        this.currentPhaseIndex = Math.min(ZoneSystem.PHASES.length - 1, this.currentPhaseIndex + 1);
        this.zone.phase = this.currentPhaseIndex + 1;
        
        const nextConfig = ZoneSystem.PHASES[this.currentPhaseIndex];
        this.phaseTimer = nextConfig.wait;
        this.zone.damagePerSec = nextConfig.damage;
        
        // Pick new random safe zone inside current circle
        const angle = Math.random() * Math.PI * 2;
        const maxOffset = Math.max(10, (this.zone.currentRadius - nextConfig.radius) * 0.7);
        const dist = Math.random() * maxOffset;
        
        this.zone.targetCenter = {
          x: this.zone.currentCenter.x + Math.cos(angle) * dist,
          z: this.zone.currentCenter.z + Math.sin(angle) * dist,
        };
        this.zone.targetRadius = nextConfig.radius;
        
        // Update white circle mesh
        this.updateWhiteCircleMesh();
      }
    }

    // Update 3D Blue Wall Mesh
    this.blueCylinderMesh.position.set(this.zone.currentCenter.x, 50, this.zone.currentCenter.z);
    this.blueCylinderMesh.scale.set(this.zone.currentRadius / 600, 1, this.zone.currentRadius / 600);
    
    // Pulsing energy opacity
    const mat = this.blueCylinderMesh.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.28 + Math.sin(Date.now() * 0.005) * 0.12;

    // Check player distance to blue circle center
    const distToCenter = Math.sqrt(
      (playerPos.x - this.zone.currentCenter.x) ** 2 +
      (playerPos.z - this.zone.currentCenter.z) ** 2
    );

    const isOutside = distToCenter > this.zone.currentRadius;
    const outsideDamage = isOutside ? this.zone.damagePerSec * delta : 0;

    return { outsideDamage, isOutside };
  }

  private updateWhiteCircleMesh() {
    this.whiteCircleMesh.position.set(this.zone.targetCenter.x, 3, this.zone.targetCenter.z);
    const scale = this.zone.targetRadius / ZoneSystem.PHASES[0].radius;
    this.whiteCircleMesh.scale.set(scale, 1, scale);
  }
}
