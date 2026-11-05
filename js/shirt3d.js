/* =====================================================
   shirt3d.js : the real 3D t-shirt inside the report window (your Blender model, Models/tee.glb).
   It turns slowly, draws at a low resolution on purpose (the chunky old-computer look),
   glows red from behind as the portal gets worse, and the evidence windows' lines follow points on it.
   If the model can't load (or WebGL is missing) the page quietly keeps using the flat shirt picture.
   portal.js talks to it through window.Shirt3D.
   ===================================================== */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const MODEL     = 'Models/tee.glb';
const PIXEL     = 2.2;      // how chunky the picture is (1 = sharp, 3 = very blocky)
const SPIN      = 0.38;     // radians per second at the start
const SPIN_MORE = 2.2;      // how much faster it spins when dread is at its worst (1 = twice as fast as the start)
const FIT       = 0.82;     // how much of the window's height the shirt fills

const stage  = document.getElementById('stage');
const canvas = document.getElementById('shirt3d');
if (stage && canvas) init();

// where the lines from the evidence windows land on the shirt (x, y, z in the model's own space; z+ is the front)
const ANCHORS = [
  [0, .33, .13], [.14, .2, .17], [-.17, .2, .17], [.33, .2, .02], [-.3, .12, .02],
  [.1, -.2, .17], [-.12, -.3, .17], [.15, -.34, .12], [0, .31, -.15], [0, 0, .18]
];

function init() {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: true }); }
  catch (e) { if (window.portalDebug) window.portalDebug('3D: this browser has no WebGL.'); return; }
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x2a3036, 1.25));
  const key = new THREE.DirectionalLight(0xffffff, 1.7); key.position.set(1.2, 2, 3); scene.add(key);
  const rim = new THREE.DirectionalLight(0xef1111, 0.0); rim.position.set(-2, 1, -2.5); scene.add(rim);   // the red glow from behind

  const camera = new THREE.PerspectiveCamera(30, 16 / 9, 0.05, 20);
  const pivot = new THREE.Group();
  scene.add(pivot);

  const api = window.Shirt3D = {
    ready: false,
    // the on-screen position (in % of the window) of anchor number i, for portal.js to aim its lines at
    project: function (i) {
      const a = ANCHORS[i % ANCHORS.length];
      const v = new THREE.Vector3(a[0], a[1], a[2]).applyMatrix4(pivot.matrixWorld).project(camera);
      return { x: (v.x + 1) * 50, y: (1 - v.y) * 50 };
    },
    // show the shirt as a wireframe for a few milliseconds
    wire: function (ms) {
      pivot.traverse(function (o) { if (o.isMesh) o.material.wireframe = true; });
      setTimeout(function () { pivot.traverse(function (o) { if (o.isMesh) o.material.wireframe = false; }); }, ms);
    },
    // when it gives up on the shirt: spin to show the back and stop
    freezeBack: function () { frozen = true; },
    dread: 0
  };
  let frozen = false, backAt = null;

  new GLTFLoader().load(MODEL, function (gltf) {
    const model = gltf.scene;
    model.traverse(function (o) {
      if (!o.isMesh) return;
      const old = o.material;
      o.material = new THREE.MeshLambertMaterial({ color: old.color ? old.color.clone() : 0xffffff, side: THREE.DoubleSide });
    });
    const box = new THREE.Box3().setFromObject(model);
    const mid = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    model.position.sub(mid);
    pivot.add(model);
    camera.position.set(0, 0, (size.y / FIT / 2) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    stage.classList.add('has3d');
    api.ready = true;
    requestAnimationFrame(frame);
  }, undefined, function (e) {
    console.warn('shirt3d: could not load ' + MODEL + ' (is the page opened from a web server?)', e);
    if (window.portalDebug) window.portalDebug('3D: could not load ' + MODEL + ' (check the folder is called Models and the file is tee.glb).');
  });

  let last = performance.now(), wobble = 0, nextJitter = 0, jitter = 0;

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (!canvas.offsetParent) return;                       // report window not showing: do nothing

    const w = Math.max(2, Math.round(stage.clientWidth / PIXEL));
    const h = Math.max(2, Math.round(stage.clientHeight / PIXEL));
    if (canvas.width !== w || canvas.height !== h) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    const d = (typeof window.portalDread === 'function') ? window.portalDread() : api.dread;
    rim.intensity = 0.05 + d * 2.2;

    if (frozen) {
      // ease around to the back (the next time it faces away) and hold still
      if (backAt === null) backAt = Math.PI + 2 * Math.PI * Math.ceil((pivot.rotation.y - Math.PI) / (2 * Math.PI));
      pivot.rotation.y += (backAt - pivot.rotation.y) * Math.min(1, dt * 1.4);
    } else {
      pivot.rotation.y += dt * SPIN * (1 + d * SPIN_MORE);
      // when it's bad the shirt twitches: it snaps a little off its path and back
      if (d > 0.45 && now > nextJitter) {
        jitter = (Math.random() - 0.5) * 0.35 * d;
        nextJitter = now + 200 + Math.random() * 900;
        setTimeout(function () { jitter = 0; }, 70 + Math.random() * 120);
      }
    }
    wobble += dt;
    pivot.rotation.x = Math.sin(wobble * 0.7) * 0.05;
    pivot.rotation.z = frozen ? 0 : jitter;
    pivot.position.y = Math.sin(wobble * 1.1) * 0.012;
    pivot.updateMatrixWorld(true);

    renderer.render(scene, camera);
  }
}
