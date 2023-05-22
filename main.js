import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// TODO:
// Animate stability modes

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
    camera: 'free'
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
    labelRenderer = new CSS2DRenderer();
    gui = new GUI();

    loader.load( './b744.gltf', function ( gltf ) {
        aircraft = gltf.scene;
        scene.add( gltf.scene );
    }, undefined, function ( error ) {
        console.error( error );
    } );

    scene.background = new THREE.Color( 0xf2f2f2 );
    if (params.camera == 'free') {
        camera.position.set( 100, 25, 75 );
    }
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
    labelRenderer.setSize( window.innerWidth, window.innerHeight );
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    document.body.appendChild( labelRenderer.domElement );

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

    const cameraGui = gui.addFolder('Camera');
    cameraGui.add( params, 'camera', ['free', 'front', 'back', 'top', 'bottom', 'left', 'right'] );

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
    phiOrigin.add(phiLabel);
    scene.add(phiOrigin);

    thetaOrigin = new THREE.Object3D();
    thetaLabel = createLabel('θ', new THREE.Vector3(0, 0, 76));
    thetaOrigin.add(thetaLabel);
    scene.add(thetaOrigin);

    psiOrigin = new THREE.Object3D();
    psiLabel = createLabel('ψ', new THREE.Vector3(0, 0, 76));
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

}

function render() {
    switch(params.camera) {
        case 'front':
            camera.position.set(0, 0, -100);
            break;
        case 'back':
            camera.position.set(0, 0, 100);
            break;
        case 'top':
            camera.position.set(0, 100, 0);
            break;
        case 'bottom':
            camera.position.set(0, -100, 0);
            break;
        case 'left':
            camera.position.set(-100, 0, 0);
            break;
        case 'right':
            camera.position.set(100, 0, 0);
            break;
    }

    updateAngles();

    earth_xy.visible = params.earth_xy;
    earth_xz.visible = params.earth_xz;
    earth_yz.visible = params.earth_yz;

    ac_xy.visible = params.ac_xy;
    ac_xz.visible = params.ac_xz;
    ac_yz.visible = params.ac_yz;

    x0.visible = params.x_0;
    x0Label.visible = params.x_0;
    y0.visible = params.y_0;
    y0Label.visible = params.y_0;
    z0.visible = params.z_0;
    z0Label.visible = params.z_0;
    xi.visible = params.x_i;
    xiLabel.visible = params.x_i;
    yi.visible = params.y_i;
    yiLabel.visible = params.y_i;
    zi.visible = params.z_i;
    ziLabel.visible = params.z_i;
    xb.visible = params.x_b;
    xbLabel.visible = params.x_b;
    yb.visible = params.y_b;
    ybLabel.visible = params.y_b;
    zb.visible = params.z_b;
    zbLabel.visible = params.z_b;

    psi.visible = params.psi;
    psi2.visible = params.psi;
    psiLabel.visible = params.psi;
    theta.visible = params.theta;
    theta2.visible = params.theta;
    thetaLabel.visible = params.theta;
    phi.visible = params.phi;
    phi2.visible = params.phi2;
    phiLabel.visible = params.phi;

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

function animate() {
	requestAnimationFrame( animate );
	controls.update();
	render()
}

function updateAngles() {
    if (Math.abs(params.yaw) < 5 && params.yaw < 0) {
        psiLabel.position.set(2, 0, -76);
    } else if (Math.abs(params.yaw) < 5 && params.yaw >= 0) {
        psiLabel.position.set(-2, 0, -76);
    } else {
        psiLabel.position.set((params.yaw*-0.66), 0, -76+((Math.abs(params.yaw)**2)*0.003));
    }

    if ((Math.abs(params.pitch) < 5) && (params.pitch < 0)) {
        thetaLabel.position.set(params.yaw*-1.15, -2, -76+((Math.abs(params.pitch)**2)*0.003)+((Math.abs(params.yaw)**2)*0.011));
    } else if (Math.abs(params.pitch) < 5 && params.pitch >= 0) {
        thetaLabel.position.set(params.yaw*-1.15, 2, -76+((Math.abs(params.pitch)**2)*0.003)+((Math.abs(params.yaw)**2)*0.011));
    } else {
        thetaLabel.position.set(params.yaw*-1.15, params.pitch*0.68, -76+((Math.abs(params.pitch)**2)*0.003)+((Math.abs(params.yaw)**2)*0.011));
    }

    phiOrigin.rotation.order = 'YXZ';
    phiOrigin.rotation.x = params.pitch*(Math.PI/180);
    phiOrigin.rotation.z = params.roll*(-1*Math.PI/180)/2;
    phiOrigin.rotation.y = params.yaw*(Math.PI/180);

    psiOrigin.rotation.order = 'YXZ';
    phiOrigin.rotation.y = params.yaw*(Math.PI/180);

    thetaOrigin.rotation.order = 'YXZ';
    phiOrigin.rotation.x = params.pitch*(Math.PI/180);
    phiOrigin.rotation.y = params.yaw*(Math.PI/180);

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

init()
animate()
