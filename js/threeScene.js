
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

/**
 * Three.js 场景管理器 / Three.js Scene Manager
 * 负责 3D 场景的初始化、渲染循环和对象状态管理。
 * Responsible for 3D scene initialization, render loop, and object state management.
 */
export class ThreeScene {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.mainGroup = null; // 主对象组 / Main object group
        this.coreMesh = null;
        this.wireMesh = null;
        this.particles = null;
        
        this.clock = new THREE.Clock();
        this.mouse = new THREE.Vector2();
        this.targetRotation = new THREE.Vector2();
        
        this.init();
    }

    init() {
        // 1. Scene Setup
        this.scene = new THREE.Scene();
        // Fog for depth
        this.scene.fog = new THREE.FogExp2(0x0F0F12, 0.02);

        // 2. Camera
        this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.5, 40);
        this.camera.position.z = 8;
        this.camera.position.y = 0;

        // 3. Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            alpha: true, 
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.container.appendChild(this.renderer.domElement);

        // 4. Objects
        this.createObjects();

        // 5. Lights
        this.createLights();

        // 6. Events
        window.addEventListener('resize', this.onResize.bind(this));
        window.addEventListener('mousemove', this.onMouseMove.bind(this));

        // 7. Start Loop
        this.animate();
    }

    createObjects() {
        this.mainGroup = new THREE.Group();
        this.mainGroup.userData.baseScale = 1;
        this.scene.add(this.mainGroup);

        // A. The Core (System 2 - Structured)
        // Solid dark core with roughness
        const geometry = new THREE.SphereGeometry(1.5, 32, 24);
        const material = new THREE.MeshStandardMaterial({
            color: 0x1C2430,
            roughness: 0.7,
            metalness: 0.1,
            flatShading: true
        });
        this.coreMesh = new THREE.Mesh(geometry, material);
        this.mainGroup.add(this.coreMesh);

        // B. The Wireframe (The Grid/Logic)
        // 改为使用 MeshBasicMaterial + wireframe: true，这比 LineSegments 在渲染管线中更稳定
        // 并通过 blending 和 depthWrite 解决闪烁
        const wireMat = new THREE.MeshBasicMaterial({
            color: 0xC6A95E,
            wireframe: true, // 关键：使用 Mesh 的 wireframe 模式
            transparent: true,
            opacity: 0.15, // 稍微降低一点，因为 wireframe 线条可能会更粗/明显
            blending: THREE.AdditiveBlending, // 叠加混合，不仅发光，还能避免很多排序导致的闪烁
            depthWrite: false, // 不写入深度，允许透过
            depthTest: false
        });
        
        // 不需要 WireframeGeometry 了，直接用同样的几何体
        this.wireMesh = new THREE.Mesh(geometry, wireMat);
        
        // 保持微小的缩放，避免重叠
        this.wireMesh.scale.set(1.002, 1.002, 1.002);
        this.wireMesh.renderOrder = 2;
        this.coreMesh.add(this.wireMesh);

        const neuronsGroup = new THREE.Group();
        const neuronCanvas = document.createElement('canvas');
        neuronCanvas.width = 64;
        neuronCanvas.height = 64;
        const neuronCtx = neuronCanvas.getContext('2d');
        const neuronGradient = neuronCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
        neuronGradient.addColorStop(0, 'rgba(198, 169, 94, 1)');
        neuronGradient.addColorStop(0.4, 'rgba(198, 169, 94, 0.65)');
        neuronGradient.addColorStop(1, 'rgba(242, 233, 218, 0)');
        neuronCtx.fillStyle = neuronGradient;
        neuronCtx.fillRect(0, 0, 64, 64);
        const neuronTexture = new THREE.CanvasTexture(neuronCanvas);
        neuronTexture.minFilter = THREE.LinearFilter;
        neuronTexture.magFilter = THREE.LinearFilter;

        const nodeCount = this.width < 768 ? 180 : 240;
        const nodeSpread = this.width < 768 ? 8.5 : 10;
        const maxDistance = this.width < 768 ? 1.8 : 2.2;
        const maxConnections = 3;

        const nodePositions = new Float32Array(nodeCount * 3);
        const nodeVelocities = new Float32Array(nodeCount * 3);
        for (let i = 0; i < nodeCount; i++) {
            const offset = i * 3;
            nodePositions[offset] = (Math.random() - 0.5) * nodeSpread;
            nodePositions[offset + 1] = (Math.random() - 0.5) * nodeSpread;
            nodePositions[offset + 2] = (Math.random() - 0.5) * nodeSpread;
            nodeVelocities[offset] = (Math.random() - 0.5) * 0.01;
            nodeVelocities[offset + 1] = (Math.random() - 0.5) * 0.01;
            nodeVelocities[offset + 2] = (Math.random() - 0.5) * 0.01;
        }

        const pointGeo = new THREE.BufferGeometry();
        const pointPositionAttr = new THREE.BufferAttribute(nodePositions, 3);
        pointPositionAttr.setUsage(THREE.DynamicDrawUsage);
        pointGeo.setAttribute('position', pointPositionAttr);
        const pointMat = new THREE.PointsMaterial({
            size: this.width < 768 ? 0.06 : 0.07,
            map: neuronTexture,
            color: 0xA8894C,
            transparent: true,
            opacity: 0.32,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true
        });
        const netPoints = new THREE.Points(pointGeo, pointMat);
        neuronsGroup.add(netPoints);

        const maxSegments = nodeCount * maxConnections;
        const linePositions = new Float32Array(maxSegments * 6);
        const lineGeo = new THREE.BufferGeometry();
        const linePositionAttr = new THREE.BufferAttribute(linePositions, 3);
        linePositionAttr.setUsage(THREE.DynamicDrawUsage);
        lineGeo.setAttribute('position', linePositionAttr);
        lineGeo.setDrawRange(0, 0);
        const lineMat = new THREE.LineBasicMaterial({
            color: 0x8F7440,
            transparent: true,
            opacity: 0.15
        });
        const neuronLines = new THREE.LineSegments(lineGeo, lineMat);
        neuronsGroup.add(neuronLines);

        this.particles = neuronsGroup;
        this.particles.userData.network = {
            positions: nodePositions,
            velocities: nodeVelocities,
            linePositions,
            nodeCount,
            nodeSpread,
            maxDistance,
            maxConnections,
            pointGeometry: pointGeo,
            lineGeometry: lineGeo
        };
        this.particles.userData.materials = [pointMat, lineMat];
        this.particles.userData.lockScale = false;
        this.particles.userData.baseScale = 1;
        this.particles.userData.breatheAmplitude = 0.04;
        this.mainGroup.add(this.particles);
    }

    createLights() {
        // Ambient
        const ambientLight = new THREE.AmbientLight(0x404040, 1);
        this.scene.add(ambientLight);

        // Key Light (Warm)
        const keyLight = new THREE.DirectionalLight(0xF2E9DA, 2);
        keyLight.position.set(5, 5, 5);
        this.scene.add(keyLight);

        // Rim Light (Gold) - Backlight
        const rimLight = new THREE.SpotLight(0xC6A95E, 5);
        rimLight.position.set(-5, 5, -5);
        rimLight.lookAt(0, 0, 0);
        this.scene.add(rimLight);
        
        // Fill Light (Cool)
        const fillLight = new THREE.PointLight(0x1C2430, 2);
        fillLight.position.set(-5, -5, 5);
        this.scene.add(fillLight);
    }

    onResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.width, this.height);
        if (this.particles && this.particles.userData && this.particles.userData.network) {
            this.particles.userData.network.nodeSpread = this.width < 768 ? 8.5 : 10;
            this.particles.userData.network.maxDistance = this.width < 768 ? 1.8 : 2.2;
        }
    }

    onMouseMove(event) {
        // Normalize mouse position -1 to 1
        this.mouse.x = (event.clientX / this.width) * 2 - 1;
        this.mouse.y = -(event.clientY / this.height) * 2 + 1;
    }

    /**
     * 更新场景状态 / Update scene state
     * @param {number} scrollProgress - 0 to 1 based on total page scroll
     * @param {object} sectionProgress - specific section progress if needed
     */
    updateState(scrollProgress) {
        // This method will be driven by GSAP in animations.js
        // Here we can handle frame-by-frame updates that are not easily tweened
    }

    updateNetwork(delta) {
        if (!this.particles || !this.particles.userData || !this.particles.userData.network) return;
        const network = this.particles.userData.network;
        const { positions, velocities, linePositions, nodeCount, maxConnections, pointGeometry, lineGeometry } = network;
        const nodeSpread = network.nodeSpread;
        const maxDistance = network.maxDistance;
        const maxDistanceSq = maxDistance * maxDistance;
        const halfSpread = nodeSpread * 0.5;
        const frameScale = Math.min(delta * 60, 2);

        for (let i = 0; i < nodeCount; i++) {
            const offset = i * 3;
            for (let axis = 0; axis < 3; axis++) {
                const idx = offset + axis;
                positions[idx] += velocities[idx] * frameScale;
                if (positions[idx] > halfSpread) {
                    positions[idx] = halfSpread;
                    velocities[idx] *= -1;
                } else if (positions[idx] < -halfSpread) {
                    positions[idx] = -halfSpread;
                    velocities[idx] *= -1;
                }
            }
        }

        let lineOffset = 0;
        for (let i = 0; i < nodeCount; i++) {
            const iOffset = i * 3;
            const ix = positions[iOffset];
            const iy = positions[iOffset + 1];
            const iz = positions[iOffset + 2];
            let linkedCount = 0;

            for (let j = i + 1; j < nodeCount; j++) {
                if (linkedCount >= maxConnections || lineOffset >= linePositions.length) break;
                const jOffset = j * 3;
                const dx = ix - positions[jOffset];
                const dy = iy - positions[jOffset + 1];
                const dz = iz - positions[jOffset + 2];
                const distanceSq = dx * dx + dy * dy + dz * dz;
                if (distanceSq > maxDistanceSq) continue;

                linePositions[lineOffset] = ix;
                linePositions[lineOffset + 1] = iy;
                linePositions[lineOffset + 2] = iz;
                linePositions[lineOffset + 3] = positions[jOffset];
                linePositions[lineOffset + 4] = positions[jOffset + 1];
                linePositions[lineOffset + 5] = positions[jOffset + 2];
                lineOffset += 6;
                linkedCount += 1;
            }

            if (lineOffset >= linePositions.length) break;
        }

        pointGeometry.attributes.position.needsUpdate = true;
        lineGeometry.attributes.position.needsUpdate = true;
        lineGeometry.setDrawRange(0, lineOffset / 3);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        const time = this.clock.getElapsedTime();
        const delta = this.clock.getDelta();

        // 1. Idle Rotation
        this.mainGroup.rotation.y += 0.002;
        this.particles.rotation.y -= 0.001;

        // 2. Mouse Parallax (Subtle)
        this.targetRotation.x = this.mouse.y * 0.05;
        this.targetRotation.y = this.mouse.x * 0.05;
        
        this.mainGroup.rotation.x += (this.targetRotation.x - this.mainGroup.rotation.x) * 0.05;
        // Note: we add to the idle rotation, so we just influence the tilt
        
        // 3. Particle "Breathing"
        // Expand/contract particles slightly
        const mainBaseScale = this.mainGroup && this.mainGroup.userData ? this.mainGroup.userData.baseScale : 1;
        this.mainGroup.scale.set(mainBaseScale, mainBaseScale, mainBaseScale);

        if (this.particles && this.particles.userData) {
            const particleBaseScale = this.particles.userData.baseScale || 1;
            const breatheAmplitude = this.particles.userData.breatheAmplitude || 0;
            const particleScale = this.particles.userData.lockScale
                ? particleBaseScale
                : particleBaseScale + Math.sin(time * 0.5) * breatheAmplitude;
            this.particles.scale.set(particleScale, particleScale, particleScale);
        }

        this.updateNetwork(delta);

        this.renderer.render(this.scene, this.camera);
    }
}
