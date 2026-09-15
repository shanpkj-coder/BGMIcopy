import * as THREE from 'three';
import { GroundLoot, MapId } from '../types/game';
import { MAP_CONFIGS, MapConfig } from './gameModes';

export interface WorldData {
  terrainMesh: THREE.Mesh;
  waterMesh: THREE.Mesh;
  colliders: THREE.Box3[];
  lootItems: GroundLoot[];
  compounds: { name: string; x: number; z: number }[];
  getTerrainHeight: (x: number, z: number) => number;
  mapConfig: MapConfig;
}

export class WorldBuilder {
  public static buildWorld(scene: THREE.Scene, mapId: MapId = 'ERANGEL'): WorldData {
    const mapConfig = MAP_CONFIGS[mapId] || MAP_CONFIGS.ERANGEL;
    const islandSize = mapConfig.islandSize;
    const isWarehouse = mapId === 'WAREHOUSE_TDM';

    const colliders: THREE.Box3[] = [];
    const lootItems: GroundLoot[] = [];
    const compounds = mapConfig.compounds;

    // 1. Terrain Heightmap Function
    const getTerrainHeight = (x: number, z: number): number => {
      if (isWarehouse) {
        // Flat concrete arena with slight perimeter ramp
        const edgeDist = Math.max(Math.abs(x), Math.abs(z));
        if (edgeDist > 140) {
          return 1 + (edgeDist - 140) * 0.4;
        }
        return 1.2;
      }

      const dist = Math.sqrt(x * x + z * z);
      const maxRadius = (islandSize / 2) * 0.9;

      // Ocean dropoff at edges
      if (dist > maxRadius) {
        const falloff = (dist - maxRadius) / 50;
        return Math.max(-15, 2 - falloff * 8);
      }

      let height = 4;
      if (mapId === 'MIRAMAR') {
        // High steep canyon dunes
        const h1 = Math.sin(x * 0.007) * Math.cos(z * 0.007) * 24;
        const h2 = Math.cos(x * 0.015 + 1.2) * Math.sin(z * 0.02) * 12;
        height = 6 + h1 + h2;
      } else if (mapId === 'VIKENDI') {
        // Glacial peaks with central frozen river valley
        const valley = Math.abs(Math.sin(x * 0.005 + z * 0.003)) * 18;
        const peak = Math.cos(x * 0.012) * Math.cos(z * 0.012) * 16;
        height = 4 + peak + valley * 0.5;
      } else if (mapId === 'SANHOK') {
        // Rolling tropical limestone karst hills
        const h1 = Math.sin(x * 0.012) * Math.cos(z * 0.012) * 14;
        const h2 = Math.sin(x * 0.03) * Math.sin(z * 0.03) * 6;
        height = 5 + h1 + h2;
      } else {
        // Erangel classic rolling hills
        const h1 = Math.sin(x * 0.008) * Math.cos(z * 0.008) * 16;
        const h2 = Math.sin(x * 0.02 + 1.2) * Math.cos(z * 0.015 + 0.5) * 8;
        height = 4 + h1 + h2;
      }

      // Compound plateaus (flatten near bases)
      compounds.forEach((comp) => {
        const d = Math.sqrt((x - comp.x) ** 2 + (z - comp.z) ** 2);
        if (d < 85) {
          const factor = Math.max(0, 1 - d / 85);
          height = height * (1 - factor * 0.8) + 6 * (factor * 0.8);
        }
      });

      return Math.max(1.2, height);
    };

    // 2. Terrain Mesh Generation
    const segments = isWarehouse ? 60 : 140;
    const terrainGeo = new THREE.PlaneGeometry(islandSize, islandSize, segments, segments);
    terrainGeo.rotateX(-Math.PI / 2);

    const posAttr = terrainGeo.attributes.position;
    const colors: number[] = [];

    const palette = mapConfig.terrainPalette;
    const grassColor = new THREE.Color(palette.grassColor);
    const dirtColor = new THREE.Color(palette.dirtColor);
    const rockColor = new THREE.Color(palette.rockColor);
    const sandColor = new THREE.Color(palette.sandColor);

    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);
      const vy = getTerrainHeight(vx, vz);
      posAttr.setY(i, vy);

      const d = Math.sqrt(vx * vx + vz * vz);
      const edge = (islandSize / 2) * 0.88;

      let c = grassColor.clone();
      if (vy > 18) {
        c.lerp(rockColor, Math.min(1, (vy - 18) / 10));
      } else if (d > edge && !isWarehouse) {
        c.lerp(sandColor, Math.min(1, (d - edge) / 35));
      } else if (Math.abs(Math.sin(vx * 0.03) + Math.cos(vz * 0.03)) < 0.22) {
        c.lerp(dirtColor, 0.7);
      }

      colors.push(c.r, c.g, c.b);
    }

    terrainGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.05,
      flatShading: !isWarehouse,
    });

    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.receiveShadow = true;
    scene.add(terrainMesh);

    // 3. Ocean / River Water Mesh (unless Warehouse TDM)
    const waterGeo = new THREE.PlaneGeometry(islandSize * 1.3, islandSize * 1.3);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: mapConfig.waterColor,
      roughness: 0.15,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85,
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.y = 1.0;
    if (!isWarehouse) {
      scene.add(waterMesh);
    }

    // 4. Buildings & Compounds
    if (isWarehouse) {
      // Build industrial close-quarters arena layout
      WorldBuilder.createWarehouseArena(scene, colliders, lootItems);
    } else {
      compounds.forEach((comp) => {
        WorldBuilder.createMilitaryHangar(scene, comp.x, comp.z, getTerrainHeight, colliders, lootItems);
        WorldBuilder.createWatchtower(scene, comp.x + 35, comp.z + 30, getTerrainHeight, colliders, lootItems);
        WorldBuilder.createWatchtower(scene, comp.x - 35, comp.z - 30, getTerrainHeight, colliders, lootItems);
        WorldBuilder.createTwoStoryBuilding(scene, comp.x - 28, comp.z + 24, getTerrainHeight, colliders, lootItems);
        WorldBuilder.createTwoStoryBuilding(scene, comp.x + 28, comp.z - 24, getTerrainHeight, colliders, lootItems);
        WorldBuilder.createBarricades(scene, comp.x, comp.z, getTerrainHeight, colliders);
      });

      // Container Yards
      WorldBuilder.createContainerYard(scene, compounds[0].x - 80, compounds[0].z + 60, getTerrainHeight, colliders, lootItems);

      // Map-specific foliage & landscape features
      WorldBuilder.populateFoliageAndRocks(scene, getTerrainHeight, colliders, mapConfig.foliageType, islandSize);

      // Scattered Field Loot
      WorldBuilder.populateFieldLoot(getTerrainHeight, lootItems, compounds);
    }

    return {
      terrainMesh,
      waterMesh,
      colliders,
      lootItems,
      compounds,
      getTerrainHeight,
      mapConfig,
    };
  }

  /**
   * Warehouse TDM Arena: Shipping container maze, elevated catwalks, barricades
   */
  private static createWarehouseArena(
    scene: THREE.Scene,
    colliders: THREE.Box3[],
    lootItems: GroundLoot[]
  ) {
    const contColors = [0x2563eb, 0xdc2626, 0x16a34a, 0xd97706, 0x4f46e5];

    // Perimeter Arena Walls
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.8, metalness: 0.2 });
    const wallNorth = new THREE.Mesh(new THREE.BoxGeometry(260, 10, 3), wallMat);
    wallNorth.position.set(0, 5, 130);
    const wallSouth = new THREE.Mesh(new THREE.BoxGeometry(260, 10, 3), wallMat);
    wallSouth.position.set(0, 5, -130);
    const wallEast = new THREE.Mesh(new THREE.BoxGeometry(3, 10, 260), wallMat);
    wallEast.position.set(130, 5, 0);
    const wallWest = new THREE.Mesh(new THREE.BoxGeometry(3, 10, 260), wallMat);
    wallWest.position.set(-130, 5, 0);

    [wallNorth, wallSouth, wallEast, wallWest].forEach((w) => {
      w.castShadow = true;
      w.receiveShadow = true;
      scene.add(w);
      colliders.push(new THREE.Box3().setFromObject(w));
    });

    // Central Giant Warehouse
    const whMat = new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.6, metalness: 0.4 });
    const centralRoof = new THREE.Mesh(new THREE.BoxGeometry(70, 1.2, 45), whMat);
    centralRoof.position.set(0, 12, 0);
    scene.add(centralRoof);

    // Support pillars
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.8 });
    [[-32, -20], [-32, 20], [32, -20], [32, 20], [0, -20], [0, 20]].forEach(([px, pz]) => {
      const pil = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 12, 8), pillarMat);
      pil.position.set(px, 6, pz);
      scene.add(pil);
      colliders.push(new THREE.Box3().setFromObject(pil));
    });

    // Container maze layout
    const containerLayout = [
      { x: -30, z: 0, rot: 0, color: 0 },
      { x: 30, z: 0, rot: 0, color: 1 },
      { x: 0, z: 40, rot: Math.PI / 2, color: 2 },
      { x: 0, z: -40, rot: Math.PI / 2, color: 3 },
      { x: -50, z: 50, rot: 0.3, color: 4 },
      { x: 50, z: 50, rot: -0.3, color: 0 },
      { x: -50, z: -50, rot: -0.3, color: 1 },
      { x: 50, z: -50, rot: 0.3, color: 2 },
      { x: -20, z: 80, rot: 0, color: 3 },
      { x: 20, z: 80, rot: 0, color: 4 },
      { x: -20, z: -80, rot: 0, color: 0 },
      { x: 20, z: -80, rot: 0, color: 1 },
    ];

    containerLayout.forEach((item, idx) => {
      const cMat = new THREE.MeshStandardMaterial({ color: contColors[item.color], roughness: 0.4, metalness: 0.6 });
      const cont = new THREE.Mesh(new THREE.BoxGeometry(12, 3.4, 3.2), cMat);
      cont.position.set(item.x, 2.9, item.z);
      cont.rotation.y = item.rot;
      cont.castShadow = true;
      cont.receiveShadow = true;
      scene.add(cont);
      colliders.push(new THREE.Box3().setFromObject(cont));

      // Stack double container
      if (idx % 3 === 0) {
        const cont2 = new THREE.Mesh(new THREE.BoxGeometry(12, 3.4, 3.2), cMat);
        cont2.position.set(item.x, 6.3, item.z);
        cont2.rotation.y = item.rot;
        cont2.castShadow = true;
        scene.add(cont2);
        colliders.push(new THREE.Box3().setFromObject(cont2));
      }
    });

    // TDM Spawn Weapons
    const tdmWeapons = ['M416', 'AKM', 'BERYL_M762', 'SCAR_L', 'AWM', 'UZI', 'VECTOR', 'S12K', 'M249'];
    tdmWeapons.forEach((w, idx) => {
      lootItems.push({
        id: `tdm_weapon_${idx}`,
        type: 'WEAPON',
        name: w,
        x: (idx - 4) * 8,
        y: 1.6,
        z: (idx % 2 === 0 ? 25 : -25),
      });
    });
  }

  /**
   * Military Hangar / Warehouse building
   */
  private static createMilitaryHangar(
    scene: THREE.Scene,
    cx: number,
    cz: number,
    getTerrainHeight: (x: number, z: number) => number,
    colliders: THREE.Box3[],
    lootItems: GroundLoot[]
  ) {
    const y = getTerrainHeight(cx, cz);
    const hangarGroup = new THREE.Group();
    hangarGroup.position.set(cx, y, cz);

    const wallMat = new THREE.MeshStandardMaterial({ color: 0x5a6368, roughness: 0.6, metalness: 0.3 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x3d4447, roughness: 0.5, metalness: 0.5 });

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.8, 6, 14), wallMat);
    leftWall.position.set(-11.6, 3, 0);
    leftWall.castShadow = true;
    hangarGroup.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.8, 6, 14), wallMat);
    rightWall.position.set(11.6, 3, 0);
    rightWall.castShadow = true;
    hangarGroup.add(rightWall);

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(24, 6, 0.8), wallMat);
    backWall.position.set(0, 3, -6.6);
    backWall.castShadow = true;
    hangarGroup.add(backWall);

    const roofL = new THREE.Mesh(new THREE.BoxGeometry(13, 0.5, 14.5), roofMat);
    roofL.position.set(-5.5, 7.2, 0);
    roofL.rotation.z = -0.22;
    const roofR = new THREE.Mesh(new THREE.BoxGeometry(13, 0.5, 14.5), roofMat);
    roofR.position.set(5.5, 7.2, 0);
    roofR.rotation.z = 0.22;
    hangarGroup.add(roofL, roofR);

    scene.add(hangarGroup);

    colliders.push(
      new THREE.Box3().setFromObject(leftWall),
      new THREE.Box3().setFromObject(rightWall),
      new THREE.Box3().setFromObject(backWall)
    );

    // Hangar inside loot
    const guns = ['M416', 'BERYL_M762', 'M249', 'S12K', 'PANZERFAUST'];
    const selectedGun = guns[Math.floor(Math.random() * guns.length)];
    lootItems.push({
      id: `loot_hangar_${cx}_${cz}`,
      type: 'WEAPON',
      name: selectedGun,
      x: cx,
      y: y + 0.4,
      z: cz,
    });
    lootItems.push({
      id: `loot_ammo_${cx}_${cz}`,
      type: 'AMMO',
      name: '5.56mm Ammo (90)',
      x: cx + 3,
      y: y + 0.4,
      z: cz + 2,
    });
  }

  /**
   * Watchtower sniper nest
   */
  private static createWatchtower(
    scene: THREE.Scene,
    x: number,
    z: number,
    getTerrainHeight: (x: number, z: number) => number,
    colliders: THREE.Box3[],
    lootItems: GroundLoot[]
  ) {
    const y = getTerrainHeight(x, z);
    const tower = new THREE.Group();
    tower.position.set(x, y, z);

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x383e42, metalness: 0.8, roughness: 0.3 });

    const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 8, 6), metalMat);
    p1.position.set(-2, 4, -2);
    const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 8, 6), metalMat);
    p2.position.set(2, 4, -2);
    const p3 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 8, 6), metalMat);
    p3.position.set(-2, 4, 2);
    const p4 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 8, 6), metalMat);
    p4.position.set(2, 4, 2);
    tower.add(p1, p2, p3, p4);

    const platform = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.4, 5.2), metalMat);
    platform.position.y = 8;
    tower.add(platform);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(4, 1.8, 4), metalMat);
    roof.position.y = 11.2;
    roof.rotation.y = Math.PI / 4;
    tower.add(roof);

    scene.add(tower);
    colliders.push(new THREE.Box3(new THREE.Vector3(x - 2.5, y, z - 2.5), new THREE.Vector3(x + 2.5, y + 11, z + 2.5)));

    // High sniper loot in watchtower
    const snipers = ['KAR98K', 'AWM', 'MINI14'];
    lootItems.push({
      id: `loot_tower_${x}_${z}`,
      type: 'WEAPON',
      name: snipers[Math.floor(Math.random() * snipers.length)],
      x,
      y: y + 8.4,
      z,
    });
  }

  /**
   * 2-story compound building
   */
  private static createTwoStoryBuilding(
    scene: THREE.Scene,
    x: number,
    z: number,
    getTerrainHeight: (x: number, z: number) => number,
    colliders: THREE.Box3[],
    lootItems: GroundLoot[]
  ) {
    const y = getTerrainHeight(x, z);
    const bldg = new THREE.Group();
    bldg.position.set(x, y, z);

    const brickMat = new THREE.MeshStandardMaterial({ color: 0x8a7765, roughness: 0.85 });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x3d352e, roughness: 0.6 });

    const f1 = new THREE.Mesh(new THREE.BoxGeometry(10, 3.8, 12), brickMat);
    f1.position.y = 1.9;
    f1.castShadow = true;
    f1.receiveShadow = true;
    bldg.add(f1);

    const f2 = new THREE.Mesh(new THREE.BoxGeometry(9.6, 3.6, 11.6), brickMat);
    f2.position.y = 5.6;
    f2.castShadow = true;
    bldg.add(f2);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(10.2, 0.4, 12.2), trimMat);
    roof.position.y = 7.6;
    bldg.add(roof);

    scene.add(bldg);
    colliders.push(new THREE.Box3().setFromObject(f1));

    // Loot inside building
    lootItems.push({
      id: `bldg_med_${x}_${z}`,
      type: 'MEDKIT',
      name: 'First Aid Kit',
      x: x + 1,
      y: y + 0.4,
      z: z + 1,
    });
    lootItems.push({
      id: `bldg_gun_${x}_${z}`,
      type: 'WEAPON',
      name: 'SCAR_L',
      x: x - 1,
      y: y + 0.4,
      z: z - 1,
    });
  }

  private static createBarricades(
    scene: THREE.Scene,
    cx: number,
    cz: number,
    getTerrainHeight: (x: number, z: number) => number,
    colliders: THREE.Box3[]
  ) {
    const offsets = [{ ox: 15, oz: 15 }, { ox: -15, oz: -15 }, { ox: 20, oz: -12 }];
    const sandbagMat = new THREE.MeshStandardMaterial({ color: 0xb5a489, roughness: 0.95 });

    offsets.forEach((off) => {
      const bx = cx + off.ox;
      const bz = cz + off.oz;
      const by = getTerrainHeight(bx, bz);

      const bag = new THREE.Mesh(new THREE.BoxGeometry(4, 1.1, 1.2), sandbagMat);
      bag.position.set(bx, by + 0.55, bz);
      bag.castShadow = true;
      scene.add(bag);
      colliders.push(new THREE.Box3().setFromObject(bag));
    });
  }

  private static createContainerYard(
    scene: THREE.Scene,
    cx: number,
    cz: number,
    getTerrainHeight: (x: number, z: number) => number,
    colliders: THREE.Box3[],
    lootItems: GroundLoot[]
  ) {
    const colors = [0x2563eb, 0xdc2626, 0x16a34a, 0xd97706];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        const x = cx + (c - 2) * 14;
        const z = cz + (r - 1) * 9;
        const y = getTerrainHeight(x, z);

        const color = colors[(r + c) % colors.length];
        const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.6 });

        const cont = new THREE.Mesh(new THREE.BoxGeometry(11, 3.2, 3.2), mat);
        cont.position.set(x, y + 1.6, z);
        cont.castShadow = true;
        scene.add(cont);
        colliders.push(new THREE.Box3().setFromObject(cont));

        if ((r + c) % 2 === 1) {
          const cont2 = new THREE.Mesh(new THREE.BoxGeometry(11, 3.2, 3.2), mat);
          cont2.position.set(x, y + 4.8, z);
          cont2.castShadow = true;
          scene.add(cont2);
          colliders.push(new THREE.Box3().setFromObject(cont2));

          lootItems.push({
            id: `loot_cont_${x}_${z}`,
            type: 'ARMOR',
            name: 'Level 3 Military Helmet',
            x,
            y: y + 6.8,
            z,
          });
        }
      }
    }
  }

  /**
   * Generates foliage matching the specific landscape type:
   * TEMPERATE (Erangel), DESERT_CACTUS (Miramar), SNOW_PINES (Vikendi), TROPICAL_PALMS (Sanhok)
   */
  private static populateFoliageAndRocks(
    scene: THREE.Scene,
    getTerrainHeight: (x: number, z: number) => number,
    colliders: THREE.Box3[],
    foliageType: string,
    islandSize: number
  ) {
    const rockMat = new THREE.MeshStandardMaterial({
      color: foliageType === 'DESERT_CACTUS' ? 0x8a5538 : foliageType === 'SNOW_PINES' ? 0x3d4349 : 0x5a5e63,
      roughness: 0.95,
      flatShading: true,
    });

    const trunkMat = new THREE.MeshStandardMaterial({
      color: foliageType === 'TROPICAL_PALMS' ? 0x5c4028 : 0x3d2914,
      roughness: 0.9,
    });

    const leafColor =
      foliageType === 'DESERT_CACTUS'
        ? 0x606c38
        : foliageType === 'SNOW_PINES'
        ? 0xd8e2dc
        : foliageType === 'TROPICAL_PALMS'
        ? 0x2d6a4f
        : 0x22541c;

    const leafMat = new THREE.MeshStandardMaterial({ color: leafColor, roughness: 0.8, flatShading: true });

    // 140 Flora entities
    for (let i = 0; i < 140; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 50 + Math.random() * (islandSize * 0.42);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = getTerrainHeight(x, z);

      if (y < 2) continue;

      const flora = new THREE.Group();
      flora.position.set(x, y, z);

      if (foliageType === 'DESERT_CACTUS') {
        // Saguaro Cactus
        const cactusMat = new THREE.MeshStandardMaterial({ color: 0x4f6d38, roughness: 0.7 });
        const trunkH = 5 + Math.random() * 3;
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, trunkH, 8), cactusMat);
        trunk.position.y = trunkH / 2;
        flora.add(trunk);

        // Cactus side arms
        const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 2.5, 6), cactusMat);
        armL.position.set(-0.8, trunkH * 0.65, 0);
        const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 2.5, 6), cactusMat);
        armR.position.set(0.8, trunkH * 0.5, 0);
        flora.add(armL, armR);
      } else if (foliageType === 'TROPICAL_PALMS') {
        // Tropical Coconut Palm with curved trunk and palm leaf fronds
        const trunkH = 7 + Math.random() * 4;
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, trunkH, 7), trunkMat);
        trunk.position.y = trunkH / 2;
        trunk.rotation.z = (Math.random() - 0.5) * 0.2;
        flora.add(trunk);

        // Palm fronds
        for (let p = 0; p < 6; p++) {
          const frond = new THREE.Mesh(new THREE.ConeGeometry(1.8, 5, 4), leafMat);
          frond.position.set(0, trunkH, 0);
          frond.rotation.set(0.6, (p * Math.PI) / 3, 0);
          flora.add(frond);
        }
      } else {
        // Conical temperate or snow pine tree
        const trunkH = 4 + Math.random() * 3;
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, trunkH, 6), trunkMat);
        trunk.position.y = trunkH / 2;
        flora.add(trunk);

        const canopy = new THREE.Mesh(new THREE.ConeGeometry(3.2, 6, 7), leafMat);
        canopy.position.y = trunkH + 2.5;
        canopy.castShadow = true;
        flora.add(canopy);

        const canopy2 = new THREE.Mesh(new THREE.ConeGeometry(2.4, 4.5, 7), leafMat);
        canopy2.position.y = trunkH + 4.5;
        canopy2.castShadow = true;
        flora.add(canopy2);
      }

      scene.add(flora);
      colliders.push(new THREE.Box3(new THREE.Vector3(x - 0.8, y, z - 0.8), new THREE.Vector3(x + 0.8, y + 6, z + 0.8)));
    }

    // 70 Tactical Cover Boulders
    for (let i = 0; i < 70; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 40 + Math.random() * (islandSize * 0.42);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = getTerrainHeight(x, z);

      if (y < 2) continue;

      const rockScale = 1.2 + Math.random() * 2.2;
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(rockScale, 1), rockMat);
      rock.position.set(x, y + rockScale * 0.7, z);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.scale.set(1.2, 0.8, 1.4);
      rock.castShadow = true;
      rock.receiveShadow = true;

      scene.add(rock);
      colliders.push(new THREE.Box3().setFromObject(rock));
    }
  }

  private static populateFieldLoot(
    getTerrainHeight: (x: number, z: number) => number,
    lootItems: GroundLoot[],
    compounds: { name: string; x: number; z: number }[]
  ) {
    const guns = ['M416', 'AKM', 'SCAR_L', 'BERYL_M762', 'KAR98K', 'MINI14', 'UZI', 'VECTOR', 'S12K', 'M249', 'PANZERFAUST'];
    compounds.forEach((c, idx) => {
      // Spawn 3 loot drops around each compound
      const gunName = guns[idx % guns.length];
      lootItems.push({
        id: `c_loot_wep_${idx}`,
        type: 'WEAPON',
        name: gunName,
        x: c.x + 12,
        y: getTerrainHeight(c.x + 12, c.z + 10) + 0.4,
        z: c.z + 10,
      });

      lootItems.push({
        id: `c_loot_med_${idx}`,
        type: 'MEDKIT',
        name: 'First Aid Kit',
        x: c.x - 14,
        y: getTerrainHeight(c.x - 14, c.z - 8) + 0.4,
        z: c.z - 8,
      });

      lootItems.push({
        id: `c_loot_ammo_${idx}`,
        type: 'AMMO',
        name: 'Ammo Crate',
        x: c.x,
        y: getTerrainHeight(c.x, c.z - 15) + 0.4,
        z: c.z - 15,
      });
    });
  }
}
