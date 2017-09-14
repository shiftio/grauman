import m from 'mithril';
import throttle from 'lodash.throttle';
import Polyfills from 'Polyfills';
import Stats from 'vendor/stats';
import DeviceOrientationControls from 'vendor/DeviceOrientationControls';

// THREE doesn't seem to export a default THREE namespace
import {
    BackSide,
    LinearFilter,
    Math as ThreeMath,
    Mesh,
    MeshBasicMaterial,
    PerspectiveCamera,
    RGBFormat,
    Scene,
    SphereBufferGeometry,
    SphereGeometry,
    Vector3,
    VideoTexture,
    WebGLRenderer
} from 'three/build/three.module';

const ThreeSixtyViewer = {
    debug: false,
    isAnimating: false,
    isDragging: false,
    lat: 0,
    lon: 0,

    distance: 0.1,

    scene: null,
    camera: null,
    webGLRenderer: null,
    stats: null,

    oninit(vnode) {
        this._onDocumentMouseMove = throttle(this._onDocumentMouseMove.bind(this, vnode), 25);
        this._onDocumentMouseUp = this._onDocumentMouseUp.bind(this, vnode);
    },

    oncreate(vnode) {
        const container = vnode.dom;
        const media = vnode.dom.children[0];

        this.initScene(vnode.attrs, media, container);
        this.initStats(container);
        this.animateScene();
    },

    onbeforeupdate(vnode, old) {
        const { width, height } = vnode.attrs.mediaAttrs;
        const { width: oldWidth, height: oldHeight } = old.attrs;

        if (this.camera && (width !== oldWidth || height !== oldHeight)) {
            this.resize(vnode.attrs);
        }
    },

    onupdate(/* vnode */) {
        if (this.debug) {
            this.stats.domElement.style.display = this.debug ? 'block' : 'none';
            this.debugMesh.visible = this.debug;
        }
    },

    onremove(/* vnode */) {
        this.isAnimating = false;
        this.texture.dispose();
        this.material.dispose();
        this.webGLRenderer.forceContextLoss();
    },

    initScene(attrs, media, container) {
        const { width, height } = attrs.mediaAttrs;
        const aspectRatio = width / height;
        const camera = new PerspectiveCamera(75, aspectRatio, 1, 1100);
        let geometry = new SphereGeometry(500, 60, 40);
        const texture = new VideoTexture(media);

        camera.target = new Vector3(0, 0, 0);
        geometry.scale(-1, 1, 1);
        texture.minFilter = LinearFilter;
        texture.format = RGBFormat;

        let material = new MeshBasicMaterial({ map: texture });
        let mesh = new Mesh(geometry, material);
        const scene = new Scene();
        const renderer = new WebGLRenderer();

        scene.add(mesh);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(width, height);
        container.appendChild(renderer.domElement);

        this.isAnimating = true;
        this.scene = scene;
        this.texture = texture;
        this.mesh = mesh;
        this.material = material;
        this.camera = camera;
        this.webGLRenderer = renderer;

        // add device orientation controls, if we're on a mobile device
        if (typeof window.orientation !== 'undefined') {
            this.orientationControls = new DeviceOrientationControls(camera);
        }

        // add wireframe mesh
        geometry = new SphereBufferGeometry(500, 60, 40);
        material = new MeshBasicMaterial({ color: 0xff00ff, side: BackSide, wireframe: true });
        mesh = new Mesh(geometry, material);
        mesh.visible = this.debug;
        this.debugMesh = mesh;

        scene.add(mesh);
    },

    animateScene() {
        if (!this.isAnimating) {
            return;
        }

        requestAnimationFrame(this.animateScene.bind(this));
        this.updateScene();
        this.renderScene();

        if (this.debug) {
            this.stats.update();
        }
    },

    updateScene() {
        // const orientationControls = this.orientationControls;

        /*
        if (orientationControls) {
            orientationControls.update();
        } else {
        */
        const lat = Math.max(-85, Math.min(85, this.lat));
        const phi = ThreeMath.degToRad(90 - lat);
        const theta = ThreeMath.degToRad(this.lon);
        const camera = this.camera;
        const distance = this.distance;

        this.lat = lat;

        camera.position.x = distance * Math.sin(phi) * Math.cos(theta);
        camera.position.y = distance * Math.cos(phi);
        camera.position.z = distance * Math.sin(phi) * Math.sin(theta);

        camera.lookAt(camera.target);
        // }
    },

    renderScene() {
        this.webGLRenderer.render(this.scene, this.camera);
    },

    initStats(container) {
        const stats = new Stats();

        stats.domElement.style.position = 'absolute';
        stats.domElement.style.top = '0px';
        stats.domElement.style.zIndex = 100;
        stats.domElement.style.display = this.debug ? 'block' : 'none';
        container.appendChild(stats.domElement);

        this.stats = stats;
    },

    resize(attrs) {
        const { width, height } = attrs.mediaAttrs;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.webGLRenderer.setSize(width, height);
    },

    _attachDocumentListeners() {
        document.addEventListener('mouseup', this._onDocumentMouseUp);
        document.addEventListener('mousemove', this._onDocumentMouseMove);
    },

    _removeDocumentListeners() {
        document.removeEventListener('mousemove', this._onDocumentMouseMove);
        document.removeEventListener('mouseup', this._onDocumentMouseUp);
    },

    _onDocumentMouseUp(vnode/*, e */) {
        this._removeDocumentListeners();
        Polyfills.closest(vnode.dom, '.media-container').focus();
    },

    _onDocumentMouseMove(vnode, e) {
        this._updateLastClick(e.clientX, e.clientY);
    },

    _onMouseDown(e) {
        this._setInitialLastClick(e.clientX, e.clientY);
        this._attachDocumentListeners();

        e.preventDefault();
        e.stopPropagation();
    },

    _updateLastClick(clientX, clientY) {
        const last = this.lastClick;


        if (clientX - last.x || clientY - last.y) {
            this.isDragging = true;
            this.lon = (last.x - clientX) * 0.17 + last.lon;
            this.lat = (last.y - clientY) * 0.2 + last.lat;
        }
    },

    _setInitialLastClick(clientX, clientY) {
        this.lastClick = {
            x: clientX,
            y: clientY,
            lon: this.lon,
            lat: this.lat
        };
    },

    _getTouchEvent(e) {
        return Array.prototype.slice.call(e.touches).find(function (t) {
            return t.identifier === 0;
        });
    },

    _onTouchStart(e) {
        const touch = this._getTouchEvent(e);

        this.isDragging = true;
        this._setInitialLastClick(touch.clientX, touch.clientY);

        e.preventDefault();
    },

    _onTouchMove(e) {
        const touch = this._getTouchEvent(e);
        this._updateLastClick(touch.clientX, touch.clientY);
    },

    _onTouchEnd(e) {
        if (!e.touches.length) {
            this.isDragging = false;
        }
    },

    _onClick(vnode/*, e */) {
        if (!this.isDragging) {
            vnode.attrs.onTogglePlay();
        }

        this.isDragging = false;
    },

    _onContextMenu(e) {
        if (!this.debug) {
            e.preventDefault();
        }
    },

    view(vnode) {
        return m('.viewer', {
            onclick: this._onClick.bind(this, vnode),
            oncontextmenu: this._onContextMenu.bind(this),
            onmousedown: this._onMouseDown.bind(this),
            ontouchstart: this._onTouchStart.bind(this),
            ontouchmove: this._onTouchMove.bind(this),
            ontouchend: this._onTouchEnd.bind(this),
        }, [
            m('video', {
                ...vnode.attrs.mediaAttrs,
                style: {
                    display: 'none',
                    visibility: 'hidden'
                }
            })
        ]);
    }
};

export default ThreeSixtyViewer;
