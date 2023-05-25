import * as THREE from './three.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// Author: Aron Zhao, aron.c.zhao@gmail.com
// Aircraft model from Fightgear developers, used without modification under GPLv2 license
// https://github.com/aron-zhao/FlightDynamicsViz
// (Please forgive any inefficiences and poor coding practice - this was built on a short timeline with no prior three.js experience)

let camera, scene, renderer, loader, gui, controls, labelRenderer;
let earth_xy, earth_xz, earth_yz;
let ac_xy, ac_xz, ac_yz;
let x0, y0, z0;
let xb, yb, zb;
let xi, yi, zi;
let aircraft;
let x0Label, y0Label, z0Label;
let xiLabel, yiLabel, ziLabel;
let xbLabel, ybLabel, zbLabel;
let acXyRingMesh, acXzRingMesh, acYzRingMesh;
let earthXyRingMesh, earthXzRingMesh, earthYzRingMesh;
let psiAngle, thetaAngle, phiAngle;
let psi, theta, phi;
let psiLabel, thetaLabel, phiLabel;
let psiAngle2, thetaAngle2, phiAngle2;
let psi2, theta2, phi2;
let psiOrigin, thetaOrigin, phiOrigin;
let particles, particlesParent;
let clock, elapsedTime;
let psiNeg, thetaNeg, phiNeg;

const params = {
    pitch: 20,
    roll: 20,
    yaw: 20,
    prev_pitch: 20,
    prev_roll: 20,
    prev_yaw: -20,
    earth_xy: false,
    earth_xz: false,
    earth_yz: false,
    ac_xy: false,
    ac_xz: false,
    ac_yz: false,
    x_0: true,
    y_0: true,
    z_0: true,
    x_i: true,
    y_i: true,
    z_i: true,
    x_b: true,
    y_b: true,
    z_b: true,
    ac_xy_ring: false,
    ac_xz_ring: false,
    ac_yz_ring: false,
    earth_xy_ring: false,
    earth_xz_ring: false,
    earth_yz_ring: false,
    psi: true,
    theta: true,
    phi: true,
    camera: 'free',
    anim: 'none',
    airflow: false
};

const origin = new THREE.Vector3( 0, 0, 0 );
const x0Dir = new THREE.Vector3( 0, 0, -1 );
const y0Dir = new THREE.Vector3( 1, 0, 0 );
const z0Dir = new THREE.Vector3( 0, -1, 0 );

const psiMat=  new THREE.MeshBasicMaterial({color: 0xa1bde6, side: THREE.DoubleSide});
const thetaMat = new THREE.MeshBasicMaterial({color: 0xa1e3bf, side: THREE.DoubleSide});
const phiMat = new THREE.MeshBasicMaterial({color: 0xedafaf, side: THREE.DoubleSide});

function init() {

    loader = new GLTFLoader();
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000 );
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    labelRenderer = new CSS2DRenderer();
    gui = new GUI();
    clock = new THREE.Clock();

    loader.load( './b744.gltf', function ( gltf ) {
        aircraft = gltf.scene;
        scene.add( gltf.scene );
    }, undefined, function ( error ) {
        console.error( error );
    } );

    scene.background = new THREE.Color( 0xffffff );
    if (params.camera == 'free') {
        camera.position.set( 100, 25, 75 );
    }
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
    labelRenderer.setSize( window.innerWidth, window.innerHeight );
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    document.body.appendChild( labelRenderer.domElement );
    clock.start()

    const ambientLight = new THREE.AmbientLight( 0xFFFFFF, 0.5 );
    scene.add( ambientLight );
    const directionalLight = new THREE.DirectionalLight( 0xFFFFFF, 0.5 );
    directionalLight.position.set( 5, 5, 5 )
    scene.add(directionalLight);

    controls = new OrbitControls( camera, labelRenderer.domElement );
    controls.update();

    earth_xy = new THREE.GridHelper(160, 50, 0xababab, 0xababab );
    scene.add(earth_xy);
    earth_xz = new THREE.GridHelper(160, 50, 0xababab, 0xababab );
    earth_xz.rotation.x = Math.PI / 2;
    earth_xz.rotation.z = Math.PI / 2;
    scene.add(earth_xz);
    earth_yz = new THREE.GridHelper(160, 50, 0xababab, 0xababab );
    earth_yz.rotation.x = Math.PI / 2;
    scene.add(earth_yz);

    const attitude = gui.addFolder('Aircraft Attitude');
    attitude.add( params, 'pitch' , -45, 45, 1 );
    attitude.add( params, 'roll', -45, 45, 1 );
    attitude.add( params, 'yaw', -45, 45, 1 );

    const cameraGui = gui.addFolder('Camera');
    cameraGui.add( params, 'camera', ['free', 'front', 'back', 'top', 'bottom', 'left', 'right'] );

    const animGui = gui.addFolder('Animation');
    animGui.add( params, 'anim', ['none', 'phugoid', 'short period', 'spiral', 'roll', 'dutch roll'] );

    const envGui = gui.addFolder('Environment');
    envGui.add( params, 'airflow' ).onChange();

    const vectors = gui.addFolder('Vectors');
    vectors.add( params, 'x_0' ).onChange(x0);
    vectors.add( params, 'y_0' ).onChange(y0);
    vectors.add( params, 'z_0' ).onChange(z0);
    vectors.add( params, 'x_i' ).onChange(xi);
    vectors.add( params, 'y_i' ).onChange(yi);
    vectors.add( params, 'z_i' ).onChange(zi);
    vectors.add( params, 'x_b' ).onChange(xb);
    vectors.add( params, 'y_b' ).onChange(yb);
    vectors.add( params, 'z_b' ).onChange(zb);

    const angles = gui.addFolder('Angles');
    angles.add( params, 'psi' ).onChange();
    angles.add( params, 'theta' ).onChange();
    angles.add( params, 'phi' ).onChange();

    const ref_rings = gui.addFolder('Reference Rings');
    ref_rings.add( params, 'ac_xy_ring' ).onChange();
    ref_rings.add( params, 'ac_xz_ring' ).onChange();
    ref_rings.add( params, 'ac_yz_ring' ).onChange();
    ref_rings.add( params, 'earth_xy_ring' ).onChange();
    ref_rings.add( params, 'earth_xz_ring' ).onChange();
    ref_rings.add( params, 'earth_yz_ring' ).onChange();

    const ref_planes = gui.addFolder('Reference Planes');
    ref_planes.add( params, 'earth_xy' ).onChange(earth_xy);
    ref_planes.add( params, 'earth_xz' ).onChange(earth_xz);
    ref_planes.add( params, 'earth_yz' ).onChange(earth_yz);
    ref_planes.add( params, 'ac_xy' ).onChange(ac_xy);
    ref_planes.add( params, 'ac_xz' ).onChange(ac_xz);
    ref_planes.add( params, 'ac_yz' ).onChange(ac_yz);


    const earthXyRing = new THREE.RingGeometry( 81, 86, 64 );
    const earthXyRingMat=  new THREE.MeshBasicMaterial({color: 0xb5b5b5, side: THREE.DoubleSide})
    earthXyRingMesh = new THREE.Mesh(earthXyRing, earthXyRingMat);
    earthXyRingMesh.rotation.x = Math.PI/2;
    scene.add(earthXyRingMesh);

    const earthXzRing = new THREE.RingGeometry( 81, 86, 64 );
    const earthXzRingMat=  new THREE.MeshBasicMaterial({color: 0xa1a1a1, side: THREE.DoubleSide})
    earthXzRingMesh = new THREE.Mesh(earthXzRing, earthXzRingMat);
    earthXzRingMesh.rotation.y = Math.PI/2;
    scene.add(earthXzRingMesh);

    const earthYzRing = new THREE.RingGeometry( 81, 86, 64 );
    const earthYzRingMat=  new THREE.MeshBasicMaterial({color: 0x9c9c9c, side: THREE.DoubleSide})
    earthYzRingMesh = new THREE.Mesh(earthYzRing, earthYzRingMat);
    earthYzRingMesh.rotation.z = Math.PI/2;
    scene.add(earthYzRingMesh);

    x0 = new THREE.ArrowHelper( x0Dir, origin, 80, 0xFF0000, 0);
    y0 = new THREE.ArrowHelper( y0Dir, origin, 80, 0x00FF00, 0);
    z0 = new THREE.ArrowHelper( z0Dir, origin, 80, 0x0000FF, 0);
    scene.add(x0);
    scene.add(y0);
    scene.add(z0);

    x0Label = createLabel('x', new THREE.Vector3(0,0,-76), '0');
    scene.add(x0Label);

    y0Label = createLabel('y', new THREE.Vector3(76,0,0), '0')
    scene.add(y0Label);

    z0Label = createLabel('z', new THREE.Vector3(0,-76,0), '0');
    scene.add(z0Label);
 
    const xbLineGeom = new THREE.CylinderGeometry(0.5, 0.4, 80, 8);
    const xbArrowGeom = new THREE.ConeGeometry(1, 2, 8);
    const xbMat = new THREE.MeshBasicMaterial( {color: 0xe37b7b} );
    const xbLineMesh = new THREE.Mesh(xbLineGeom, xbMat);
    const xbArrowMesh = new THREE.Mesh(xbArrowGeom, xbMat);
    xbLineMesh.rotation.z = Math.PI/2;
    xbLineMesh.rotation.y = Math.PI/2;
    xbLineMesh.position.z = -40;
    xbArrowMesh.rotation.x = Math.PI/2;
    xbArrowMesh.rotation.z = Math.PI;
    xbArrowMesh.position.z = -80;
    xbLabel = createLabel('x', new THREE.Vector3(0,0,-80),'b');
    xb = new THREE.Object3D();
    xb.add(xbArrowMesh);
    xb.add(xbLineMesh);
    xb.add(xbLabel)
    scene.add(xb);

    const ybLineGeom = new THREE.CylinderGeometry(0.5, 0.4, 80, 8);
    const ybArrowGeom = new THREE.ConeGeometry(1, 2, 8);
    const ybMat = new THREE.MeshBasicMaterial( {color: 0x75bf7f} );
    const ybLineMesh = new THREE.Mesh(ybLineGeom, ybMat);
    const ybArrowMesh = new THREE.Mesh(ybArrowGeom, ybMat);
    ybLineMesh.rotation.z = Math.PI/2;
    ybLineMesh.position.x = 40;
    ybArrowMesh.rotation.z = 3*Math.PI/2;
    ybArrowMesh.position.x = 80;
    ybLabel = createLabel('y', new THREE.Vector3(80,0,0), 'b');
    yb = new THREE.Object3D();
    yb.add(ybArrowMesh);
    yb.add(ybLineMesh);
    yb.add(ybLabel);
    scene.add(yb);

    const zbLineGeom = new THREE.CylinderGeometry(0.5, 0.4, 80, 8);
    const zbArrowGeom = new THREE.ConeGeometry(1, 2, 8);
    const zbMat = new THREE.MeshBasicMaterial( {color: 0x83a1d6} );
    const zbLineMesh = new THREE.Mesh(zbLineGeom, zbMat);
    const zbArrowMesh = new THREE.Mesh(zbArrowGeom, zbMat);
    zbLineMesh.rotation.y = Math.PI/2;
    zbLineMesh.position.y = -40;
    zbArrowMesh.rotation.x = Math.PI;
    zbArrowMesh.position.y = -80;
    zbLabel = createLabel('z', new THREE.Vector3(0,-80,0), 'b');
    zb = new THREE.Object3D();
    zb.add(zbArrowMesh);
    zb.add(zbLabel);
    zb.add(zbLineMesh);
    scene.add(zb);

    const xiLineGeom = new THREE.CylinderGeometry(0.3, 0.2, 80, 8);
    const xiArrowGeom = new THREE.ConeGeometry(0.6, 1.5, 8);
    const xiMat = new THREE.MeshBasicMaterial( {color: 0xad806a} );
    const xiLineMesh = new THREE.Mesh(xiLineGeom, xiMat);
    const xiArrowMesh = new THREE.Mesh(xiArrowGeom, xiMat);
    xiLineMesh.rotation.z = Math.PI/2;
    xiLineMesh.rotation.y = Math.PI/2;
    xiLineMesh.position.z = -40;
    xiArrowMesh.rotation.x = Math.PI/2;
    xiArrowMesh.rotation.z = Math.PI;
    xiArrowMesh.position.z = -80;
    xiLabel = createLabel('x', new THREE.Vector3(0,0,-78), 'i');
    xi = new THREE.Object3D();
    xi.add(xiArrowMesh);
    xi.add(xiLabel);
    xi.add(xiLineMesh);
    scene.add(xi);

    const yiLineGeom = new THREE.CylinderGeometry(0.3, 0.2, 80, 8);
    const yiArrowGeom = new THREE.ConeGeometry(0.6, 1.5, 8);
    const yiMat = new THREE.MeshBasicMaterial( {color: 0x86b06d} );
    const yiLineMesh = new THREE.Mesh(yiLineGeom, yiMat);
    const yiArrowMesh = new THREE.Mesh(yiArrowGeom, yiMat);
    yiLineMesh.rotation.z = Math.PI/2;
    yiLineMesh.position.x = 40;
    yiArrowMesh.rotation.z = 3*Math.PI/2;
    yiArrowMesh.position.x = 80;
    yiLabel = createLabel('y', new THREE.Vector3(78,0,0), 'i');
    yi = new THREE.Object3D();
    yi.add(yiArrowMesh);
    yi.add(yiLabel);
    yi.add(yiLineMesh);
    scene.add(yi);

    const ziLineGeom = new THREE.CylinderGeometry(0.3, 0.2, 80, 8);
    const ziArrowGeom = new THREE.ConeGeometry(0.6, 1.5, 8);
    const ziMat = new THREE.MeshBasicMaterial( {color: 0x607b9c} );
    const ziLineMesh = new THREE.Mesh(ziLineGeom, ziMat);
    const ziArrowMesh = new THREE.Mesh(ziArrowGeom, ziMat);
    ziLineMesh.rotation.y = Math.PI/2;
    ziLineMesh.position.y = -40;
    ziArrowMesh.rotation.x = Math.PI;
    ziArrowMesh.position.y = -80;
    ziLabel = createLabel('z', new THREE.Vector3(0,-78,0), 'i');
    zi = new THREE.Object3D();
    zi.add(ziArrowMesh);
    zi.add(ziLabel);
    zi.add(ziLineMesh);
    scene.add(zi);

    const acXyRing = new THREE.RingGeometry( 79, 81, 64 );
    const acXyRingMat=  new THREE.MeshBasicMaterial({color: 0x5c5c5c, side: THREE.DoubleSide});
    acXyRingMesh = new THREE.Mesh(acXyRing, acXyRingMat);
    acXyRingMesh.rotation.x = Math.PI/2;
    zb.add(acXyRingMesh);

    const acXzRing = new THREE.RingGeometry( 79, 81, 64 );
    const acXzRingMat=  new THREE.MeshBasicMaterial({color: 0x666666, side: THREE.DoubleSide});
    acXzRingMesh = new THREE.Mesh(acXzRing, acXzRingMat);
    acXzRingMesh.rotation.y = Math.PI/2;
    zb.add(acXzRingMesh);

    const acYzRing = new THREE.RingGeometry( 79, 81, 64 );
    const acYzRingMat=  new THREE.MeshBasicMaterial({color: 0x575757, side: THREE.DoubleSide});
    acYzRingMesh = new THREE.Mesh(acYzRing, acYzRingMat);
    acYzRingMesh.rotation.z = Math.PI/2;
    zb.add(acYzRingMesh);

    ac_xy = new THREE.GridHelper(160, 50, 0xababab, 0xababab );
    zb.add(ac_xy);
    ac_xz = new THREE.GridHelper(160, 50, 0xababab, 0xababab );
    ac_xz.rotation.x = Math.PI / 2;
    ac_xz.rotation.z = Math.PI / 2;
    zb.add(ac_xz);
    ac_yz = new THREE.GridHelper(160, 50, 0xababab, 0xababab );
    ac_yz.rotation.x = Math.PI / 2;
    zb.add(ac_yz);

    phiOrigin = new THREE.Object3D();
    phiLabel = createLabel('φ', new THREE.Vector3(76, 0, 0));
    phiNeg = createLabel('(-)', new THREE.Vector3(76, 4, 0));
    phiOrigin.add(phiNeg);
    phiOrigin.add(phiLabel);
    scene.add(phiOrigin);

    thetaOrigin = new THREE.Object3D();
    thetaLabel = createLabel(' θ', new THREE.Vector3(0, 0, 76));
    thetaNeg = createLabel('(-)', new THREE.Vector3(0, 4, 76));
    thetaOrigin.add(thetaNeg);
    thetaOrigin.add(thetaLabel);
    scene.add(thetaOrigin);

    psiOrigin = new THREE.Object3D();
    psiLabel = createLabel(' ψ', new THREE.Vector3(0, 0, 76));
    psiNeg = createLabel('(-)', new THREE.Vector3(0, 4, 76));
    psiOrigin.add(psiNeg);
    psiOrigin.add(psiLabel);
    scene.add(psiOrigin);


    thetaAngle = new THREE.RingGeometry( 74, 79, 64, 1, 0, params.pitch*Math.PI/180 );
    theta = new THREE.Mesh(thetaAngle, thetaMat);
    thetaAngle2 = new THREE.RingGeometry( 74, 79, 64, 1, 0, params.pitch*Math.PI/180 );
    theta2 = new THREE.Mesh(thetaAngle2, thetaMat);
    scene.add(theta);
    scene.add(theta2);

    psiAngle = new THREE.RingGeometry( 74, 79, 64, 1, 0, params.yaw*Math.PI/180 );
    psiAngle2 = new THREE.RingGeometry( 74, 79, 64, 1, 0, params.yaw*Math.PI/180 );
    psi = new THREE.Mesh(psiAngle, psiMat);
    psi2 = new THREE.Mesh(psiAngle2, psiMat);
    scene.add(psi);
    scene.add(psi2);

    phiAngle = new THREE.RingGeometry( 74, 79, 64, 1, 0, params.roll*Math.PI/180 );
    phiAngle2 = new THREE.RingGeometry( 74, 79, 64, 1, 0, params.roll*Math.PI/180 );
    phi = new THREE.Mesh(phiAngle, phiMat);
    phi2 = new THREE.Mesh(phiAngle2, phiMat);
    scene.add(phi);
    scene.add(phi2);

    const particleMat = new THREE.MeshBasicMaterial({color: 0xd1d1d1});
    const particleGeo = new THREE.CylinderGeometry(0.1, 0.1, 40, 4);

    var i = 0;
    var j = 0;
    particles = [];
    particlesParent = new THREE.Object3D;
    while(i < 10) {
        while(j < 10) {
            const particle = new THREE.Mesh(particleGeo, particleMat);
            particle.rotation.x = Math.PI/2;
            particle.position.set(-50 + i*10, -75 + j*15, -300 + Math.random()*180)
            particlesParent.add(particle);
            particles[i*10 + j] = particle;
            scene.add(particle);
            j += 1;
        }
        j = 0;
        i += 1;
    }
}

function render() {
    switch(params.camera) {
        case 'front':
            camera.position.set(0, 0, -120);
            break;
        case 'back':
            camera.position.set(0, 0, 120);
            break;
        case 'top':
            camera.position.set(0, 120, 0);
            break;
        case 'bottom':
            camera.position.set(0, -120, 0);
            break;
        case 'left':
            camera.position.set(-120, 0, 0);
            break;
        case 'right':
            camera.position.set(120, 0, 0);
            break;
    }

    if (params.yaw < -3 && params.psi) {
        psiNeg.visible = true;
    } else {
        psiNeg.visible = false;
    }
    if (params.pitch < -3 && params.theta) {
        thetaNeg.visible = true;
    } else {
        thetaNeg.visible = false;
    }
    if (params.roll < -3 && params.phi) {
        phiNeg.visible = true;
    } else {
        phiNeg.visible = false;
    }

    updateAngles();

    earth_xy.visible = params.earth_xy;
    earth_xz.visible = params.earth_xz;
    earth_yz.visible = params.earth_yz;

    ac_xy.visible = params.ac_xy;
    ac_xz.visible = params.ac_xz;
    ac_yz.visible = params.ac_yz;

    if (Math.abs(params.yaw) < 3 && Math.abs(params.pitch < 3)) {
        x0Label.visible = false;
    } else {
        x0Label.visible = params.x_0;
    }
    x0.visible = params.x_0;
    if (Math.abs(params.yaw) < 3 && Math.abs(params.roll < 3)) {
        y0Label.visible = false;
    } else {
        y0Label.visible = params.y_0;
    }
    y0.visible = params.y_0;
    if (Math.abs(params.pitch) < 3 && Math.abs(params.roll < 3)) {
        z0Label.visible = false;
    } else {
        z0Label.visible = params.z_0;
    }
    z0.visible = params.z_0;
    xi.visible = params.x_i;
    if (Math.abs(params.yaw) < 3 || Math.abs(params.pitch) < 3) {
        xiLabel.visible = false;
    } else {
        xiLabel.visible = params.x_i;
    }
    yi.visible = params.y_i;
    if (Math.abs(params.yaw) < 3 || Math.abs(params.roll) < 3) {
        yiLabel.visible = false;
    } else {
        yiLabel.visible = params.y_i;
    }
    zi.visible = params.z_i;
    if (Math.abs(params.pitch) < 3 || Math.abs(params.roll) < 3) {
        ziLabel.visible = false;
    } else {
        ziLabel.visible = params.z_i;
    }
    xb.visible = params.x_b;
    xbLabel.visible = params.x_b;
    yb.visible = params.y_b;
    ybLabel.visible = params.y_b;
    zb.visible = params.z_b;
    zbLabel.visible = params.z_b;

    psi.visible = params.psi;
    psi2.visible = params.psi;
    if (Math.abs(params.yaw) < 3) {
        psiLabel.visible = false;
    } else {
        psiLabel.visible = params.psi;
    }
    theta.visible = params.theta;
    theta2.visible = params.theta;
    if (Math.abs(params.pitch) < 3) {
        thetaLabel.visible = false;
    } else {
        thetaLabel.visible = params.theta;
    }
    phi.visible = params.phi;
    phi2.visible = params.phi;
    if (Math.abs(params.roll) < 3) {
        phiLabel.visible = false;
    } else {
        phiLabel.visible = params.phi;
    }

    acXyRingMesh.visible = params.ac_xy_ring;
    acXzRingMesh.visible = params.ac_xz_ring;
    acYzRingMesh.visible = params.ac_yz_ring;
    
    earthXyRingMesh.visible = params.earth_xy_ring;
    earthXzRingMesh.visible = params.earth_xz_ring;
    earthYzRingMesh.visible = params.earth_yz_ring;

    aircraft.rotation.order = 'YXZ';
    aircraft.rotation.y = params.yaw*(Math.PI/180);
    aircraft.rotation.x = params.pitch*(Math.PI/180);
    aircraft.rotation.z = params.roll*(-1*Math.PI/180);

    xb.rotation.order = 'YXZ';
    xb.rotation.x = params.pitch*(Math.PI/180);
    xb.rotation.y = params.yaw*(Math.PI/180);

    yb.rotation.order = 'YXZ';
    yb.rotation.x = params.pitch*(Math.PI/180)
    yb.rotation.z = params.roll*(-1*Math.PI/180);
    yb.rotation.y = params.yaw*(Math.PI/180);

    zb.rotation.order = 'YXZ';
    zb.rotation.x = params.pitch*(Math.PI/180);
    zb.rotation.z = params.roll*(-1*Math.PI/180);
    zb.rotation.y = params.yaw*(Math.PI/180);

    xi.rotation.order = 'YXZ';
    xi.rotation.y = params.yaw*(Math.PI/180);

    yi.rotation.order = 'YXZ';
    yi.rotation.y = params.yaw*(Math.PI/180);

    zi.rotation.order = 'YXZ';
    zi.rotation.x = params.pitch*(Math.PI/180);
    zi.rotation.y = params.yaw*(Math.PI/180);

    renderer.render( scene, camera );
    labelRenderer.render( scene, camera );
}

function simulate() {
    particles.forEach(airflowViz);

    switch(params.anim) {
        case 'none':
            particles.forEach(noneAnim);
            break
        case 'phugoid':
            particles.forEach(phugoidAnim);
            break
        case 'short period':
            particles.forEach(shortPeriodAnim);
            break
        case 'roll':
            particles.forEach(rollAnim);
            break
        case 'spiral':
            particles.forEach(spiralAnim);
            break
        case 'dutch roll':
            particles.forEach(dutchRollAnim);
            break
    }
}

function rollAnim(x) {
    if (x.position.z >= 120) {
        x.position.z = -300 + Math.random()*180
    }
    params.pitch = 0;
    params.roll = 0;
    params.yaw = 0;

    elapsedTime = clock.getElapsedTime();
    x.position.z += 2;

    if (elapsedTime < 2) {
        params.roll = 0;
    } else {
        params.roll = 15*Math.log(elapsedTime-1);
    }
    if (elapsedTime > 8) {
        clock.start();
    }
}

function spiralAnim(x) {
    if (x.position.z >= 120) {
        x.position.z = -300 + Math.random()*180
    }
    params.pitch = 0;
    params.roll = 0;
    params.yaw = 0;

    elapsedTime = clock.getElapsedTime();
    x.position.z += 2;

    if (elapsedTime > 2) {
        params.roll = 5*(elapsedTime-2)*(1.2**(elapsedTime - 2));
    }

    if (elapsedTime > 8) {
        clock.start();
    }
}

function dutchRollAnim(x) {
    if (x.position.z >= 120) {
        x.position.z = -300 + Math.random()*180
    }
    params.pitch = 0;
    params.roll = 0;
    params.yaw = 0;

    elapsedTime = clock.getElapsedTime();
    x.position.z += 2;

    params.roll = 15*Math.sin(0.5*elapsedTime);
    params.yaw = 15*Math.sin(0.5*(elapsedTime - Math.PI/2));
}

function shortPeriodAnim(x) {
    if (x.position.z >= 120) {
        x.position.z = -300 + Math.random()*180
    }
    params.pitch = 0;
    params.roll = 0;
    params.yaw = 0;

    elapsedTime = clock.getElapsedTime();
    x.position.z += 2;
    params.pitch += 35*Math.sin(1.5*elapsedTime)*(0.4**elapsedTime)

    if (elapsedTime > 5) {
        clock.start();
    }
}

function phugoidAnim(x) {
    if (x.position.z >= 120) {
        x.position.z = -300 + Math.random()*180
    }

    params.pitch = 0;
    params.roll = 0;
    params.yaw = 0;

    elapsedTime = clock.getElapsedTime();
    x.position.z += 1.5+0.8*Math.cos(0.5*elapsedTime);
    x.position.y -= (0.3*Math.sin(0.5*elapsedTime));
    params.pitch += 5*(Math.sin(0.5*elapsedTime))
}

function noneAnim(x) {
    if (x.position.z >= 150) {
        x.position.z = -300 + Math.random()*180
    }
    x.position.z += 2;
}

function airflowViz(x) {
    x.visible = params.airflow;
}

function animate() {
	requestAnimationFrame( animate );
	controls.update();
    simulate();
	render();
}

function updateAngles() {
    psiOrigin.rotation.order = 'YXZ';
    psiOrigin.rotation.y = Math.PI + (params.yaw*(Math.PI/180))/2;

    thetaOrigin.rotation.order = 'YXZ';
    thetaOrigin.rotation.y = Math.PI + params.yaw*(Math.PI/180);
    thetaOrigin.rotation.x = -1*params.pitch*(Math.PI/180)/2;

    phiOrigin.rotation.order = 'YXZ';
    phiOrigin.rotation.y = params.yaw*(Math.PI/180);
    phiOrigin.rotation.x = params.pitch*(Math.PI/180);
    phiOrigin.rotation.z = params.roll*(-1*Math.PI/180)/2;

    psi.geometry.dispose();
    psi2.geometry.dispose();
    psiAngle = new THREE.RingGeometry( 74, 79, 64, 1, 0, params.yaw*Math.PI/180 );
    psiAngle2 = new THREE.RingGeometry( 74, 79, 64, 1, 0, params.yaw*Math.PI/180 );
    psi.geometry = psiAngle;
    psi2.geometry = psiAngle2;
    psi.rotation.x = -1*Math.PI/2;
    psi.rotation.z = Math.PI/2;
    psi2.rotation.x = -1*Math.PI/2;

    theta.geometry.dispose();
    theta2.geometry.dispose();
    thetaAngle = new THREE.RingGeometry( 74, 79, 64, 1, 0, params.pitch*Math.PI/180 );
    thetaAngle2 = new THREE.RingGeometry( 74, 79, 64, 1, 0, params.pitch*Math.PI/180 );
    theta.geometry = thetaAngle;
    theta2.geometry = thetaAngle2;
    theta.rotation.y = Math.PI/2 + params.yaw*Math.PI/180;
    theta2.rotation.z = -1*Math.PI/2;
    theta2.rotation.y = Math.PI/2 + params.yaw*Math.PI/180;

    phi.geometry.dispose();
    phi2.geometry.dispose();
    phiAngle = new THREE.RingGeometry( 74, 79, 64, 1, 0, params.roll*Math.PI/180 );
    phiAngle2 = new THREE.RingGeometry( 74, 79, 64, 1, 0, params.roll*Math.PI/180 );
    phi.geometry = phiAngle;
    phi2.geometry = phiAngle2;
    phi.rotation.order = 'YXZ';
    phi.rotation.y = params.yaw*Math.PI/180;
    phi.rotation.x = -1*Math.PI + params.pitch*Math.PI/180;
    phi2.rotation.order = 'YXZ';
    phi2.rotation.z = -1*Math.PI/2 - params.roll*Math.PI/180;
    phi2.rotation.y = params.yaw*Math.PI/180;
    phi2.rotation.x = params.pitch*Math.PI/180;
}

function createLabel(content, position, subscript) {
    const labelDiv = document.createElement('div');
    labelDiv.className = 'label';

    const labelContent = document.createElement('span');
    labelContent.innerHTML = content;

    if (subscript) {
      const subscriptSpan = document.createElement('sub');
      subscriptSpan.className = 'subscript';
      subscriptSpan.innerHTML = subscript;
      labelContent.appendChild(subscriptSpan);
    }

    labelDiv.appendChild(labelContent);

    const labelObject = new CSS2DObject(labelDiv); 
    labelObject.position.copy(position);

    return labelObject;
  }

init();
animate();
