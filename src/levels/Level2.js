/**
 * Level2 - Laboratorio Abandonado
 * Estilo: fondo oscuro con grid, plataformas escalonadas a multiples alturas,
 * tuberias verticales con vapor que MATA, acido verde en el suelo, centinela rojo
 */
import * as THREE from 'three';

export class Level2 {
    constructor(scene) {
        this.scene      = scene;
        this.platforms  = [];
        this.steamPipes = [];
        this.acidPools  = [];
        this.fragments  = [];
        this.sentinels  = [];
        this.goal       = null;
        this.particles  = [];
        this.time       = 0;

        this.spawnPoint   = { x: -460, y: -60 };
        this.cameraCenter = { x:   20, y:  -10 };
        this.deathY       = -240;

        this.checkpoints = [
            { x: -460, y: -60, activated: true  },
            { x:   80, y: -60, activated: false },
            { x:  340, y:  20, activated: false },
        ];
        this.activeCheckpoint = this.checkpoints[0];

        // Plataformas escalonadas a multiples alturas [x, y, w, h]
        // Nivel bajo (-110), medio (-40), alto (40), muy alto (100)
        this.platformData = [
            // Zona 1 - inicio nivel bajo
            [-460, -110, 200, 18],
            [-220, -110,  90, 18],
            // Zona 2 - salto a nivel medio (primera tuberia de vapor aqui)
            [ -80,  -40, 130, 18],
            // Zona 3 - nivel medio con centinela
            [  80,  -40, 160, 18],
            // Zona 4 - salto a nivel alto (segunda tuberia)
            [ 270,   40, 120, 18],
            // Zona 5 - plataforma pequeña flotante
            [ 400,   40,  70, 18],
            // Zona 6 - meta nivel alto
            [ 500,  100, 100, 18],
        ];

        // Tuberias de vapor - cuelgan del techo, vapor MATA al jugador de pie
        // El jugador DEBE agacharse (S) para pasar
        this.steamPipeData = [
            { x:  -80, steamH: 72, period: 3.8, phase: 0.0 },
            { x:  270, steamH: 72, period: 3.2, phase: 1.6 },
            { x:  310, steamH: 72, period: 3.2, phase: 3.0 },
        ];

        // Acido verde en el suelo - fila de charcos como en la imagen
        this.acidData = [
            { x: -340, y: -200, w: 60, h: 16 },
            { x: -200, y: -200, w: 60, h: 16 },
            { x:  -60, y: -200, w: 60, h: 16 },
            { x:   80, y: -200, w: 60, h: 16 },
            { x:  220, y: -200, w: 60, h: 16 },
            { x:  360, y: -200, w: 50, h: 16 },
            { x:  470, y: -200, w: 40, h: 16 },
        ];

        // Fragmentos flotando en plataformas elevadas
        this.fragmentData = [
            { x:  -80, y:  -10 },
            { x:  160, y:  -10 },
            { x:  500, y:  130 },
        ];

        // Solo 1 centinela en plataforma media
        this.sentinelData = [
            { x: 120, y: -65, patrolLeft: 80, patrolRight: 220, speed: 24 },
        ];

        this.goalData = { x: 520, y: 130 };

        this.messageTriggers = [
            {
                x: -350, radius: 80, triggered: false,
                type: 'info',
                header: '> NIVEL 2 — LABORATORIO ABANDONADO',
                body: 'Zona de sintesis corrupta. Plataformas a distintas alturas. Usa [W] para saltar entre niveles.',
            },
            {
                x: -80, radius: 60, triggered: false,
                type: 'warning',
                header: '> VAPOR TOXICO DETECTADO',
                body: 'El vapor destruye los circuitos. Espera que pare, agachate con [S] y cruza rapido.',
            },
            {
                x: 120, radius: 60, triggered: false,
                type: 'warning',
                header: '> ECO CENTINELA EN PATRULLA',
                body: 'Unidad Eco detectada. Patrulla lenta — espera que se aleje y salta por encima.',
            },
        ];
    }

    build() {
        this.createBackground();
        this.createPlatforms();
        this.createAcidPools();
        this.createSteamPipes();
        this.createFragments();
        this.createSentinels();
        this.createCheckpointMarkers();
        this.createGoal();
        this.createAmbientParticles();
    }

    createBackground() {
        const bgGeo = new THREE.PlaneGeometry(1600, 800);
        const bgMat = new THREE.ShaderMaterial({
            uniforms: { uTime: { value: 0 } },
            vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
            fragmentShader: `
                uniform float uTime;
                varying vec2 vUv;
                void main(){
                    vec3 col = mix(vec3(0.02,0.03,0.04), vec3(0.04,0.06,0.07), vUv.y);
                    float gx = step(0.97, fract(vUv.x * 18.0));
                    float gy = step(0.97, fract(vUv.y * 12.0));
                    col += (gx+gy)*vec3(0.01,0.03,0.02);
                    float hline = step(0.995, fract(vUv.y * 40.0));
                    col += hline * vec3(0.0,0.02,0.01);
                    col += sin(vUv.y*300.0+uTime*1.2)*vec3(0.0,0.004,0.002);
                    float fog = smoothstep(0.38,0.0,vUv.y)*0.20;
                    col += fog*vec3(0.0,0.4,0.15);
                    float noise = fract(sin(dot(vUv*50.0+uTime*0.02,vec2(12.9898,78.233)))*43758.5453);
                    col += noise*0.003;
                    float vig = 1.0-length((vUv-0.5)*1.7);
                    col *= max(vig,0.0);
                    gl_FragColor = vec4(col,1.0);
                }
            `
        });
        const bg = new THREE.Mesh(bgGeo, bgMat);
        bg.position.z = -6;
        this.scene.add(bg);
        this.bgMaterial = bgMat;

        // Tuberias horizontales de fondo (decorativas, como en la imagen)
        const hPipes = [
            { x:  -50, y:  30, w: 500, h: 7 },
            { x: -100, y: -10, w: 400, h: 6 },
            { x:  200, y:  60, w: 300, h: 7 },
            { x: -300, y:  50, w: 250, h: 6 },
        ];
        hPipes.forEach(p => {
            const group = new THREE.Group();
            const geo = new THREE.PlaneGeometry(p.w, p.h);
            const mat = new THREE.MeshBasicMaterial({ color: 0x1a2830, transparent: true, opacity: 0.6 });
            group.add(new THREE.Mesh(geo, mat));
            const edgeGeo = new THREE.PlaneGeometry(p.w, 1.5);
            const edgeMat = new THREE.MeshBasicMaterial({ color: 0x00aa66, transparent: true, opacity: 0.18 });
            const edge = new THREE.Mesh(edgeGeo, edgeMat);
            edge.position.set(0, p.h/2, 0.1);
            group.add(edge);
            const connCount = Math.floor(p.w/55);
            for(let i=0;i<connCount;i++){
                const cg = new THREE.PlaneGeometry(5, p.h+4);
                const cm = new THREE.MeshBasicMaterial({ color: 0x223040, transparent: true, opacity: 0.65 });
                const c = new THREE.Mesh(cg, cm);
                c.position.set(-p.w/2+27+i*55, 0, 0.1);
                group.add(c);
            }
            group.position.set(p.x, p.y, -2);
            this.scene.add(group);
        });

        // Tuberias verticales de fondo
        [-420,-250,-50,150,350,500].forEach(x => {
            const h = 100+Math.random()*120;
            const geo = new THREE.PlaneGeometry(6, h);
            const mat = new THREE.MeshBasicMaterial({ color: 0x162028, transparent: true, opacity: 0.5 });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(x, 120-h/2, -2.5);
            this.scene.add(mesh);
        });
    }

    createPlatforms() {
        this.platformData.forEach(([x,y,w,h]) => {
            const mesh = this._makePlatform(x,y,w,h);
            this.platforms.push({ mesh,x,y,w,h });
            this.scene.add(mesh);
        });
    }

    _makePlatform(x,y,w,h) {
        const group = new THREE.Group();
        // Base oscura
        const surfGeo = new THREE.PlaneGeometry(w,h);
        const surfMat = new THREE.MeshBasicMaterial({ color: 0x0e1820 });
        group.add(new THREE.Mesh(surfGeo, surfMat));
        // Capa superior
        const topGeo = new THREE.PlaneGeometry(w,4);
        const topMat = new THREE.MeshBasicMaterial({ color: 0x182830 });
        const top = new THREE.Mesh(topGeo, topMat);
        top.position.set(0, h/2-2, 0.1);
        group.add(top);
        // Linea neon verde
        const neonGeo = new THREE.PlaneGeometry(w,1.5);
        const neonMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.4 });
        const neon = new THREE.Mesh(neonGeo, neonMat);
        neon.position.set(0, h/2+0.5, 0.2);
        group.add(neon);
        // Grid interno
        const tileW = 18;
        const tc = Math.floor(w/tileW);
        for(let i=0;i<tc;i++){
            const tg = new THREE.PlaneGeometry(1,h-4);
            const tm = new THREE.MeshBasicMaterial({ color: 0x0a1018, transparent: true, opacity: 0.5 });
            const t = new THREE.Mesh(tg,tm);
            t.position.set(-w/2+tileW/2+i*tileW, 0, 0.05);
            group.add(t);
        }
        // Remaches
        const rc = Math.floor(w/28);
        for(let i=0;i<rc;i++){
            const rg = new THREE.PlaneGeometry(3,3);
            const rm = new THREE.MeshBasicMaterial({ color: 0x223040 });
            const r = new THREE.Mesh(rg,rm);
            r.position.set(-w/2+14+i*28, h/2-3, 0.15);
            group.add(r);
        }
        group.position.set(x,y,0);
        return group;
    }

    createAcidPools() {
        this.acidData.forEach(data => {
            const group = new THREE.Group();
            const liqGeo = new THREE.PlaneGeometry(data.w, data.h);
            const liqMat = new THREE.MeshBasicMaterial({ color: 0x00bb44, transparent: true, opacity: 0.85 });
            group.add(new THREE.Mesh(liqGeo, liqMat));
            const glowGeo = new THREE.PlaneGeometry(data.w+10, data.h+6);
            const glowMat = new THREE.MeshBasicMaterial({ color: 0x00ff66, transparent: true, opacity: 0.15 });
            const glow = new THREE.Mesh(glowGeo, glowMat);
            glow.position.z = -0.1;
            group.add(glow);
            const surfGeo = new THREE.PlaneGeometry(data.w, 2.5);
            const surfMat = new THREE.MeshBasicMaterial({ color: 0x66ffaa, transparent: true, opacity: 0.75 });
            const surf = new THREE.Mesh(surfGeo, surfMat);
            surf.position.set(0, data.h/2, 0.1);
            group.add(surf);
            group.position.set(data.x, data.y, 1);
            this.acidPools.push({ mesh: group, ...data, glowMat });
            this.scene.add(group);
        });
    }

    createSteamPipes() {
        const CEIL = 160;
        this.steamPipeData.forEach(data => {
            const group = new THREE.Group();
            // Cuerpo tuberia vertical
            const pipeLen = 55;
            const pipeGeo = new THREE.PlaneGeometry(16, pipeLen);
            const pipeMat = new THREE.MeshBasicMaterial({ color: 0x1e2838 });
            const pipe = new THREE.Mesh(pipeGeo, pipeMat);
            pipe.position.y = pipeLen/2;
            group.add(pipe);
            // Anillos metalicos
            [12,28,44].forEach(yo => {
                const rg = new THREE.PlaneGeometry(22,5);
                const rm = new THREE.MeshBasicMaterial({ color: 0x2a3848 });
                const r = new THREE.Mesh(rg,rm);
                r.position.set(0,yo,0.1);
                group.add(r);
            });
            // Boquilla
            const nozzleGeo = new THREE.PlaneGeometry(24,8);
            const nozzleMat = new THREE.MeshBasicMaterial({ color: 0x182030 });
            const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
            nozzle.position.set(0,2,0.15);
            group.add(nozzle);
            // Luz roja de advertencia
            const warnGeo = new THREE.PlaneGeometry(8,8);
            const warnMat = new THREE.MeshBasicMaterial({ color: 0xff2020, transparent: true, opacity: 0.85 });
            const warn = new THREE.Mesh(warnGeo, warnMat);
            warn.position.set(0,4,0.25);
            group.add(warn);
            // Vapor (invisible hasta activarse)
            const steamGroup = new THREE.Group();
            const sGeo = new THREE.PlaneGeometry(32, data.steamH);
            const sMat = new THREE.MeshBasicMaterial({ color: 0xaaffdd, transparent: true, opacity: 0 });
            const sMesh = new THREE.Mesh(sGeo, sMat);
            sMesh.position.y = -data.steamH/2 - 4;
            steamGroup.add(sMesh);
            const sgGeo = new THREE.PlaneGeometry(50, data.steamH+12);
            const sgMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0 });
            const sgMesh = new THREE.Mesh(sgGeo, sgMat);
            sgMesh.position.set(0, -data.steamH/2-4, -0.1);
            steamGroup.add(sgMesh);
            group.add(steamGroup);
            group.position.set(data.x, CEIL, 3);
            this.scene.add(group);
            this.steamPipes.push({
                ...data, mesh: group, steamMat: sMat, glowMat: sgMat,
                steamGroup, warnMat, active: false, timer: data.phase, ceilingY: CEIL
            });
        });
    }

    createFragments() {
        this.fragmentData.forEach((data,i) => {
            const group = new THREE.Group();
            const cGeo = new THREE.PlaneGeometry(14,14);
            const cMat = new THREE.MeshBasicMaterial({ color: 0x00cc66, transparent: true, opacity: 0.92 });
            const crystal = new THREE.Mesh(cGeo, cMat);
            crystal.rotation.z = Math.PI/4;
            group.add(crystal);
            const bGeo = new THREE.PlaneGeometry(18,18);
            const bMat = new THREE.MeshBasicMaterial({ color: 0x66ffaa, transparent: true, opacity: 0.38 });
            const border = new THREE.Mesh(bGeo, bMat);
            border.rotation.z = Math.PI/4;
            border.position.z = -0.05;
            group.add(border);
            const gGeo = new THREE.PlaneGeometry(28,28);
            const gMat = new THREE.MeshBasicMaterial({ color: 0x00ff66, transparent: true, opacity: 0.15 });
            const glow = new THREE.Mesh(gGeo, gMat);
            glow.rotation.z = Math.PI/4;
            glow.position.z = -0.1;
            group.add(glow);
            group.position.set(data.x, data.y, 3);
            this.fragments.push({ mesh: group, x: data.x, y: data.y, collected: false, index: i });
            this.scene.add(group);
        });
    }

    createSentinels() {
        this.sentinelData.forEach(data => {
            const group = new THREE.Group();
            const canvas = document.createElement('canvas');
            canvas.width = 32; canvas.height = 32;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            this._drawSentinel(ctx,'right');
            const tex = new THREE.CanvasTexture(canvas);
            tex.magFilter = THREE.NearestFilter;
            tex.minFilter = THREE.NearestFilter;
            const geo = new THREE.PlaneGeometry(32,32);
            const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
            const spriteMesh = new THREE.Mesh(geo, mat);
            group.add(spriteMesh);
            const glowGeo = new THREE.PlaneGeometry(38,38);
            const glowMat = new THREE.MeshBasicMaterial({ color: 0xff2020, transparent: true, opacity: 0.07 });
            group.add(new THREE.Mesh(glowGeo, glowMat));
            group.position.set(data.x, data.y, 4);
            this.scene.add(group);
            this.sentinels.push({ ...data, mesh: group, spriteMesh, spriteTex: tex, spriteCanvas: canvas, spriteCtx: ctx, dir: 1, posX: data.x });
        });
    }

    _drawSentinel(ctx, facing) {
        ctx.clearRect(0,0,32,32);
        if(facing==='left'){ ctx.save(); ctx.translate(32,0); ctx.scale(-1,1); }
        ctx.fillStyle='#1e1e2a'; ctx.fillRect(10,14,12,10);
        ctx.fillStyle='#ff2020'; ctx.fillRect(14,15,1,6); ctx.fillRect(17,17,1,4);
        ctx.fillStyle='#2a2a3a'; ctx.fillRect(9,6,14,10);
        ctx.fillStyle='#ff0000'; ctx.fillRect(10,9,12,4);
        ctx.fillStyle='#ff6060'; ctx.fillRect(14,10,4,2);
        ctx.fillStyle='#1a1a28'; ctx.fillRect(11,24,3,6); ctx.fillRect(18,24,3,6);
        ctx.fillStyle='#2a2a3a'; ctx.fillRect(10,29,5,2); ctx.fillRect(17,29,5,2);
        ctx.fillStyle='#3a3a4a'; ctx.fillRect(15,3,2,4);
        ctx.fillStyle='#ff2020'; ctx.fillRect(14,2,4,2);
        if(facing==='left') ctx.restore();
    }

    createCheckpointMarkers() {
        this.checkpoints.forEach((cp,i) => {
            if(i===0) return;
            const group = new THREE.Group();
            const poleGeo = new THREE.PlaneGeometry(3,44);
            const poleMat = new THREE.MeshBasicMaterial({ color: 0x1e2838 });
            group.add(new THREE.Mesh(poleGeo, poleMat));
            const flagGeo = new THREE.PlaneGeometry(18,12);
            const flagMat = new THREE.MeshBasicMaterial({ color: 0x005522, transparent: true, opacity: 0.75 });
            const flag = new THREE.Mesh(flagGeo, flagMat);
            flag.position.set(10,22,0.1);
            group.add(flag);
            const cpCanvas = document.createElement('canvas');
            cpCanvas.width=32; cpCanvas.height=16;
            const cctx = cpCanvas.getContext('2d');
            cctx.fillStyle='#00ff88'; cctx.font='bold 10px monospace'; cctx.textAlign='center';
            cctx.fillText('CP',16,12);
            const cpTex = new THREE.CanvasTexture(cpCanvas);
            cpTex.magFilter = THREE.NearestFilter;
            const cpGeo = new THREE.PlaneGeometry(16,8);
            const cpMat = new THREE.MeshBasicMaterial({ map: cpTex, transparent: true });
            const cpMesh = new THREE.Mesh(cpGeo, cpMat);
            cpMesh.position.set(10,22,0.2);
            group.add(cpMesh);
            group.position.set(cp.x, cp.y+22, 1);
            cp.markerMesh = group;
            cp.flagMat = flagMat;
            this.scene.add(group);
        });
    }

    createGoal() {
        const group = new THREE.Group();
        const portalGeo = new THREE.PlaneGeometry(28,44);
        const portalMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.25 });
        group.add(new THREE.Mesh(portalGeo, portalMat));
        const borderGeo = new THREE.PlaneGeometry(32,48);
        const borderMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.4 });
        const border = new THREE.Mesh(borderGeo, borderMat);
        border.position.z = -0.1;
        group.add(border);
        const exitCanvas = document.createElement('canvas');
        exitCanvas.width=64; exitCanvas.height=16;
        const ectx = exitCanvas.getContext('2d');
        ectx.fillStyle='#00ff88'; ectx.font='bold 12px monospace'; ectx.textAlign='center';
        ectx.fillText('EXIT',32,12);
        const exitTex = new THREE.CanvasTexture(exitCanvas);
        exitTex.magFilter = THREE.NearestFilter;
        const exitGeo = new THREE.PlaneGeometry(32,8);
        const exitMat = new THREE.MeshBasicMaterial({ map: exitTex, transparent: true });
        const exitMesh = new THREE.Mesh(exitGeo, exitMat);
        exitMesh.position.set(0,30,0.1);
        group.add(exitMesh);
        const arrowCanvas = document.createElement('canvas');
        arrowCanvas.width=16; arrowCanvas.height=16;
        const actx = arrowCanvas.getContext('2d');
        actx.fillStyle='#00ff88'; actx.font='14px monospace';
        actx.fillText('v',4,13);
        const arrowTex = new THREE.CanvasTexture(arrowCanvas);
        arrowTex.magFilter = THREE.NearestFilter;
        const arrowGeo = new THREE.PlaneGeometry(10,10);
        const arrowMat = new THREE.MeshBasicMaterial({ map: arrowTex, transparent: true });
        const arrow = new THREE.Mesh(arrowGeo, arrowMat);
        arrow.position.set(0,38,0.1);
        group.add(arrow);
        group.position.set(this.goalData.x, this.goalData.y, 1);
        this.goal = group;
        this.scene.add(group);
    }

    createAmbientParticles() {
        for(let i=0;i<30;i++){
            const size = 2+Math.random()*4;
            const geo = new THREE.PlaneGeometry(size,size);
            const mat = new THREE.MeshBasicMaterial({ color: 0x00ff66, transparent: true, opacity: 0.05+Math.random()*0.12 });
            const mesh = new THREE.Mesh(geo, mat);
            const x = -550+Math.random()*1100;
            const y = -240+Math.random()*80;
            mesh.position.set(x,y,0.4);
            this.scene.add(mesh);
            this.particles.push({ mesh, mat, speed: 10+Math.random()*20, phase: Math.random()*Math.PI*2 });
        }
    }

    canMoveTo(x,_y,_s){ return x>=-570 && x<=610; }

    getGroundAt(x,y){
        let groundY = this.deathY;
        const hp = 14;
        for(const p of this.platforms){
            const pL=p.x-p.w/2, pR=p.x+p.w/2, pT=p.y+p.h/2;
            if(x>=pL-hp && x<=pR+hp && pT<=y && pT>groundY) groundY=pT;
        }
        return groundY;
    }

    checkAcidCollision(player){
        const b=player.getBounds();
        for(const pool of this.acidPools){
            const l=pool.x-pool.w/2, r=pool.x+pool.w/2;
            const t=pool.y+pool.h/2, bot=pool.y-pool.h/2;
            if(b.right>l && b.left<r && b.bottom<t && b.top>bot) return true;
        }
        return false;
    }

    checkSteamCollision(player){
        const b=player.getBounds();
        for(const pipe of this.steamPipes){
            if(!pipe.active) continue;
            const sTop=pipe.ceilingY-4;
            const sBot=pipe.ceilingY-4-pipe.steamH;
            const sL=pipe.x-16, sR=pipe.x+16;
            if(b.right>sL && b.left<sR && b.top>sBot && b.bottom<sTop) return true;
        }
        return false;
    }

    checkSentinelCollision(player){
        const b=player.getBounds();
        for(const s of this.sentinels){
            if(b.right>s.posX-14 && b.left<s.posX+14 && b.top>s.y-14 && b.bottom<s.y+14) return true;
        }
        return false;
    }

    checkFragmentCollection(player){
        let collected=0;
        for(const frag of this.fragments){
            if(frag.collected) continue;
            if(Math.hypot(player.position.x-frag.x, player.position.y-frag.y)<30){
                frag.collected=true; frag.mesh.visible=false; collected++;
            }
        }
        return collected;
    }

    checkGoalReached(player){
        return Math.hypot(player.position.x-this.goalData.x, player.position.y-this.goalData.y)<32;
    }

    checkMessageTriggers(player){
        for(const t of this.messageTriggers){
            if(!t.triggered && Math.abs(player.position.x-t.x)<t.radius){ t.triggered=true; return t; }
        }
        return null;
    }

    updateCheckpoints(player){
        for(const cp of this.checkpoints){
            if(!cp.activated && player.position.x>cp.x-20){
                cp.activated=true; this.activeCheckpoint=cp;
                if(cp.flagMat){ cp.flagMat.color.setHex(0x00ff88); cp.flagMat.opacity=1.0; }
            }
        }
    }

    reset(){
        for(const frag of this.fragments){ frag.collected=false; frag.mesh.visible=true; }
        for(const t of this.messageTriggers) t.triggered=false;
        for(let i=1;i<this.checkpoints.length;i++){
            this.checkpoints[i].activated=false;
            if(this.checkpoints[i].flagMat){ this.checkpoints[i].flagMat.color.setHex(0x005522); this.checkpoints[i].flagMat.opacity=0.75; }
        }
        this.activeCheckpoint=this.checkpoints[0];
    }

    update(delta){
        this.time+=delta;
        if(this.bgMaterial) this.bgMaterial.uniforms.uTime.value=this.time;

        for(const frag of this.fragments){
            if(!frag.collected){
                frag.mesh.position.y=frag.y+Math.sin(this.time*2.5+frag.index*2)*5;
                frag.mesh.children[0].rotation.z=Math.PI/4+Math.sin(this.time*1.5+frag.index)*0.15;
            }
        }

        for(const pool of this.acidPools){
            pool.glowMat.opacity=0.08+Math.sin(this.time*3.5)*0.07;
        }

        const STEAM_ON=1.4;
        for(const pipe of this.steamPipes){
            pipe.timer+=delta;
            const cyclePos=pipe.timer%pipe.period;
            const wasActive=pipe.active;
            pipe.active=cyclePos<STEAM_ON;
            const target=pipe.active?0.60:0;
            pipe.steamMat.opacity+=(target-pipe.steamMat.opacity)*Math.min(delta*10,1);
            pipe.glowMat.opacity+=(target*0.25-pipe.glowMat.opacity)*Math.min(delta*10,1);
            const aboutToFire=cyclePos>pipe.period-0.5;
            pipe.warnMat.opacity=pipe.active?0.95:(aboutToFire?0.5+Math.sin(this.time*18)*0.45:0.3);
            pipe._playSteamSound=!wasActive&&pipe.active;
            if(pipe.active) pipe.steamGroup.position.x=Math.sin(this.time*14+pipe.phase)*2;
        }

        for(const s of this.sentinels){
            s.posX+=s.dir*s.speed*delta;
            if(s.posX>=s.patrolRight){ s.posX=s.patrolRight; s.dir=-1; }
            if(s.posX<=s.patrolLeft){ s.posX=s.patrolLeft; s.dir=1; }
            s.mesh.position.x=s.posX;
            this._drawSentinel(s.spriteCtx, s.dir>0?'right':'left');
            s.spriteTex.needsUpdate=true;
            s.mesh.children[1].material.opacity=0.05+Math.sin(this.time*4+s.patrolLeft)*0.04;
        }

        for(const p of this.particles){
            p.mesh.position.y+=p.speed*delta;
            p.mat.opacity=Math.max(0,0.04+Math.sin(this.time*2+p.phase)*0.08);
            if(p.mesh.position.y>220){ p.mesh.position.y=-240; p.mesh.position.x=-550+Math.random()*1100; }
        }

        if(this.goal){
            this.goal.children[0].material.opacity=0.2+Math.sin(this.time*3)*0.08;
            if(this.goal.children[3]) this.goal.children[3].position.y=38+Math.sin(this.time*4)*3;
        }
    }
}
