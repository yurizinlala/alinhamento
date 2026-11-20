import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { SemanticMotif } from '../data/lyrics';
import { computeSceneStateForCue } from '../utils/choreography';

export interface SceneExternalInput {
  progress: number;
  audioEnergy: number;
  bassEnergy: number;
  pointerX: number;
  pointerY: number;
  isPlaying: boolean;
  wordPulse: number;
  motif: SemanticMotif;
  isFinale?: boolean;
}

// Pre-allocated scratch math helpers (zero GC in render loop)
const _vecCam = new THREE.Vector3();
const _vecLook = new THREE.Vector3();
const _vecSatA = new THREE.Vector3();
const _vecSatB = new THREE.Vector3();
const _vecSatC = new THREE.Vector3();
const _vecSyzygyA = new THREE.Vector3(-2.05, 0, 0.12);
const _vecSyzygyB = new THREE.Vector3(1.12, 0, -0.05);
const _vecSyzygyC = new THREE.Vector3(2.18, 0, -0.1);
const _colBg = new THREE.Color();
const _colBg2 = new THREE.Color();
const _colAurora = new THREE.Color();
const _colAccent = new THREE.Color();
const _colKey = new THREE.Color();
const _colRim = new THREE.Color();
const _colBlack = new THREE.Color('#000000');
const _dummy = new THREE.Object3D();

function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function createStarChartTexture(): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const cx = size / 2;
    const cy = size / 2;
    ctx.clearRect(0, 0, size, size);

    const radii = [470, 420, 345, 250, 165];
    radii.forEach((r, idx) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle =
        idx % 2 === 0 ? 'rgba(232, 168, 56, 0.34)' : 'rgba(244, 239, 230, 0.16)';
      ctx.lineWidth = idx === 0 ? 2.5 : 1.25;
      ctx.stroke();
    });

    for (let i = 0; i < 72; i++) {
      const ang = (i / 72) * Math.PI * 2;
      const major = i % 6 === 0;
      const rIn = major ? 426 : 446;
      const rOut = 470;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(ang) * rIn, cy + Math.sin(ang) * rIn);
      ctx.lineTo(cx + Math.cos(ang) * rOut, cy + Math.sin(ang) * rOut);
      ctx.strokeStyle = major
        ? 'rgba(248, 210, 130, 0.72)'
        : 'rgba(244, 239, 230, 0.25)';
      ctx.lineWidth = major ? 2.4 : 1;
      ctx.stroke();
    }

    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(ang) * 165, cy + Math.sin(ang) * 165);
      ctx.lineTo(cx + Math.cos(ang) * 420, cy + Math.sin(ang) * 420);
      ctx.strokeStyle = 'rgba(244, 239, 230, 0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createBrushedBumpTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, size, size);
    for (let y = 0; y < size; y++) {
      const shade = 112 + Math.floor(Math.sin(y * 0.7) * 18 + Math.random() * 24);
      ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
      ctx.fillRect(0, y, size, 1);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 2);
  tex.needsUpdate = true;
  return tex;
}

export class AlignmentScene {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean;

  private frameId = 0;
  private disposed = false;
  private startPerfMs = performance.now();
  private lastPerfMs = performance.now();

  private inputRef: () => SceneExternalInput;

  // Dynamic Shader Sky Dome
  private skyMat!: THREE.ShaderMaterial;

  // World 1: Astrolabe & Satellites
  private astrolabeGroup = new THREE.Group();
  private coreMesh!: THREE.Mesh;
  private coreHalo!: THREE.Mesh;
  private coreMat!: THREE.MeshPhysicalMaterial;
  private ringOuter!: THREE.Group;
  private ringMiddle!: THREE.Mesh;
  private ringInner!: THREE.Mesh;
  private dialPlane!: THREE.Mesh;
  private dialMat!: THREE.MeshBasicMaterial;
  private axisSpindle!: THREE.Group;
  private satelliteA!: THREE.Group;
  private satelliteB!: THREE.Group;
  private satelliteC!: THREE.Group;
  private syzygyBeamMesh!: THREE.Mesh;
  private syzygyBeamMat!: THREE.MeshBasicMaterial;
  private orbitArcA!: THREE.Mesh;
  private orbitArcB!: THREE.Mesh;

  // World 2: Liquid Kinetic Silk Wave (Estrofe I & Pré-Refrão)
  private waveMesh!: THREE.Mesh;
  private waveMat!: THREE.MeshPhysicalMaterial;

  // World 3: Electric Tunnel Portal Rings (Pré-Refrão I & II)
  private tunnelInstanced!: THREE.InstancedMesh;
  private tunnelMat!: THREE.MeshStandardMaterial;

  // World 4: Athens & Burning Rome Classical Colonnade + Pediment (Estrofe II)
  private templeInstanced!: THREE.InstancedMesh;
  private templeMat!: THREE.MeshStandardMaterial;
  private pedimentGroup = new THREE.Group();
  private pedimentMat!: THREE.MeshStandardMaterial;

  // World 5: Eternal Double Helix (Ponte & Final)
  private helixGroup = new THREE.Group();
  private helixMatA!: THREE.MeshPhysicalMaterial;
  private helixMatB!: THREE.MeshPhysicalMaterial;

  // World 6: Horological Meridian Hands ("Hora exata" / "Alinhamento")
  private clockHandsGroup = new THREE.Group();
  private clockHourHand!: THREE.Group;
  private clockMinuteHand!: THREE.Group;
  private clockHandMat!: THREE.MeshPhysicalMaterial;

  // World 7: Architectural Portal Arches ("No meio da sala" / "Atenas" / "Capelas")
  private archGroup = new THREE.Group();
  private archMat!: THREE.MeshPhysicalMaterial;

  // World 8: Living Room Vignette ("No meio da sala")
  private salaGroup = new THREE.Group();
  private salaWoodMat!: THREE.MeshStandardMaterial;
  private salaBrassMat!: THREE.MeshPhysicalMaterial;
  private salaLampGlowMat!: THREE.MeshBasicMaterial;

  // World 9: Celestial Seraphim Wings ("Eu te mostro os anjos")
  private wingsGroup = new THREE.Group();
  private leftWing = new THREE.Group();
  private rightWing = new THREE.Group();
  private wingMat!: THREE.MeshPhysicalMaterial;

  // World 10: Disco Mirrorball & Spotlight Cones ("Cada festa")
  private discoGroup = new THREE.Group();
  private discoBall!: THREE.Mesh;
  private discoBallMat!: THREE.MeshPhysicalMaterial;
  private discoConesGroup = new THREE.Group();
  private discoConeMat!: THREE.MeshBasicMaterial;

  // World 11: Coastal Horizon & Palms ("cada praia")
  private praiaGroup = new THREE.Group();
  private praiaSunMat!: THREE.MeshBasicMaterial;
  private praiaPalmMat!: THREE.MeshStandardMaterial;

  // World 12: Crescent Moon & Nocturnal Trails ("os rolês na madrugada")
  private madrugadaGroup = new THREE.Group();
  private madrugadaMoon!: THREE.Mesh;
  private madrugadaMoonMat!: THREE.MeshPhysicalMaterial;
  private madrugadaTrailMatA!: THREE.MeshBasicMaterial;
  private madrugadaTrailMatB!: THREE.MeshBasicMaterial;

  // World 13: Interlocking Heart Ribbons & Ruby Prism ("te amo" / "Amor da minha vida")
  private amorGroup = new THREE.Group();
  private amorPrism!: THREE.Mesh;
  private amorMatA!: THREE.MeshPhysicalMaterial;
  private amorMatB!: THREE.MeshPhysicalMaterial;

  // World 14: Rising Sculpted Flames ("queimando Roma")
  private romaFireGroup = new THREE.Group();
  private romaFlames: THREE.Mesh[] = [];
  private romaFireMat!: THREE.MeshBasicMaterial;
  private romaRingMat!: THREE.MeshBasicMaterial;

  // Constellation & Embers Instanced Field (reduced & refined)
  private starField!: THREE.InstancedMesh;
  private starBaseSeeds: Array<{
    angle: number;
    radius: number;
    yOffset: number;
    scale: number;
    speed: number;
  }> = [];

  private keyLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private rimLight!: THREE.PointLight;
  private coreLight!: THREE.PointLight;
  private fog!: THREE.FogExp2;

  // Damped runtime state
  private smoothCamPos = new THREE.Vector3(0, 1.1, 8.8);
  private smoothLookAt = new THREE.Vector3(0, 0.1, 0);
  private smoothCamRoll = 0;
  private smoothConvergence = 0.14;
  private smoothSyzygy = 0;
  private smoothRingSpread = 1.0;
  private smoothTilt = new THREE.Vector3(0.3, 0.25, 0.1);
  private smoothCoreIntensity = 0.85;
  private smoothParticleSpread = 1.0;
  private smoothWaveVis = 0.15;
  private smoothTunnelVis = 0;
  private smoothTempleVis = 0;
  private smoothHelixVis = 0;
  private smoothClockVis = 0.2;
  private smoothArchVis = 0;
  private smoothWingsVis = 0;
  private smoothDiscoVis = 0;
  private smoothPraiaVis = 0;
  private smoothMadrugadaVis = 0;
  private smoothAmorVis = 0;
  private smoothSalaVis = 0;
  private smoothRomaFireVis = 0;
  private smoothEmber = 0.1;
  private smoothEnergy = 0;
  private smoothBass = 0;
  private smoothWordPulse = 0;
  private smoothBlackout = 0;
  private contextLost = false;

  private disposables: Array<{ dispose: () => void }> = [];

  constructor(container: HTMLElement, getInput: () => SceneExternalInput) {
    this.container = container;
    this.inputRef = getInput;
    this.isSoftwareGl = detectSoftwareWebGL();

    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2)
    );
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#07080E');
    this.fog = new THREE.FogExp2('#07080E', 0.028);
    this.scene.fog = this.fog;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 120);
    this.camera.position.copy(this.smoothCamPos);
    this.camera.lookAt(this.smoothLookAt);

    // Mandatory studio environment reflection for metallic/crystal PBR
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = envTex;
    this.disposables.push(envTex);
    pmremGenerator.dispose();

    this.buildLights();
    this.buildAuroraSkyDome();
    this.buildAstrolabe();
    this.buildLiquidWaveWorld();
    this.buildElectricTunnelWorld();
    this.buildClassicalTempleWorld();
    this.buildInfinityHelixWorld();
    this.buildClockHandsWorld();
    this.buildArchitecturalArchesWorld();
    this.buildSalaWorld();
    this.buildWingsWorld();
    this.buildDiscoWorld();
    this.buildPraiaWorld();
    this.buildMadrugadaWorld();
    this.buildAmorWorld();
    this.buildRomaFireWorld();
    this.buildConstellationInstancedField();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.renderer.domElement.addEventListener('webglcontextlost', this.handleContextLost);
    this.renderer.domElement.addEventListener('webglcontextrestored', this.handleContextRestored);
    window.addEventListener('resize', this.handleResize);

    this.tick();
  }

  private buildLights(): void {
    this.hemiLight = new THREE.HemisphereLight(0x8bb2eb, 0x1a1412, 0.78);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight(0xffd699, 2.35);
    this.keyLight.position.set(5.5, 7.5, 6.0);
    if (!this.isSoftwareGl) {
      this.keyLight.castShadow = true;
      this.keyLight.shadow.mapSize.set(1024, 1024);
      this.keyLight.shadow.camera.near = 1;
      this.keyLight.shadow.camera.far = 28;
      const d = 8;
      this.keyLight.shadow.camera.left = -d;
      this.keyLight.shadow.camera.right = d;
      this.keyLight.shadow.camera.top = d;
      this.keyLight.shadow.camera.bottom = -d;
      this.keyLight.shadow.bias = -0.0005;
      this.keyLight.shadow.normalBias = 0.02;
    }
    this.scene.add(this.keyLight);

    this.rimLight = new THREE.PointLight(0x6e9be1, 3.6, 26);
    this.rimLight.position.set(-5.2, -2.5, -4.5);
    this.scene.add(this.rimLight);

    this.coreLight = new THREE.PointLight(0xe8a838, 3.0, 20);
    this.coreLight.position.set(0, 0, -0.8);
    this.scene.add(this.coreLight);
  }

  private buildAuroraSkyDome(): void {
    const skyGeo = new THREE.SphereGeometry(42, 32, 24);
    this.skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uBgPrimary: { value: new THREE.Color('#07080E') },
        uBgSecondary: { value: new THREE.Color('#121626') },
        uAurora: { value: new THREE.Color('#E8A838') },
        uEnergy: { value: 0 },
        uProgress: { value: 0 },
        uBlackout: { value: 0 },
      },
      vertexShader: `
        varying vec3 vWorldDir;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldDir = normalize(worldPos.xyz);
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uBgPrimary;
        uniform vec3 uBgSecondary;
        uniform vec3 uAurora;
        uniform float uEnergy;
        uniform float uProgress;
        uniform float uBlackout;
        varying vec3 vWorldDir;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
            u.y
          );
        }

        void main() {
          vec3 d = normalize(vWorldDir);
          float horizon = smoothstep(-0.4, 0.72, d.y);
          vec3 base = mix(uBgSecondary * 1.15, uBgPrimary * 1.08, horizon);

          vec2 uvFlow = vec2(atan(d.z, d.x) * 1.6 + uTime * 0.06 + uProgress * 2.5, d.y * 3.2 - uTime * 0.04);
          float n1 = noise(uvFlow * 2.2);
          float n2 = noise(uvFlow * 4.5 - vec2(uTime * 0.08, 0.0));
          float ribbon = smoothstep(0.38, 0.86, n1 * 0.65 + n2 * 0.35);

          float centerGlow = pow(max(0.0, dot(d, normalize(vec3(0.0, 0.05, -1.0)))), 2.8);
          vec3 col = base + uAurora * (ribbon * (0.28 + uEnergy * 0.2) + centerGlow * 0.26);
          col *= (1.0 - uBlackout);
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    const skyMesh = new THREE.Mesh(skyGeo, this.skyMat);
    this.scene.add(skyMesh);
    this.disposables.push(skyGeo, this.skyMat);
  }

  private buildAstrolabe(): void {
    const bumpTex = createBrushedBumpTexture();
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    bumpTex.anisotropy = maxAniso;
    this.disposables.push(bumpTex);

    const goldMat = new THREE.MeshPhysicalMaterial({
      color: 0xe8b44c,
      metalness: 0.94,
      roughness: 0.16,
      anisotropy: 0.85,
      clearcoat: 0.45,
      bumpMap: bumpTex,
      bumpScale: 0.008,
    });

    const obsidianTitaniumMat = new THREE.MeshStandardMaterial({
      color: 0x222836,
      metalness: 0.82,
      roughness: 0.46,
      bumpMap: bumpTex,
      bumpScale: 0.012,
    });

    const copperMat = new THREE.MeshPhysicalMaterial({
      color: 0xd97449,
      metalness: 0.9,
      roughness: 0.22,
      anisotropy: 0.75,
    });

    const matteCeramicMat = new THREE.MeshStandardMaterial({
      color: 0xe8dfd0,
      metalness: 0.12,
      roughness: 0.78,
    });

    this.coreMat = new THREE.MeshPhysicalMaterial({
      color: 0xc97b1e,
      emissive: new THREE.Color(0x9e560e),
      emissiveIntensity: 0.58,
      metalness: 0.52,
      roughness: 0.24,
      clearcoat: 1.0,
    });

    this.coreMat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 };
      this.coreMat.userData.shader = shader;
      shader.vertexShader = 'uniform float uTime;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        float wave = sin(position.x * 5.0 + uTime * 2.4) * cos(position.y * 5.0 - uTime * 1.9);
        transformed += normal * (wave * 0.022);
        `
      );
    };

    const crystalShellMat = new THREE.MeshPhysicalMaterial({
      color: 0xf4efe6,
      metalness: 0.05,
      roughness: 0.06,
      ior: 1.55,
      thickness: 0.8,
      clearcoat: 1.0,
      transmission: this.isSoftwareGl ? 0 : 0.76,
      transparent: true,
      opacity: this.isSoftwareGl ? 0.42 : 1.0,
      depthWrite: false,
    });

    this.disposables.push(
      goldMat,
      obsidianTitaniumMat,
      copperMat,
      matteCeramicMat,
      this.coreMat,
      crystalShellMat
    );

    const coreGeo = new THREE.IcosahedronGeometry(0.4, 2);
    this.coreMesh = new THREE.Mesh(coreGeo, this.coreMat);
    this.coreMesh.castShadow = !this.isSoftwareGl;
    this.astrolabeGroup.add(this.coreMesh);

    const haloGeo = new THREE.TorusGeometry(0.72, 0.02, 16, 64);
    this.coreHalo = new THREE.Mesh(haloGeo, goldMat);
    this.coreHalo.rotation.x = Math.PI / 2;
    this.astrolabeGroup.add(this.coreHalo);
    this.disposables.push(coreGeo, haloGeo);

    this.ringOuter = new THREE.Group();
    const outerTorusGeo = new THREE.TorusGeometry(2.65, 0.055, 20, 96);
    const outerTorus = new THREE.Mesh(outerTorusGeo, goldMat);
    outerTorus.castShadow = !this.isSoftwareGl;
    outerTorus.receiveShadow = !this.isSoftwareGl;
    this.ringOuter.add(outerTorus);

    const tickGeo = new THREE.BoxGeometry(0.03, 0.16, 0.07);
    const tickInstanced = new THREE.InstancedMesh(tickGeo, matteCeramicMat, 24);
    for (let i = 0; i < 24; i++) {
      const ang = (i / 24) * Math.PI * 2;
      _dummy.position.set(Math.cos(ang) * 2.52, Math.sin(ang) * 2.52, 0);
      _dummy.rotation.set(0, 0, ang - Math.PI / 2);
      _dummy.scale.set(1, i % 3 === 0 ? 1.45 : 0.85, 1);
      _dummy.updateMatrix();
      tickInstanced.setMatrixAt(i, _dummy.matrix);
    }
    tickInstanced.computeBoundingSphere();
    this.ringOuter.add(tickInstanced);
    this.astrolabeGroup.add(this.ringOuter);
    this.disposables.push(outerTorusGeo, tickGeo);

    const midGeo = new THREE.TorusGeometry(2.15, 0.065, 18, 84);
    this.ringMiddle = new THREE.Mesh(midGeo, obsidianTitaniumMat);
    this.ringMiddle.rotation.y = Math.PI / 3;
    this.astrolabeGroup.add(this.ringMiddle);
    this.disposables.push(midGeo);

    const innerGeo = new THREE.TorusGeometry(1.62, 0.042, 16, 72);
    this.ringInner = new THREE.Mesh(innerGeo, copperMat);
    this.ringInner.rotation.x = Math.PI / 4;
    this.astrolabeGroup.add(this.ringInner);
    this.disposables.push(innerGeo);

    const chartTex = createStarChartTexture();
    chartTex.anisotropy = maxAniso;
    const dialGeo = new THREE.CircleGeometry(2.8, 64);
    this.dialMat = new THREE.MeshBasicMaterial({
      map: chartTex,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    this.dialPlane = new THREE.Mesh(dialGeo, this.dialMat);
    this.dialPlane.rotation.x = -Math.PI / 2;
    this.astrolabeGroup.add(this.dialPlane);
    this.disposables.push(chartTex, dialGeo, this.dialMat);

    this.axisSpindle = new THREE.Group();
    const lathePoints = [
      new THREE.Vector2(0.0, -3.1),
      new THREE.Vector2(0.04, -2.75),
      new THREE.Vector2(0.015, -2.4),
      new THREE.Vector2(0.015, 2.4),
      new THREE.Vector2(0.04, 2.75),
      new THREE.Vector2(0.0, 3.1),
    ];
    const spindleGeo = new THREE.LatheGeometry(lathePoints, 16);
    const spindleMesh = new THREE.Mesh(spindleGeo, obsidianTitaniumMat);
    this.axisSpindle.add(spindleMesh);

    const finialGeo = new THREE.ConeGeometry(0.09, 0.34, 16);
    const topFinial = new THREE.Mesh(finialGeo, goldMat);
    topFinial.position.y = 3.18;
    const botFinial = new THREE.Mesh(finialGeo, goldMat);
    botFinial.position.y = -3.18;
    botFinial.rotation.x = Math.PI;
    this.axisSpindle.add(topFinial, botFinial);
    this.astrolabeGroup.add(this.axisSpindle);
    this.disposables.push(spindleGeo, finialGeo);

    const satCoreGeo = new THREE.SphereGeometry(0.18, 24, 24);
    const satRingGeo = new THREE.TorusGeometry(0.29, 0.018, 12, 40);
    const satShellGeo = new THREE.SphereGeometry(0.24, 20, 20);
    this.disposables.push(satCoreGeo, satRingGeo, satShellGeo);

    const createCompositeSatellite = (
      innerMat: THREE.Material,
      ringMat: THREE.Material
    ): THREE.Group => {
      const grp = new THREE.Group();
      const sphere = new THREE.Mesh(satCoreGeo, innerMat);
      const miniRing = new THREE.Mesh(satRingGeo, ringMat);
      miniRing.rotation.x = Math.PI / 2.4;
      const shell = new THREE.Mesh(satShellGeo, crystalShellMat);
      shell.renderOrder = 4;
      grp.add(sphere, miniRing, shell);
      return grp;
    };

    this.satelliteA = createCompositeSatellite(goldMat, matteCeramicMat);
    this.satelliteB = createCompositeSatellite(copperMat, goldMat);
    this.satelliteC = createCompositeSatellite(matteCeramicMat, copperMat);
    this.satelliteC.scale.setScalar(1.22);
    this.astrolabeGroup.add(this.satelliteA, this.satelliteB, this.satelliteC);

    // Luminous alignment syzygy filament piercing the aligned planets + central sun
    const beamGeo = new THREE.CylinderGeometry(0.02, 0.02, 5.8, 12);
    beamGeo.rotateZ(Math.PI / 2);
    this.syzygyBeamMat = new THREE.MeshBasicMaterial({
      color: 0xffe084,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.syzygyBeamMesh = new THREE.Mesh(beamGeo, this.syzygyBeamMat);
    this.syzygyBeamMesh.visible = false;
    this.astrolabeGroup.add(this.syzygyBeamMesh);
    this.disposables.push(beamGeo, this.syzygyBeamMat);

    const arcGeo = new THREE.TorusGeometry(1.9, 0.011, 8, 96);
    const arcMatA = new THREE.MeshBasicMaterial({
      color: 0xe8a838,
      transparent: true,
      opacity: 0.35,
    });
    const arcMatB = new THREE.MeshBasicMaterial({
      color: 0xd97449,
      transparent: true,
      opacity: 0.35,
    });
    this.orbitArcA = new THREE.Mesh(arcGeo, arcMatA);
    this.orbitArcB = new THREE.Mesh(arcGeo, arcMatB);
    this.astrolabeGroup.add(this.orbitArcA, this.orbitArcB);
    this.disposables.push(arcGeo, arcMatA, arcMatB);

    this.astrolabeGroup.position.z = -1.2;
    this.scene.add(this.astrolabeGroup);
  }

  private buildLiquidWaveWorld(): void {
    const waveGeo = new THREE.PlaneGeometry(26, 16, 44, 24);
    this.waveMat = new THREE.MeshPhysicalMaterial({
      color: 0x3a1c28,
      emissive: new THREE.Color(0x521d24),
      emissiveIntensity: 0.35,
      metalness: 0.72,
      roughness: 0.25,
      wireframe: true,
      transparent: true,
      opacity: 0.0,
    });
    this.waveMat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 };
      shader.uniforms.uAmp = { value: 0.65 };
      this.waveMat.userData.shader = shader;
      shader.vertexShader = 'uniform float uTime;\nuniform float uAmp;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        float w1 = sin(position.x * 0.55 + uTime * 1.4) * cos(position.y * 0.45 + uTime * 1.1);
        float w2 = sin((position.x + position.y) * 0.35 - uTime * 0.9);
        transformed.z += (w1 * 0.7 + w2 * 0.4) * uAmp;
        `
      );
    };
    this.waveMesh = new THREE.Mesh(waveGeo, this.waveMat);
    this.waveMesh.rotation.x = -Math.PI / 2.25;
    this.waveMesh.position.set(0, -3.2, -3.5);
    this.scene.add(this.waveMesh);
    this.disposables.push(waveGeo, this.waveMat);
  }

  private buildElectricTunnelWorld(): void {
    const ringGeo = new THREE.TorusGeometry(4.2, 0.032, 10, 64);
    this.tunnelMat = new THREE.MeshStandardMaterial({
      color: 0x6cd0ff,
      emissive: new THREE.Color(0x2884d8),
      emissiveIntensity: 0.9,
      metalness: 0.85,
      roughness: 0.2,
      transparent: true,
      opacity: 0.0,
    });
    this.tunnelInstanced = new THREE.InstancedMesh(ringGeo, this.tunnelMat, 10);
    this.tunnelInstanced.frustumCulled = false;
    this.scene.add(this.tunnelInstanced);
    this.disposables.push(ringGeo, this.tunnelMat);
  }

  private buildClassicalTempleWorld(): void {
    // Fluted classical pillar profile using LatheGeometry (Athens & burning Rome!)
    const pts = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.38, 0.0),
      new THREE.Vector2(0.38, 0.22),
      new THREE.Vector2(0.26, 0.32),
      new THREE.Vector2(0.22, 4.6),
      new THREE.Vector2(0.34, 4.82),
      new THREE.Vector2(0.36, 5.05),
      new THREE.Vector2(0.0, 5.05),
    ];
    const pillarGeo = new THREE.LatheGeometry(pts, 14);
    this.templeMat = new THREE.MeshStandardMaterial({
      color: 0xe6d3be,
      emissive: new THREE.Color(0x7a1f10),
      emissiveIntensity: 0.28,
      metalness: 0.22,
      roughness: 0.65,
      transparent: true,
      opacity: 0.0,
    });
    this.templeInstanced = new THREE.InstancedMesh(pillarGeo, this.templeMat, 12);
    this.templeInstanced.frustumCulled = false;
    this.scene.add(this.templeInstanced);
    this.disposables.push(pillarGeo, this.templeMat);

    // Classical Parthenon Pediment & Entablature crowning the colonnade
    this.pedimentMat = new THREE.MeshStandardMaterial({
      color: 0xefe2d0,
      emissive: new THREE.Color(0x402618),
      emissiveIntensity: 0.25,
      metalness: 0.18,
      roughness: 0.58,
      transparent: true,
      opacity: 0.0,
    });
    const beamGeo = new THREE.BoxGeometry(9.8, 0.34, 1.4);
    const beamMesh = new THREE.Mesh(beamGeo, this.pedimentMat);
    const gableShape = new THREE.Shape();
    gableShape.moveTo(-4.8, 0);
    gableShape.lineTo(4.8, 0);
    gableShape.lineTo(0, 1.45);
    gableShape.closePath();
    const gableGeo = new THREE.ExtrudeGeometry(gableShape, {
      depth: 1.2,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.05,
      bevelThickness: 0.05,
    });
    gableGeo.translate(0, 0.17, -0.6);
    const gableMesh = new THREE.Mesh(gableGeo, this.pedimentMat);
    this.pedimentGroup.add(beamMesh, gableMesh);
    this.pedimentGroup.position.set(0, 2.75, -5.2);
    this.pedimentGroup.visible = false;
    this.scene.add(this.pedimentGroup);
    this.disposables.push(beamGeo, gableGeo, this.pedimentMat);
  }

  private buildInfinityHelixWorld(): void {
    const ptsA: THREE.Vector3[] = [];
    const ptsB: THREE.Vector3[] = [];
    const steps = 96;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      const r = 4.3 + Math.cos(t * 2) * 0.55;
      ptsA.push(new THREE.Vector3(Math.cos(t) * r, Math.sin(t * 2) * 1.4, Math.sin(t) * r));
      ptsB.push(
        new THREE.Vector3(
          Math.cos(t + Math.PI) * r,
          Math.sin((t + Math.PI) * 2) * 1.4,
          Math.sin(t + Math.PI) * r
        )
      );
    }
    const curveA = new THREE.CatmullRomCurve3(ptsA, true);
    const curveB = new THREE.CatmullRomCurve3(ptsB, true);
    const tubeGeoA = new THREE.TubeGeometry(curveA, 96, 0.036, 10, true);
    const tubeGeoB = new THREE.TubeGeometry(curveB, 96, 0.028, 10, true);

    this.helixMatA = new THREE.MeshPhysicalMaterial({
      color: 0xf4e8d2,
      emissive: new THREE.Color(0x8c7040),
      emissiveIntensity: 0.45,
      metalness: 0.88,
      roughness: 0.18,
      transparent: true,
      opacity: 0.0,
    });
    this.helixMatB = new THREE.MeshPhysicalMaterial({
      color: 0xaec8ff,
      emissive: new THREE.Color(0x4c6cb8),
      emissiveIntensity: 0.45,
      metalness: 0.85,
      roughness: 0.22,
      transparent: true,
      opacity: 0.0,
    });

    const meshA = new THREE.Mesh(tubeGeoA, this.helixMatA);
    const meshB = new THREE.Mesh(tubeGeoB, this.helixMatB);
    this.helixGroup.add(meshA, meshB);
    this.helixGroup.position.z = -1.2;
    this.scene.add(this.helixGroup);
    this.disposables.push(tubeGeoA, tubeGeoB, this.helixMatA, this.helixMatB);
  }

  private buildClockHandsWorld(): void {
    this.clockHandMat = new THREE.MeshPhysicalMaterial({
      color: 0xffd56e,
      emissive: new THREE.Color(0xc48218),
      emissiveIntensity: 0.55,
      metalness: 0.92,
      roughness: 0.18,
      transparent: true,
      opacity: 0.0,
    });

    const hourGeo = new THREE.BoxGeometry(0.055, 1.45, 0.025);
    const minGeo = new THREE.BoxGeometry(0.036, 2.25, 0.02);
    const dialRimGeo = new THREE.TorusGeometry(2.38, 0.018, 12, 72);

    this.clockHourHand = new THREE.Group();
    const hourMesh = new THREE.Mesh(hourGeo, this.clockHandMat);
    hourMesh.position.y = 0.65;
    this.clockHourHand.add(hourMesh);

    this.clockMinuteHand = new THREE.Group();
    const minMesh = new THREE.Mesh(minGeo, this.clockHandMat);
    minMesh.position.y = 1.05;
    this.clockMinuteHand.add(minMesh);

    const dialRim = new THREE.Mesh(dialRimGeo, this.clockHandMat);
    this.clockHandsGroup.add(dialRim, this.clockHourHand, this.clockMinuteHand);
    this.clockHandsGroup.position.set(0, 0, -1.05);
    this.scene.add(this.clockHandsGroup);
    this.disposables.push(hourGeo, minGeo, dialRimGeo, this.clockHandMat);
  }

  private buildArchitecturalArchesWorld(): void {
    this.archMat = new THREE.MeshPhysicalMaterial({
      color: 0xf4e3cf,
      emissive: new THREE.Color(0x6e4422),
      emissiveIntensity: 0.3,
      metalness: 0.45,
      roughness: 0.38,
      transparent: true,
      opacity: 0.0,
    });

    const archGeo = new THREE.TorusGeometry(3.4, 0.045, 14, 64, Math.PI);
    for (let i = 0; i < 3; i++) {
      const archMesh = new THREE.Mesh(archGeo, this.archMat);
      const scale = 0.78 + i * 0.24;
      archMesh.scale.setScalar(scale);
      archMesh.position.set(0, -1.65, -2.2 - i * 1.45);
      this.archGroup.add(archMesh);
    }
    this.scene.add(this.archGroup);
    this.disposables.push(archGeo, this.archMat);
  }

  private buildSalaWorld(): void {
    this.salaWoodMat = new THREE.MeshStandardMaterial({
      color: 0x6a3c28,
      emissive: new THREE.Color(0x281209),
      emissiveIntensity: 0.35,
      metalness: 0.2,
      roughness: 0.62,
      transparent: true,
      opacity: 0.0,
    });
    this.salaBrassMat = new THREE.MeshPhysicalMaterial({
      color: 0xe6b45c,
      emissive: new THREE.Color(0x6c4212),
      emissiveIntensity: 0.3,
      metalness: 0.9,
      roughness: 0.22,
      transparent: true,
      opacity: 0.0,
    });
    this.salaLampGlowMat = new THREE.MeshBasicMaterial({
      color: 0xffd28a,
      transparent: true,
      opacity: 0.0,
    });

    // Mid-century round coffee table + brass pedestal
    const tableTopGeo = new THREE.CylinderGeometry(1.15, 1.15, 0.08, 36);
    const tableTop = new THREE.Mesh(tableTopGeo, this.salaWoodMat);
    tableTop.position.set(2.3, -1.25, -2.1);

    const pedestalPts = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.45, 0),
      new THREE.Vector2(0.11, 0.24),
      new THREE.Vector2(0.08, 1.05),
      new THREE.Vector2(0.28, 1.18),
      new THREE.Vector2(0, 1.18),
    ];
    const pedestalGeo = new THREE.LatheGeometry(pedestalPts, 20);
    const pedestal = new THREE.Mesh(pedestalGeo, this.salaBrassMat);
    pedestal.position.set(2.3, -2.42, -2.1);

    // Floor architectural framing bars + warm dome lamp
    const floorStripGeo = new THREE.BoxGeometry(8.5, 0.03, 0.08);
    for (let i = -2; i <= 2; i++) {
      const strip = new THREE.Mesh(floorStripGeo, this.salaWoodMat);
      strip.position.set(0, -2.45, -2.4 + i * 0.95);
      this.salaGroup.add(strip);
    }

    const lampStemGeo = new THREE.CylinderGeometry(0.035, 0.055, 2.9, 12);
    const lampStem = new THREE.Mesh(lampStemGeo, this.salaBrassMat);
    lampStem.position.set(-2.6, -1.0, -2.4);

    const shadePts = [
      new THREE.Vector2(0.06, 0.55),
      new THREE.Vector2(0.28, 0.45),
      new THREE.Vector2(0.55, 0.0),
    ];
    const lampShadeGeo = new THREE.LatheGeometry(shadePts, 24);
    const lampShade = new THREE.Mesh(lampShadeGeo, this.salaBrassMat);
    lampShade.position.set(-2.6, 0.22, -2.4);

    const bulbGeo = new THREE.SphereGeometry(0.2, 16, 16);
    const bulbMesh = new THREE.Mesh(bulbGeo, this.salaLampGlowMat);
    bulbMesh.position.set(-2.6, 0.3, -2.4);

    this.salaGroup.add(tableTop, pedestal, lampStem, lampShade, bulbMesh);
    this.salaGroup.visible = false;
    this.scene.add(this.salaGroup);
    this.disposables.push(
      tableTopGeo,
      pedestalGeo,
      floorStripGeo,
      lampStemGeo,
      lampShadeGeo,
      bulbGeo,
      this.salaWoodMat,
      this.salaBrassMat,
      this.salaLampGlowMat
    );
  }

  private buildWingsWorld(): void {
    this.wingMat = new THREE.MeshPhysicalMaterial({
      color: 0xfff3de,
      emissive: new THREE.Color(0x9a7a3e),
      emissiveIntensity: 0.45,
      metalness: 0.42,
      roughness: 0.24,
      clearcoat: 0.75,
      transparent: true,
      opacity: 0.0,
    });

    const featherShape = new THREE.Shape();
    featherShape.moveTo(0, 0);
    featherShape.quadraticCurveTo(0.45, 0.32, 2.25, 0.14);
    featherShape.quadraticCurveTo(0.8, -0.22, 0, -0.14);
    featherShape.closePath();

    const featherGeo = new THREE.ExtrudeGeometry(featherShape, {
      depth: 0.045,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.015,
      bevelThickness: 0.015,
    });

    for (let i = 0; i < 6; i++) {
      const lenScale = 1.25 - i * 0.12;
      const angle = 0.48 - i * 0.19;
      const fR = new THREE.Mesh(featherGeo, this.wingMat);
      fR.scale.set(lenScale, 1.0 - i * 0.06, 1);
      fR.rotation.z = angle;
      fR.position.set(0.32, 0.45 - i * 0.22, -i * 0.04);
      this.rightWing.add(fR);

      const fL = new THREE.Mesh(featherGeo, this.wingMat);
      fL.scale.set(-lenScale, 1.0 - i * 0.06, 1);
      fL.rotation.z = -angle;
      fL.position.set(-0.32, 0.45 - i * 0.22, -i * 0.04);
      this.leftWing.add(fL);
    }

    this.wingsGroup.add(this.leftWing, this.rightWing);
    this.wingsGroup.position.set(0, 0.1, -2.1);
    this.wingsGroup.visible = false;
    this.scene.add(this.wingsGroup);
    this.disposables.push(featherGeo, this.wingMat);
  }

  private buildDiscoWorld(): void {
    this.discoBallMat = new THREE.MeshPhysicalMaterial({
      color: 0xf4e8ff,
      emissive: new THREE.Color(0x9a2ea8),
      emissiveIntensity: 0.45,
      metalness: 0.98,
      roughness: 0.08,
      flatShading: true,
      transparent: true,
      opacity: 0.0,
    });
    this.discoConeMat = new THREE.MeshBasicMaterial({
      color: 0xff62dc,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const ballGeo = new THREE.IcosahedronGeometry(0.62, 1);
    this.discoBall = new THREE.Mesh(ballGeo, this.discoBallMat);
    this.discoBall.position.set(2.1, 1.25, -1.7);

    const coneGeo = new THREE.ConeGeometry(1.15, 6.4, 20, 1, true);
    coneGeo.translate(0, -3.2, 0);
    for (let i = 0; i < 4; i++) {
      const cone = new THREE.Mesh(coneGeo, this.discoConeMat);
      cone.rotation.z = (i / 4) * Math.PI * 2 + 0.4;
      cone.rotation.x = (i % 2 === 0 ? 1 : -1) * 0.35;
      this.discoConesGroup.add(cone);
    }
    this.discoConesGroup.position.copy(this.discoBall.position);

    this.discoGroup.add(this.discoBall, this.discoConesGroup);
    this.discoGroup.visible = false;
    this.scene.add(this.discoGroup);
    this.disposables.push(ballGeo, coneGeo, this.discoBallMat, this.discoConeMat);
  }

  private buildPraiaWorld(): void {
    this.praiaSunMat = new THREE.MeshBasicMaterial({
      color: 0x6ef7e4,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.praiaPalmMat = new THREE.MeshStandardMaterial({
      color: 0x194d56,
      emissive: new THREE.Color(0x20847c),
      emissiveIntensity: 0.65,
      metalness: 0.18,
      roughness: 0.65,
      transparent: true,
      opacity: 0.0,
    });

    const sunGeo = new THREE.CircleGeometry(2.1, 48);
    const sunMesh = new THREE.Mesh(sunGeo, this.praiaSunMat);
    sunMesh.position.set(0, 0.55, -7.8);

    const buildPalm = (xPos: number, tiltDir: number) => {
      const palm = new THREE.Group();
      const trunkCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.25 * tiltDir, 1.3, 0.1),
        new THREE.Vector3(0.65 * tiltDir, 2.55, 0.0),
      ]);
      const trunkGeo = new THREE.TubeGeometry(trunkCurve, 16, 0.095, 8, false);
      const trunkMesh = new THREE.Mesh(trunkGeo, this.praiaPalmMat);
      palm.add(trunkMesh);
      this.disposables.push(trunkGeo);

      const frondShape = new THREE.Shape();
      frondShape.moveTo(0, 0);
      frondShape.quadraticCurveTo(0.65, 0.25, 1.35, -0.35);
      frondShape.quadraticCurveTo(0.55, 0.02, 0, -0.05);
      frondShape.closePath();
      const frondGeo = new THREE.ExtrudeGeometry(frondShape, {
        depth: 0.025,
        bevelEnabled: false,
      });
      this.disposables.push(frondGeo);

      for (let i = 0; i < 6; i++) {
        const frond = new THREE.Mesh(frondGeo, this.praiaPalmMat);
        frond.position.set(0.65 * tiltDir, 2.55, 0);
        frond.rotation.y = (i / 6) * Math.PI * 2;
        frond.rotation.z = -0.15;
        palm.add(frond);
      }
      palm.position.set(xPos, -1.85, -2.5);
      return palm;
    };

    const leftPalm = buildPalm(-3.05, 1);
    const rightPalm = buildPalm(3.0, -1);

    this.praiaGroup.add(sunMesh, leftPalm, rightPalm);
    this.praiaGroup.visible = false;
    this.scene.add(this.praiaGroup);
    this.disposables.push(sunGeo, this.praiaSunMat, this.praiaPalmMat);
  }

  private buildMadrugadaWorld(): void {
    this.madrugadaMoonMat = new THREE.MeshPhysicalMaterial({
      color: 0xd8e8ff,
      emissive: new THREE.Color(0x4b74d6),
      emissiveIntensity: 0.65,
      metalness: 0.55,
      roughness: 0.22,
      transparent: true,
      opacity: 0.0,
    });
    this.madrugadaTrailMatA = new THREE.MeshBasicMaterial({
      color: 0x6ea8ff,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.madrugadaTrailMatB = new THREE.MeshBasicMaterial({
      color: 0xffb85c,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const moonShape = new THREE.Shape();
    moonShape.absarc(0, 0, 0.92, -Math.PI * 0.42, Math.PI * 0.42, false);
    moonShape.absarc(0.36, 0, 0.74, Math.PI * 0.38, -Math.PI * 0.38, true);
    moonShape.closePath();
    const moonGeo = new THREE.ExtrudeGeometry(moonShape, {
      depth: 0.18,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.04,
      bevelThickness: 0.04,
    });
    moonGeo.center();
    this.madrugadaMoon = new THREE.Mesh(moonGeo, this.madrugadaMoonMat);
    this.madrugadaMoon.position.set(-2.35, 1.25, -2.5);

    const trailCurveA = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-4.8, -2.2, -5.5),
      new THREE.Vector3(-1.4, -1.65, -3.2),
      new THREE.Vector3(1.8, -1.85, -1.8),
      new THREE.Vector3(5.2, -1.4, -4.2),
    ]);
    const trailCurveB = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-5.0, -1.9, -4.6),
      new THREE.Vector3(-1.2, -1.45, -2.6),
      new THREE.Vector3(2.2, -1.65, -2.2),
      new THREE.Vector3(5.4, -1.25, -5.0),
    ]);
    const trailGeoA = new THREE.TubeGeometry(trailCurveA, 64, 0.045, 8, false);
    const trailGeoB = new THREE.TubeGeometry(trailCurveB, 64, 0.032, 8, false);
    const trailA = new THREE.Mesh(trailGeoA, this.madrugadaTrailMatA);
    const trailB = new THREE.Mesh(trailGeoB, this.madrugadaTrailMatB);

    this.madrugadaGroup.add(this.madrugadaMoon, trailA, trailB);
    this.madrugadaGroup.visible = false;
    this.scene.add(this.madrugadaGroup);
    this.disposables.push(
      moonGeo,
      trailGeoA,
      trailGeoB,
      this.madrugadaMoonMat,
      this.madrugadaTrailMatA,
      this.madrugadaTrailMatB
    );
  }

  private buildAmorWorld(): void {
    this.amorMatA = new THREE.MeshPhysicalMaterial({
      color: 0xff8cb4,
      emissive: new THREE.Color(0xc22b66),
      emissiveIntensity: 0.65,
      metalness: 0.82,
      roughness: 0.16,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.0,
    });
    this.amorMatB = new THREE.MeshPhysicalMaterial({
      color: 0xffd2b8,
      emissive: new THREE.Color(0x9a3d52),
      emissiveIntensity: 0.45,
      metalness: 0.9,
      roughness: 0.18,
      transparent: true,
      opacity: 0.0,
    });

    const pts: THREE.Vector3[] = [];
    const steps = 80;
    for (let i = 0; i < steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      const hx = 16 * Math.pow(Math.sin(t), 3);
      const hy =
        13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      pts.push(new THREE.Vector3(hx * 0.135, hy * 0.135, Math.sin(t * 2) * 0.25));
    }
    const heartCurve = new THREE.CatmullRomCurve3(pts, true);
    const heartGeoA = new THREE.TubeGeometry(heartCurve, 84, 0.048, 12, true);
    const heartGeoB = new THREE.TubeGeometry(heartCurve, 84, 0.032, 10, true);

    const heartMeshA = new THREE.Mesh(heartGeoA, this.amorMatA);
    const heartMeshB = new THREE.Mesh(heartGeoB, this.amorMatB);
    heartMeshB.rotation.y = 0.42;
    heartMeshB.scale.setScalar(1.18);

    const prismGeo = new THREE.OctahedronGeometry(0.32, 0);
    this.amorPrism = new THREE.Mesh(prismGeo, this.amorMatA);
    this.amorPrism.position.set(0, -0.1, 0.45);

    this.amorGroup.add(heartMeshA, heartMeshB, this.amorPrism);
    this.amorGroup.position.set(0, 0.05, -1.25);
    this.amorGroup.visible = false;
    this.scene.add(this.amorGroup);
    this.disposables.push(heartGeoA, heartGeoB, prismGeo, this.amorMatA, this.amorMatB);
  }

  private buildRomaFireWorld(): void {
    this.romaFireMat = new THREE.MeshBasicMaterial({
      color: 0xff6b2c,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.romaRingMat = new THREE.MeshBasicMaterial({
      color: 0xff3b14,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const flamePts = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.42, 0.35),
      new THREE.Vector2(0.34, 1.05),
      new THREE.Vector2(0.14, 1.95),
      new THREE.Vector2(0.0, 2.75),
    ];
    const flameGeo = new THREE.LatheGeometry(flamePts, 10);
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      const rad = 3.9 + (i % 2) * 1.15;
      const flame = new THREE.Mesh(flameGeo, this.romaFireMat);
      flame.position.set(Math.cos(ang) * rad, -2.55, Math.sin(ang) * rad - 1.5);
      flame.scale.set(0.9 + (i % 3) * 0.25, 0.85 + (i % 4) * 0.25, 0.9);
      this.romaFlames.push(flame);
      this.romaFireGroup.add(flame);
    }

    const ringGeo = new THREE.RingGeometry(2.8, 6.1, 48);
    const emberRing = new THREE.Mesh(ringGeo, this.romaRingMat);
    emberRing.rotation.x = -Math.PI / 2;
    emberRing.position.set(0, -2.45, -1.5);
    this.romaFireGroup.add(emberRing);

    this.romaFireGroup.visible = false;
    this.scene.add(this.romaFireGroup);
    this.disposables.push(flameGeo, ringGeo, this.romaFireMat, this.romaRingMat);
  }

  private buildConstellationInstancedField(): void {
    // Refined minimal field (36 motes instead of 170) so typography & 3D worlds stay crisp
    const count = 36;
    const starGeo = new THREE.OctahedronGeometry(0.032, 0);
    const starMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x423018,
      emissiveIntensity: 0.65,
      metalness: 0.6,
      roughness: 0.26,
    });
    this.starField = new THREE.InstancedMesh(starGeo, starMat, count);
    this.starField.frustumCulled = false;

    const palette = [
      new THREE.Color(0xf4efe6),
      new THREE.Color(0xe8a838),
      new THREE.Color(0x7ac4ff),
      new THREE.Color(0xe8623d),
    ];

    for (let i = 0; i < count; i++) {
      const goldenRatio = (i / count) * Math.PI * 2 * 5;
      const radius = 3.4 + (i % 9) * 0.62;
      const yOffset = ((i % 13) - 6) * 0.46;
      const scale = 0.55 + (i % 5) * 0.12;
      const speed = 0.1 + (i % 4) * 0.04;

      this.starBaseSeeds.push({ angle: goldenRatio, radius, yOffset, scale, speed });
      this.starField.setColorAt(i, palette[i % palette.length]);
    }
    if (this.starField.instanceColor) {
      this.starField.instanceColor.needsUpdate = true;
    }

    this.scene.add(this.starField);
    this.disposables.push(starGeo, starMat);
  }

  private handleResize = (): void => {
    if (this.disposed) return;
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2)
    );
  };

  private handleContextLost = (e: Event): void => {
    e.preventDefault();
    this.contextLost = true;
  };

  private handleContextRestored = (): void => {
    this.contextLost = false;
  };

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private tick = (): void => {
    if (this.disposed) return;

    const nowMs = performance.now();
    const delta = Math.min(0.1, Math.max(0.001, (nowMs - this.lastPerfMs) / 1000));
    this.lastPerfMs = nowMs;
    const elapsed = (nowMs - this.startPerfMs) / 1000;
    const ext = this.inputRef();

    const target = computeSceneStateForCue(ext.progress, ext.motif);
    const dampSpeed = 5.4;

    // Smooth camera choreography + pointer parallax + Dutch-tilt roll
    _vecCam.set(
      target.camPos[0] + ext.pointerX * 0.45,
      target.camPos[1] + ext.pointerY * 0.32,
      target.camPos[2]
    );
    _vecLook.set(target.lookAt[0], target.lookAt[1], target.lookAt[2]);

    this.smoothCamPos.x = THREE.MathUtils.damp(this.smoothCamPos.x, _vecCam.x, dampSpeed, delta);
    this.smoothCamPos.y = THREE.MathUtils.damp(this.smoothCamPos.y, _vecCam.y, dampSpeed, delta);
    this.smoothCamPos.z = THREE.MathUtils.damp(this.smoothCamPos.z, _vecCam.z, dampSpeed, delta);

    this.smoothLookAt.x = THREE.MathUtils.damp(this.smoothLookAt.x, _vecLook.x, dampSpeed, delta);
    this.smoothLookAt.y = THREE.MathUtils.damp(this.smoothLookAt.y, _vecLook.y, dampSpeed, delta);
    this.smoothLookAt.z = THREE.MathUtils.damp(this.smoothLookAt.z, _vecLook.z, dampSpeed, delta);
    this.smoothCamRoll = THREE.MathUtils.damp(this.smoothCamRoll, target.camRoll, 4.0, delta);

    this.camera.position.copy(this.smoothCamPos);
    this.camera.lookAt(this.smoothLookAt);
    this.camera.rotation.z += this.smoothCamRoll;

    // Smoothly damp multi-world visibility and motion parameters
    this.smoothConvergence = THREE.MathUtils.damp(
      this.smoothConvergence,
      target.alignmentConvergence,
      4.5,
      delta
    );
    this.smoothSyzygy = THREE.MathUtils.damp(
      this.smoothSyzygy,
      target.syzygyLock,
      4.8,
      delta
    );
    this.smoothRingSpread = THREE.MathUtils.damp(
      this.smoothRingSpread,
      target.ringSpread,
      4.5,
      delta
    );
    this.smoothTilt.x = THREE.MathUtils.damp(this.smoothTilt.x, target.astrolabeTilt[0], 4.0, delta);
    this.smoothTilt.y = THREE.MathUtils.damp(this.smoothTilt.y, target.astrolabeTilt[1], 4.0, delta);
    this.smoothTilt.z = THREE.MathUtils.damp(this.smoothTilt.z, target.astrolabeTilt[2], 4.0, delta);
    this.smoothCoreIntensity = THREE.MathUtils.damp(
      this.smoothCoreIntensity,
      target.coreIntensity,
      4.5,
      delta
    );
    this.smoothParticleSpread = THREE.MathUtils.damp(
      this.smoothParticleSpread,
      target.particleSpread,
      4.0,
      delta
    );
    this.smoothWaveVis = THREE.MathUtils.damp(this.smoothWaveVis, target.waveVisibility, 4.4, delta);
    this.smoothTunnelVis = THREE.MathUtils.damp(
      this.smoothTunnelVis,
      target.tunnelVisibility,
      4.4,
      delta
    );
    this.smoothTempleVis = THREE.MathUtils.damp(
      this.smoothTempleVis,
      target.templeVisibility,
      4.4,
      delta
    );
    this.smoothHelixVis = THREE.MathUtils.damp(this.smoothHelixVis, target.helixVisibility, 4.4, delta);
    this.smoothClockVis = THREE.MathUtils.damp(this.smoothClockVis, target.clockVisibility, 4.8, delta);
    this.smoothArchVis = THREE.MathUtils.damp(this.smoothArchVis, target.archVisibility, 4.6, delta);
    this.smoothWingsVis = THREE.MathUtils.damp(this.smoothWingsVis, target.wingsVisibility, 7.8, delta);
    this.smoothDiscoVis = THREE.MathUtils.damp(this.smoothDiscoVis, target.discoVisibility, 7.8, delta);
    this.smoothPraiaVis = THREE.MathUtils.damp(this.smoothPraiaVis, target.praiaVisibility, 7.8, delta);
    this.smoothMadrugadaVis = THREE.MathUtils.damp(
      this.smoothMadrugadaVis,
      target.madrugadaVisibility,
      7.8,
      delta
    );
    this.smoothAmorVis = THREE.MathUtils.damp(this.smoothAmorVis, target.amorVisibility, 7.8, delta);
    this.smoothSalaVis = THREE.MathUtils.damp(this.smoothSalaVis, target.salaVisibility, 7.8, delta);
    this.smoothRomaFireVis = THREE.MathUtils.damp(
      this.smoothRomaFireVis,
      target.romaFireVisibility,
      7.8,
      delta
    );
    this.smoothEmber = THREE.MathUtils.damp(this.smoothEmber, target.emberIntensity, 4.2, delta);
    this.smoothEnergy = THREE.MathUtils.damp(
      this.smoothEnergy,
      ext.isPlaying ? ext.audioEnergy : 0.14,
      8.0,
      delta
    );
    this.smoothBass = THREE.MathUtils.damp(
      this.smoothBass,
      ext.isPlaying ? ext.bassEnergy : 0.1,
      9.0,
      delta
    );
    this.smoothWordPulse = THREE.MathUtils.damp(this.smoothWordPulse, ext.wordPulse, 12.0, delta);
    this.smoothBlackout = THREE.MathUtils.damp(this.smoothBlackout, ext.isFinale ? 1 : 0, 5.2, delta);
    const visFactor = Math.max(0, 1 - this.smoothBlackout);

    // Update sky shader & scene lighting colors smoothly
    _colBg.set(target.bgHex);
    _colBg2.set(target.bgSecondaryHex);
    _colAurora.set(target.auroraHex);
    _colAccent.set(target.accentHex);
    _colKey.set(target.keyLightHex);
    _colRim.set(target.rimLightHex);

    const colFactor = 1 - Math.exp(-6.8 * delta);
    if (this.scene.background instanceof THREE.Color) {
      this.scene.background.lerp(_colBg, colFactor);
      this.scene.background.lerp(_colBlack, this.smoothBlackout);
      this.fog.color.copy(this.scene.background);
    }
    this.skyMat.uniforms.uTime.value = elapsed;
    this.skyMat.uniforms.uBgPrimary.value.lerp(_colBg, colFactor);
    this.skyMat.uniforms.uBgSecondary.value.lerp(_colBg2, colFactor);
    this.skyMat.uniforms.uAurora.value.lerp(_colAurora, colFactor);
    this.skyMat.uniforms.uEnergy.value = this.smoothEnergy + this.smoothWordPulse * 0.45;
    this.skyMat.uniforms.uProgress.value = ext.progress;
    this.skyMat.uniforms.uBlackout.value = this.smoothBlackout;

    this.keyLight.color.lerp(_colKey, colFactor);
    this.rimLight.color.lerp(_colRim, colFactor);
    this.coreLight.color.lerp(_colAccent, colFactor);

    this.renderer.toneMappingExposure = 1.12 * visFactor;
    this.hemiLight.intensity = 0.78 * visFactor;
    this.keyLight.intensity = 2.35 * visFactor;
    this.rimLight.intensity = 3.6 * visFactor;

    // World 1: Astrolabe & Solar Core
    this.astrolabeGroup.visible = visFactor > 0.02;
    this.astrolabeGroup.scale.setScalar(Math.max(0.001, visFactor));
    if (this.coreMat.userData.shader) {
      this.coreMat.userData.shader.uniforms.uTime.value = elapsed;
    }
    const pulse = 1 + this.smoothEnergy * 0.16 + this.smoothConvergence * 0.14 + this.smoothWordPulse * 0.08;
    this.coreMesh.scale.setScalar(pulse);
    this.coreMesh.rotation.y = elapsed * 0.35;
    this.coreMesh.rotation.x = elapsed * 0.18;
    this.coreMat.emissiveIntensity =
      this.smoothCoreIntensity * (0.62 + this.smoothEnergy * 0.55 + this.smoothWordPulse * 0.3) * visFactor;
    this.coreLight.intensity = (2.4 + this.smoothCoreIntensity * 1.1 + this.smoothEnergy * 1.5) * visFactor;

    this.astrolabeGroup.rotation.x =
      this.smoothTilt.x * (1 - this.smoothSyzygy * 0.9) + ext.pointerY * 0.1;
    const rawAstrolabeRotY = this.smoothTilt.y + elapsed * 0.12 + ext.progress * Math.PI * 1.8;
    const wrappedAstrolabeRotY = Math.atan2(
      Math.sin(rawAstrolabeRotY),
      Math.cos(rawAstrolabeRotY)
    );
    this.astrolabeGroup.rotation.y =
      wrappedAstrolabeRotY * (1 - this.smoothSyzygy) +
      ext.pointerX * THREE.MathUtils.lerp(0.18, 0.06, this.smoothSyzygy);
    this.astrolabeGroup.rotation.z = this.smoothTilt.z * (1 - this.smoothSyzygy * 0.9);

    const ringDeconverge = 1 - this.smoothConvergence;
    const freeOuterX = Math.atan2(
      Math.sin(elapsed * 0.14 + ringDeconverge * 0.55),
      Math.cos(elapsed * 0.14 + ringDeconverge * 0.55)
    );
    const freeOuterY = Math.atan2(Math.sin(elapsed * 0.08), Math.cos(elapsed * 0.08));
    this.ringOuter.rotation.x = freeOuterX * (1 - this.smoothSyzygy);
    this.ringOuter.rotation.y = freeOuterY * (1 - this.smoothSyzygy);
    this.ringOuter.scale.setScalar(0.92 + this.smoothRingSpread * 0.1);

    const freeMidX = Math.atan2(
      Math.sin(-elapsed * 0.22 + ringDeconverge * 0.9),
      Math.cos(-elapsed * 0.22 + ringDeconverge * 0.9)
    );
    const freeMidY = Math.atan2(
      Math.sin((Math.PI / 3) * ringDeconverge + elapsed * 0.18),
      Math.cos((Math.PI / 3) * ringDeconverge + elapsed * 0.18)
    );
    this.ringMiddle.rotation.x = THREE.MathUtils.lerp(freeMidX, Math.PI / 2, this.smoothSyzygy);
    this.ringMiddle.rotation.y = freeMidY * (1 - this.smoothSyzygy);

    const freeInnerZ = Math.atan2(Math.sin(elapsed * 0.32), Math.cos(elapsed * 0.32));
    this.ringInner.rotation.z = freeInnerZ * (1 - this.smoothSyzygy);
    this.ringInner.rotation.x = THREE.MathUtils.lerp(
      (Math.PI / 4) * ringDeconverge,
      Math.PI / 2,
      this.smoothSyzygy
    );

    this.coreHalo.rotation.z = -elapsed * 0.55;
    this.dialPlane.rotation.z = elapsed * 0.06;
    this.dialMat.opacity = 0.24 + this.smoothConvergence * 0.48;

    // Planetary orbits smoothly lock into literal collinear Syzygy when syzygyLock -> 1!
    const orbitRadius = THREE.MathUtils.lerp(2.05, 1.38, this.smoothConvergence);
    const planeTilt = THREE.MathUtils.lerp(0.95, 0.0, this.smoothConvergence);
    const phaseA = elapsed * 0.72 + ext.progress * Math.PI * 2;
    const phaseB = phaseA + Math.PI * (1 - this.smoothConvergence * 0.86);
    const phaseC = phaseA * 0.65 + 2.1;

    _vecSatA.set(
      Math.cos(phaseA) * orbitRadius,
      Math.sin(phaseA) * Math.sin(planeTilt) * orbitRadius,
      Math.sin(phaseA) * Math.cos(planeTilt) * orbitRadius
    );
    _vecSatB.set(
      Math.cos(phaseB) * orbitRadius,
      -Math.sin(phaseB) * Math.sin(planeTilt) * orbitRadius,
      Math.sin(phaseB) * Math.cos(planeTilt) * orbitRadius
    );
    _vecSatC.set(
      Math.cos(phaseC) * (orbitRadius * 1.28),
      Math.sin(phaseC) * Math.sin(planeTilt * 0.7) * (orbitRadius * 1.28),
      Math.sin(phaseC) * Math.cos(planeTilt * 0.7) * (orbitRadius * 1.28)
    );

    _vecSatA.lerp(_vecSyzygyA, this.smoothSyzygy);
    _vecSatB.lerp(_vecSyzygyB, this.smoothSyzygy);
    _vecSatC.lerp(_vecSyzygyC, this.smoothSyzygy);

    this.satelliteA.position.copy(_vecSatA);
    this.satelliteB.position.copy(_vecSatB);
    this.satelliteC.position.copy(_vecSatC);
    this.satelliteA.rotation.y = elapsed * 1.1;
    this.satelliteB.rotation.y = -elapsed * 1.1;
    this.satelliteC.rotation.y = elapsed * 0.75;

    this.syzygyBeamMesh.visible = this.smoothSyzygy > 0.25;
    if (this.syzygyBeamMesh.visible) {
      const beamAlpha = Math.max(0, (this.smoothSyzygy - 0.25) / 0.75);
      this.syzygyBeamMat.opacity = beamAlpha * (0.68 + this.smoothWordPulse * 0.24);
      this.syzygyBeamMesh.scale.set(1, 1 + this.smoothWordPulse * 0.35, 1 + this.smoothWordPulse * 0.35);
    }

    this.orbitArcA.rotation.x = Math.PI / 2 - planeTilt;
    this.orbitArcB.rotation.x = Math.PI / 2 + planeTilt;
    const arcScale = orbitRadius / 1.9;
    this.orbitArcA.scale.setScalar(arcScale);
    this.orbitArcB.scale.setScalar(arcScale);

    // World 2: Liquid Silk Wave Ribbon (Estrofe I & Pré-Refrão)
    this.waveMesh.visible = this.smoothWaveVis > 0.02;
    if (this.waveMesh.visible) {
      this.waveMat.opacity = this.smoothWaveVis * 0.64;
      this.waveMat.color.copy(_colAurora).multiplyScalar(0.75);
      this.waveMat.emissive.copy(_colAurora).multiplyScalar(0.45);
      this.waveMesh.position.y = THREE.MathUtils.lerp(-5.5, -2.3, this.smoothWaveVis);
      if (this.waveMat.userData.shader) {
        this.waveMat.userData.shader.uniforms.uTime.value = elapsed;
        this.waveMat.userData.shader.uniforms.uAmp.value =
          0.72 + this.smoothEnergy * 0.55;
      }
    }

    // World 3: Electric Tunnel Portal Rings (Pré-Refrão I & II)
    this.tunnelInstanced.visible = this.smoothTunnelVis > 0.02;
    if (this.tunnelInstanced.visible) {
      this.tunnelMat.opacity = this.smoothTunnelVis * 0.74;
      this.tunnelMat.color.copy(_colAurora);
      this.tunnelMat.emissive.copy(_colRim);
      for (let i = 0; i < 10; i++) {
        const zProgress = ((elapsed * 0.8 + i / 10) % 1);
        const zPos = THREE.MathUtils.lerp(-18, 4, zProgress);
        const s = 0.72 + zProgress * 0.95 + this.smoothEnergy * 0.12;
        _dummy.position.set(0, 0, zPos);
        _dummy.rotation.set(0, 0, elapsed * 0.4 + i * 0.25);
        _dummy.scale.setScalar(s);
        _dummy.updateMatrix();
        this.tunnelInstanced.setMatrixAt(i, _dummy.matrix);
      }
      this.tunnelInstanced.instanceMatrix.needsUpdate = true;
    }

    // World 4: Classical Athens & Burning Rome Colonnade + Pediment (Estrofe II)
    this.templeInstanced.visible = this.smoothTempleVis > 0.02;
    this.pedimentGroup.visible = this.smoothTempleVis > 0.02;
    if (this.templeInstanced.visible) {
      this.templeMat.opacity = this.smoothTempleVis * 0.88;
      this.templeMat.emissiveIntensity = 0.2 + this.smoothEmber * 0.45;
      this.pedimentMat.opacity = this.smoothTempleVis * 0.85;
      this.pedimentMat.emissiveIntensity = 0.18 + this.smoothRomaFireVis * 0.45;
      this.pedimentGroup.position.y = THREE.MathUtils.lerp(4.8, 2.72, this.smoothTempleVis);
      const baseY = THREE.MathUtils.lerp(-7.5, -2.6, this.smoothTempleVis);
      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * Math.PI * 2 + elapsed * 0.07;
        const rad = 5.4;
        _dummy.position.set(Math.cos(ang) * rad, baseY, Math.sin(ang) * rad - 1.5);
        _dummy.rotation.set(0, -ang, 0);
        _dummy.scale.set(1, 0.9 + (i % 3) * 0.15, 1);
        _dummy.updateMatrix();
        this.templeInstanced.setMatrixAt(i, _dummy.matrix);
      }
      this.templeInstanced.instanceMatrix.needsUpdate = true;
    }

    // World 5: Eternal Double Helix (Ponte & Final)
    this.helixGroup.visible = this.smoothHelixVis > 0.02;
    if (this.helixGroup.visible) {
      this.helixMatA.opacity = this.smoothHelixVis * 0.88;
      this.helixMatB.opacity = this.smoothHelixVis * 0.88;
      this.helixGroup.rotation.y = elapsed * 0.28 + ext.progress * 3.0;
      this.helixGroup.rotation.x = Math.sin(elapsed * 0.3) * 0.25;
      this.helixGroup.scale.setScalar(0.85 + this.smoothHelixVis * 0.28);
    }

    // World 6: Horological Meridian Hands ("Hora exata" / "Tempo" / "Alinhamento")
    this.clockHandsGroup.visible = this.smoothClockVis > 0.02;
    if (this.clockHandsGroup.visible) {
      this.clockHandMat.opacity = this.smoothClockVis * 0.9;
      this.clockHandMat.color.copy(_colAccent);
      this.clockHandMat.emissive.copy(_colAurora);
      const isExact = ext.motif === 'hora-exata' || ext.motif === 'alinhamento';
      const targetMinuteZ = isExact ? 0 : -elapsed * 0.9;
      const targetHourZ = isExact ? 0 : -elapsed * 0.22;
      this.clockMinuteHand.rotation.z = THREE.MathUtils.damp(
        this.clockMinuteHand.rotation.z,
        targetMinuteZ,
        5.5,
        delta
      );
      this.clockHourHand.rotation.z = THREE.MathUtils.damp(
        this.clockHourHand.rotation.z,
        targetHourZ,
        4.5,
        delta
      );
      this.clockHandsGroup.scale.setScalar(
        0.92 + this.smoothClockVis * 0.12 + this.smoothBass * 0.08
      );
    }

    // World 7: Architectural Portal Arches ("No meio da sala" / "Atenas" / "Capelas")
    this.archGroup.visible = this.smoothArchVis > 0.02;
    if (this.archGroup.visible) {
      this.archMat.opacity = this.smoothArchVis * 0.72;
      this.archMat.color.copy(_colAccent);
      this.archMat.emissive.copy(_colAurora).multiplyScalar(0.35);
      this.archGroup.position.y = THREE.MathUtils.lerp(-2.5, 0, this.smoothArchVis);
      this.archGroup.rotation.y = Math.sin(elapsed * 0.28) * 0.08 + ext.pointerX * 0.08;
    }

    // World 8: Living Room Vignette ("No meio da sala")
    this.salaGroup.visible = this.smoothSalaVis > 0.02;
    if (this.salaGroup.visible) {
      this.salaWoodMat.opacity = this.smoothSalaVis * 0.85;
      this.salaBrassMat.opacity = this.smoothSalaVis * 0.92;
      this.salaLampGlowMat.opacity = this.smoothSalaVis * (0.72 + this.smoothWordPulse * 0.2);
      this.salaGroup.position.y = THREE.MathUtils.lerp(-1.4, 0, this.smoothSalaVis);
      this.salaGroup.rotation.y = ext.pointerX * 0.06;
    }

    // World 9: Celestial Seraphim Wings ("Eu te mostro os anjos")
    this.wingsGroup.visible = this.smoothWingsVis > 0.02;
    if (this.wingsGroup.visible) {
      this.wingMat.opacity = this.smoothWingsVis * 0.92;
      const wingBreath = Math.sin(elapsed * 1.9) * 0.09 + this.smoothEnergy * 0.12;
      this.rightWing.rotation.y = -0.18 - wingBreath;
      this.leftWing.rotation.y = 0.18 + wingBreath;
      this.wingsGroup.scale.setScalar(0.75 + this.smoothWingsVis * 0.35);
    }

    // World 10: Disco Mirrorball & Spotlight Cones ("Cada festa")
    this.discoGroup.visible = this.smoothDiscoVis > 0.02;
    if (this.discoGroup.visible) {
      this.discoBallMat.opacity = this.smoothDiscoVis * 0.95;
      this.discoConeMat.opacity = this.smoothDiscoVis * (0.28 + this.smoothBass * 0.18);
      this.discoBall.rotation.y = elapsed * 1.6;
      this.discoBall.rotation.x = Math.sin(elapsed * 0.8) * 0.22;
      this.discoConesGroup.rotation.z = elapsed * 1.15;
      this.discoConesGroup.rotation.y = elapsed * 0.7;
    }

    // World 11: Coastal Horizon & Palms ("cada praia")
    this.praiaGroup.visible = this.smoothPraiaVis > 0.02;
    if (this.praiaGroup.visible) {
      this.praiaSunMat.opacity = this.smoothPraiaVis * 0.78;
      this.praiaPalmMat.opacity = this.smoothPraiaVis * 0.92;
      this.praiaGroup.position.y = THREE.MathUtils.lerp(-1.8, 0, this.smoothPraiaVis);
      this.praiaGroup.rotation.z = Math.sin(elapsed * 1.1) * 0.02;
    }

    // World 12: Crescent Moon & Nocturnal Trails ("os rolês na madrugada")
    this.madrugadaGroup.visible = this.smoothMadrugadaVis > 0.02;
    if (this.madrugadaGroup.visible) {
      this.madrugadaMoonMat.opacity = this.smoothMadrugadaVis * 0.94;
      this.madrugadaTrailMatA.opacity = this.smoothMadrugadaVis * (0.55 + this.smoothWordPulse * 0.25);
      this.madrugadaTrailMatB.opacity = this.smoothMadrugadaVis * (0.48 + this.smoothEnergy * 0.25);
      this.madrugadaMoon.rotation.y = Math.sin(elapsed * 0.65) * 0.28;
      this.madrugadaMoon.rotation.z = -0.22 + Math.cos(elapsed * 0.5) * 0.06;
    }

    // World 13: Interlocking Heart Ribbons & Ruby Prism ("te amo" / "Amor da minha vida")
    this.amorGroup.visible = this.smoothAmorVis > 0.02;
    if (this.amorGroup.visible) {
      this.amorMatA.opacity = this.smoothAmorVis * 0.92;
      this.amorMatB.opacity = this.smoothAmorVis * 0.88;
      const heartScale = 0.85 + this.smoothAmorVis * 0.24 + this.smoothWordPulse * 0.06;
      this.amorGroup.scale.setScalar(heartScale);
      this.amorGroup.rotation.y = Math.sin(elapsed * 0.7) * 0.28;
      this.amorPrism.rotation.y = elapsed * 1.4;
      this.amorPrism.rotation.x = elapsed * 0.9;
    }

    // World 14: Rising Sculpted Flames ("queimando Roma")
    this.romaFireGroup.visible = this.smoothRomaFireVis > 0.02;
    if (this.romaFireGroup.visible) {
      this.romaFireMat.opacity = this.smoothRomaFireVis * (0.62 + this.smoothEnergy * 0.24);
      this.romaRingMat.opacity = this.smoothRomaFireVis * 0.52;
      for (let i = 0; i < this.romaFlames.length; i++) {
        const flame = this.romaFlames[i];
        const flicker = 0.85 + Math.sin(elapsed * 7.2 + i * 1.7) * 0.25 + this.smoothBass * 0.3;
        flame.scale.y = flicker;
        flame.rotation.y = elapsed * 1.4 + i;
      }
    }

    // Hide secondary worlds during finale blackout so everything disappears cleanly
    if (visFactor <= 0.02) {
      this.waveMesh.visible = false;
      this.tunnelInstanced.visible = false;
      this.templeInstanced.visible = false;
      this.pedimentGroup.visible = false;
      this.helixGroup.visible = false;
      this.clockHandsGroup.visible = false;
      this.archGroup.visible = false;
      this.salaGroup.visible = false;
      this.wingsGroup.visible = false;
      this.discoGroup.visible = false;
      this.praiaGroup.visible = false;
      this.madrugadaGroup.visible = false;
      this.amorGroup.visible = false;
      this.romaFireGroup.visible = false;
      this.starField.visible = false;
    } else {
      this.starField.visible = true;
    }

    // Constellation & Ember Sparks Field (36 crisp motes)
    const count = this.starBaseSeeds.length;
    for (let i = 0; i < count; i++) {
      const seed = this.starBaseSeeds[i];
      const ang = seed.angle + elapsed * seed.speed * 0.45 + ext.progress * 2.2;
      const r = seed.radius * this.smoothParticleSpread;
      // During Estrofe II (burning Rome), sparks rise vertically!
      const riseOffset =
        this.smoothEmber > 0.55
          ? ((elapsed * 1.4 + i * 0.62) % 8) - 4
          : seed.yOffset * (1 - this.smoothConvergence * 0.7);
      const yMorph =
        riseOffset + Math.sin(ang * 2 + elapsed * 0.8) * 0.22 * (this.smoothEnergy + this.smoothBass * 0.4);

      _dummy.position.set(Math.cos(ang) * r, yMorph, Math.sin(ang) * r - 0.8);
      _dummy.rotation.set(elapsed * 0.5 + i, elapsed * 0.4, 0);
      _dummy.scale.setScalar(
        seed.scale * (1 + this.smoothEnergy * 0.35 + this.smoothWordPulse * 0.2) * visFactor
      );
      _dummy.updateMatrix();
      this.starField.setMatrixAt(i, _dummy.matrix);
    }
    this.starField.instanceMatrix.needsUpdate = true;

    if (!this.contextLost) {
      this.renderer.render(this.scene, this.camera);
    }

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    this.renderer.domElement.removeEventListener('webglcontextlost', this.handleContextLost);
    this.renderer.domElement.removeEventListener('webglcontextrestored', this.handleContextRestored);
    window.removeEventListener('resize', this.handleResize);

    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];

    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
