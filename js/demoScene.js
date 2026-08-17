
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

// --- Shaders ---

const vertexShader = `
    uniform float uTime;
    uniform float uProgress; // 0 = Cloud, 1 = Sphere
    uniform vec2 uMouse;
    uniform float uPixelRatio;

    attribute vec3 aTargetPosition; // The Fibonacci Sphere position
    attribute float aRandom;        // Random value for offset
    attribute float aSize;          // Random size variation

    varying vec3 vColor;
    varying float vAlpha;

    // --- Noise Functions (Simplex / Curl) ---
    // Source: https://github.com/ashima/webgl-noise/blob/master/src/noise3D.glsl
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
        const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
        const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

        // First corner
        vec3 i  = floor(v + dot(v, C.yyy) );
        vec3 x0 = v - i + dot(i, C.xxx) ;

        // Other corners
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min( g.xyz, l.zxy );
        vec3 i2 = max( g.xyz, l.zxy );

        //   x0 = x0 - 0.0 + 0.0 * C.xxx;
        //   x1 = x0 - i1  + 1.0 * C.xxx;
        //   x2 = x0 - i2  + 2.0 * C.xxx;
        //   x3 = x0 - 1.0 + 3.0 * C.xxx;
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
        vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

        // Permutations
        i = mod289(i);
        vec4 p = permute( permute( permute(
                    i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

        // Gradients: 7x7x6 points over a cube, mapped onto a 4-cross polytope
        // 7*7*6 = 294, which is close to 343
        float n_ = 0.142857142857; // 1.0/7.0
        vec3  ns = n_ * D.wyz - D.xzx;

        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);

        vec4 b0 = vec4( x.xy, y.xy );
        vec4 b1 = vec4( x.zw, y.zw );

        //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
        //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));

        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);

        //Normalise gradients
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;

        // Mix final noise value
        vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 105.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                    dot(p2,x2), dot(p3,x3) ) );
    }

    // Curl Noise to create fluid-like motion
    vec3 curlNoise(vec3 p) {
        const float e = 0.1;
        vec3 dx = vec3(e, 0.0, 0.0);
        vec3 dy = vec3(0.0, e, 0.0);
        vec3 dz = vec3(0.0, 0.0, e);

        vec3 p_x0 = snoise(p - dx) * vec3(1.0);
        vec3 p_x1 = snoise(p + dx) * vec3(1.0);
        vec3 p_y0 = snoise(p - dy) * vec3(1.0);
        vec3 p_y1 = snoise(p + dy) * vec3(1.0);
        vec3 p_z0 = snoise(p - dz) * vec3(1.0);
        vec3 p_z1 = snoise(p + dz) * vec3(1.0);

        float x = p_y1.z - p_y0.z - p_z1.y + p_z0.y;
        float y = p_z1.x - p_z0.x - p_x1.z + p_x0.z;
        float z = p_x1.y - p_x0.y - p_y1.x + p_y0.x;

        const float divisor = 1.0 / (2.0 * e);
        return normalize(vec3(x, y, z) * divisor);
    }

    void main() {
        // 1. Cloud State Logic
        // Scale down time for slow, elegant movement
        float time = uTime * 0.15;
        
        // Generate a noise field for the cloud
        // We use position + time to animate it
        vec3 noisePos = position * 0.4 + vec3(0.0, time * 0.2, 0.0);
        vec3 curl = curlNoise(noisePos);
        
        // Apply curl noise to create the "cloud" volume
        // The cloud is wider than the sphere
        vec3 cloudPos = position + curl * 2.5;
        
        // Add some wandering/floating movement
        cloudPos.x += snoise(vec3(time, position.y, position.z)) * 0.3;
        cloudPos.y += snoise(vec3(position.x, time, position.z)) * 0.3;
        cloudPos.z += snoise(vec3(position.x, position.y, time)) * 0.3;

        // 2. Sphere State Logic (Fibonacci Sphere)
        // aTargetPosition is the precise sphere surface coordinate
        vec3 spherePos = aTargetPosition;
        
        // Add a tiny bit of noise to the sphere so it's not perfectly static (shimmering)
        float breathe = snoise(spherePos * 2.0 + time * 2.0) * 0.02;
        spherePos += normalize(spherePos) * breathe;

        // 3. Mix (Morph)
        // Use smoothstep for a nicer transition curve
        float mixFactor = smoothstep(0.0, 1.0, uProgress);
        
        // Non-linear transition for particles:
        // Some move faster than others based on aRandom
        float particleMix = smoothstep(0.0, 1.0, clamp((uProgress * 1.5) - aRandom * 0.5, 0.0, 1.0));
        
        // Add a spiral effect during transition
        // As they move to sphere, they spiral in
        vec3 morphPos = mix(cloudPos, spherePos, particleMix);
        
        // Spiral distortion based on progress (peak at 0.5)
        float spiralStrength = sin(particleMix * 3.14159) * 2.0; // Peak in middle
        float angle = spiralStrength * (1.0 - length(morphPos) * 0.2);
        float s = sin(angle);
        float c = cos(angle);
        // Rotate around Y axis
        // morphPos.x = morphPos.x * c - morphPos.z * s;
        // morphPos.z = morphPos.x * s + morphPos.z * c;
        // Commented out spiral for now, simpler mix is cleaner like Rhumb
        
        vec3 finalPos = morphPos;

        // 4. Mouse Interaction (Parallax/Repulsion)
        // Only active in cloud state mostly
        float distToMouse = distance(uMouse * 10.0, finalPos.xy);
        float repulsion = max(0.0, 1.0 - distToMouse / 2.0); 
        // finalPos += normalize(finalPos) * repulsion * 0.5 * (1.0 - mixFactor);

        vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
        gl_Position = projectionMatrix * mvPosition;

        // Size attenuation
        // Particles get smaller as they form the sphere to look sharp
        float baseSize = 35.0 * aSize * uPixelRatio; 
        float sizeMix = mix(baseSize, baseSize * 0.6, particleMix); 
        gl_PointSize = sizeMix / -mvPosition.z;

        // Color/Alpha logic
        // Cloud: Lower alpha, softer. Sphere: Higher alpha, sharper.
        vAlpha = mix(0.3, 0.9, particleMix);
        
        // 5. Solid Sphere Fade Effect
        // As the solid sphere appears (uProgress > 0.8), fade out the particles
        // so they don't fight with the solid geometry
        float solidFade = smoothstep(0.8, 1.0, uProgress);
        vAlpha *= (1.0 - solidFade); // Fade to 0% visibility

        // Color shift from Warm White/Gold to Deep Gold
        vec3 colorCloud = vec3(0.95, 0.91, 0.85); // F2E9DA
        vec3 colorSphere = vec3(0.78, 0.66, 0.37); // C6A95E
        vColor = mix(colorCloud, colorSphere, particleMix);
    }
`;

const fragmentShader = `
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
        // Circular soft particle
        vec2 center = gl_PointCoord - 0.5;
        float dist = length(center);
        
        // Discard corners to make it round
        if (dist > 0.5) discard;

        // Soft glow edge
        // 0.0 at center, 0.5 at edge.
        // We want 1.0 at center, fading out.
        float glow = 1.0 - (dist * 2.0);
        glow = pow(glow, 1.5); // Adjust falloff

        gl_FragColor = vec4(vColor, vAlpha * glow);
    }
`;

export class DemoScene {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.mainGroup = null;
        this.coreMesh = null;
        this.wireMesh = null;
        this.particles = null;
        this.material = null; // Shader material ref
        
        this.clock = new THREE.Clock();
        this.mouse = new THREE.Vector2();
        
        this.morphProgress = 0; // 0 = Cloud, 1 = Sphere
        
        this.init();
    }

    init() {
        this.scene = new THREE.Scene();
        // Darker background/fog for contrast
        this.scene.fog = new THREE.FogExp2(0x0F0F12, 0.02);

        this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.5, 40);
        this.camera.position.z = 8;

        this.renderer = new THREE.WebGLRenderer({ 
            alpha: true, 
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        // Tone mapping for glow
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.container.appendChild(this.renderer.domElement);

        this.createObjects();
        this.createLights();

        window.addEventListener('resize', this.onResize.bind(this));
        window.addEventListener('mousemove', this.onMouseMove.bind(this));

        this.animate();
    }

    createObjects() {
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);

        // Content Group for auto-rotation
        this.contentGroup = new THREE.Group();
        this.mainGroup.add(this.contentGroup);

        // 1. The Core Sphere (Initially Hidden)
        const geometry = new THREE.SphereGeometry(1.5, 64, 64);
        const material = new THREE.MeshStandardMaterial({
            color: 0x1C2430,
            roughness: 0.4, // Smoother
            metalness: 0.6, // More metallic
            flatShading: false, // Smooth shading for the core
            transparent: true,
            opacity: 0
        });
        this.coreMesh = new THREE.Mesh(geometry, material);
        this.coreMesh.scale.set(0.1, 0.1, 0.1);
        this.contentGroup.add(this.coreMesh);

        // 2. The Wireframe (Initially Hidden)
        // High-tech look wireframe
        const wireMat = new THREE.MeshBasicMaterial({
            color: 0xC6A95E,
            wireframe: true,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        this.wireMesh = new THREE.Mesh(geometry, wireMat);
        this.wireMesh.scale.set(1.005, 1.005, 1.005);
        this.coreMesh.add(this.wireMesh);

        // 3. Particles (High-End Shader Cloud)
        this.createParticles();
    }

    createParticles() {
        // Significantly increase particle count for "cloud" fluid look
        const nodeCount = 20000; 
        const cloudRadius = 5.0;
        const sphereRadius = 1.6;

        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(nodeCount * 3); // Current/Start positions (Cloud)
        const targetPositions = new Float32Array(nodeCount * 3); // Sphere positions
        const randoms = new Float32Array(nodeCount); // For variation
        const sizes = new Float32Array(nodeCount); // For size variation

        // A. Generate Cloud Positions (Random Volume) & Sphere Positions (Fibonacci)
        const goldenRatio = (1 + Math.sqrt(5)) / 2;

        for (let i = 0; i < nodeCount; i++) {
            const i3 = i * 3;

            // --- 1. Cloud Position (Start) ---
            // Gaussian-like distribution for "Probability Cloud" look
            // Box-Muller transform or approximate with sum of uniform
            const u1 = Math.max(Number.EPSILON, Math.random());
            const u2 = Math.random();
            const u3 = Math.max(Number.EPSILON, Math.random());
            const u4 = Math.random();
            
            const rGaussian = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
            const rGaussian2 = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);
            const rGaussian3 = Math.sqrt(-2.0 * Math.log(u3)) * Math.cos(2.0 * Math.PI * u4);
            
            // Normalize and scale
            // We want a dense core and sparse edges
            positions[i3] = rGaussian * cloudRadius * 0.4;
            positions[i3+1] = rGaussian2 * cloudRadius * 0.4;
            positions[i3+2] = rGaussian3 * cloudRadius * 0.4;

            // --- 2. Sphere Position (Target) ---
            const theta = 2 * Math.PI * i / goldenRatio;
            const phi = Math.acos(1 - 2 * (i + 0.5) / nodeCount);
            
            targetPositions[i3] = sphereRadius * Math.sin(phi) * Math.cos(theta);
            targetPositions[i3+1] = sphereRadius * Math.sin(phi) * Math.sin(theta);
            targetPositions[i3+2] = sphereRadius * Math.cos(phi);

            // --- 3. Attributes ---
            randoms[i] = Math.random();
            sizes[i] = 0.5 + Math.random() * 1.0; // Size variance
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('aTargetPosition', new THREE.BufferAttribute(targetPositions, 3));
        geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));
        geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

        // Shader Material
        this.material = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uProgress: { value: 0 },
                uMouse: { value: new THREE.Vector2(0, 0) },
                uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
            },
            transparent: true,
            depthWrite: false, // Important for glow overlap
            blending: THREE.AdditiveBlending // Glowy effect
        });

        this.particles = new THREE.Points(geometry, this.material);
        this.contentGroup.add(this.particles);
    }

    createLights() {
        // Dramatic lighting for the core
        const ambientLight = new THREE.AmbientLight(0x404040, 1);
        this.scene.add(ambientLight);

        const keyLight = new THREE.DirectionalLight(0xF2E9DA, 3);
        keyLight.position.set(5, 2, 5);
        this.scene.add(keyLight);

        const rimLight = new THREE.SpotLight(0xC6A95E, 8);
        rimLight.position.set(-5, 5, -5);
        rimLight.lookAt(0, 0, 0);
        this.scene.add(rimLight);
    }

    setMorphProgress(progress) {
        this.morphProgress = Math.max(0, Math.min(1, progress));
        
        // Update Uniform
        if (this.material) {
            this.material.uniforms.uProgress.value = this.morphProgress;
        }

        // Update Core Visibility
        // Start showing core at 60%, full at 100%
        if (this.coreMesh && this.wireMesh) {
            const coreProgress = Math.max(0, (this.morphProgress - 0.6) / 0.4);
            
            // Smooth easing for core appearance
            const easeCore = coreProgress * coreProgress * (3 - 2 * coreProgress); // Cubic ease in-out
            
            this.coreMesh.material.opacity = easeCore;
            this.wireMesh.material.opacity = easeCore * 0.15; // Subtle wireframe
            
            // Core grows slightly as it appears to "fill" the space
            // 0.8x -> 1.0x creates a feeling of solidification/expansion
            const scale = 0.8 + 0.2 * easeCore; 
            this.coreMesh.scale.set(scale, scale, scale);
            this.wireMesh.scale.set(scale * 1.005, scale * 1.005, scale * 1.005);
        }
    }

    onResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.width, this.height);
        
        if (this.material) {
            this.material.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
        }
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / this.width) * 2 - 1;
        this.mouse.y = -(event.clientY / this.height) * 2 + 1;
        
        if (this.material) {
            this.material.uniforms.uMouse.value.copy(this.mouse);
        }
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        const time = this.clock.getElapsedTime();

        if (this.material) {
            this.material.uniforms.uTime.value = time;
        }
        
        // Rotate the whole system slowly for cinematic feel
        // Rotate faster when in cloud mode, slower/locked when in sphere mode
        const rotSpeed = 0.05 * (1.0 - this.morphProgress * 0.5);
        if (this.contentGroup) {
            this.contentGroup.rotation.y = time * rotSpeed;
        }

        // Subtle Mouse Parallax
        const parallaxX = (this.mouse.y * 0.05 - this.mainGroup.rotation.x) * 0.05;
        // this.mainGroup.rotation.x += parallaxX; // Optional tilt

        this.renderer.render(this.scene, this.camera);
    }
}
