import m from 'mithril';
import Stats from 'vendor/stats';
import { STEREOSCOPIC_LAYOUTS } from 'consts';

const OMG_FKN_VR_BBQ = true;

// THREE doesn't seem to export a default THREE namespace
import {
    //BackSide,
    LinearFilter,
    Math as ThreeMath,
    Mesh,
    MeshBasicMaterial,
    PerspectiveCamera,
    RGBFormat,
    Scene,
    //SphereBufferGeometry,
    SphereGeometry,
    Vector3,
    VideoTexture,
    WebGLRenderer
} from 'three/build/three.module';

const VRViewer = {
    isAnimating: false,
    aspectRatio: 16 / 9,
    width: 0,
    height: 0,
    lat: 0,
    lon: 0,
    distance: 0.1,
    scene: null,
    camera: null,
    webGLRenderer: null,
    stats: null,

    oninit(vnode) {
        this.aspectRatio = vnode.attrs.aspectRatio;
        this.width = vnode.attrs.width;
        this.height = vnode.attrs.height;
        this.debug = vnode.attrs.debug;
    },

    onbeforeupdate(vnode, old) {
        const { width, height } = vnode.attrs;
        const { width: oldWidth, height: oldHeight } = old.attrs;

        if (width !== oldWidth || height !== oldHeight) {
            this.resize(vnode.attrs);
        }
    },

    onupdate(vnode) {
        const { debug, width, height } = vnode.attrs;

        this.width = width;
        this.height = height;
        this.aspectRatio = width / height;

        this.stats.domElement.style.display = debug ? 'block' : 'none';
        // this.debugMesh.visible = debug;
    },

    oncreate(vnode) {
        const container = vnode.dom;
        const media = vnode.dom.children[0];

        const left = this.createScene(media, 'TB');
        const right = this.createScene(media, 'TB', 1);

        // add device orientation controls, if we're on a mobile device
        if (!OMG_FKN_VR_BBQ && typeof window.orientation !== 'undefined') {
            //this.orientationControls = new DeviceOrientationControls(this.scenes[0].camera);
        }

        container.append(left.renderer.domElement);
        container.append(right.renderer.domElement);

        //add stats
        const stats = new Stats();

        stats.domElement.style.position = 'absolute';
        stats.domElement.style.top = '0px';
        stats.domElement.style.zIndex = 100;

        this.stats = stats;

        container.append(stats.domElement);

        const scenes = [left];

        if (OMG_FKN_VR_BBQ) {
            scenes.push(right);
        }

        this.scenes = scenes;
        this.isAnimating = true;
        this.animateScenes();
    },

    onremove() {
        this.isAnimating = false;
        this.scenes.forEach((scene) => {
            scene.texture.dispose();
            scene.material.dispose();
        });
    },

    createScene(media, inputLayout = STEREOSCOPIC_LAYOUTS.NONE, channel = 0) {
        const camera = new PerspectiveCamera(75, this.aspectRatio, 1, 1100);
        const texture = new VideoTexture(media);
        const geometry = new SphereGeometry(500, 60, 40);

        if (inputLayout !== STEREOSCOPIC_LAYOUTS.NONE) {
            const uvShift = channel === 0 ? 0.5 : 0;

            for (let i = 0; i < geometry.faceVertexUvs[0].length; i++) {
                for (let j = 0; j < 3; j++) {
                    const v = geometry.faceVertexUvs[0][i][j];

                    v.setY(v.y * 0.5 + uvShift);
                }
            }
            geometry.uvsNeedUpdate = true;
        }

        camera.target = new Vector3(0, 0, 0);
        geometry.scale(-1, 1, 1);
        texture.minFilter = LinearFilter;
        texture.format = RGBFormat;

        const material = new MeshBasicMaterial({ map: texture });
        const mesh = new Mesh(geometry, material);
        const scene = new Scene();
        const renderer = new WebGLRenderer();

        scene.add(mesh);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(this.width, this.height);
        renderer.domElement.draggable = true;

        // add wireframe mesh
        /*
        geometry = new SphereBufferGeometry(500, 60, 40);
        material = new MeshBasicMaterial({ color: 0xff00ff, side: BackSide, wireframe: true });
        mesh = new Mesh(geometry, material);

        scene.add(mesh);
        */

        return {
            renderer,
            scene,
            texture,
            mesh,
            material,
            camera,
            // debugMesh: mesh
        };
    },

    updateScenes() {
        const orientationControls = this.orientationControls;

        if (orientationControls) {
            orientationControls.update();
        } else {
            this.scenes.forEach((scene) => {
                const lat = Math.max(-85, Math.min(85, this.lat));
                const phi = ThreeMath.degToRad(90 - lat);
                const theta = ThreeMath.degToRad(this.lon);
                const camera = scene.camera;
                const distance = this.distance;

                this.lat = lat;

                camera.position.x = distance * Math.sin(phi) * Math.cos(theta);
                camera.position.y = distance * Math.cos(phi);
                camera.position.z = distance * Math.sin(phi) * Math.sin(theta);

                camera.lookAt(camera.target);
            });
        }
    },

    renderScenes() {
        this.scenes.forEach((scene) => {
            scene.renderer.render(scene.scene, scene.camera);
        });
    },

    animateScenes() {
        if (this.isAnimating) {
            requestAnimationFrame(this.animateScenes.bind(this));
            this.updateScenes();
            this.renderScenes();

            if (this.debug) {
                this.scenes.forEach((scene) => {
                    scene.stats.update();
                });
            }
        }
    },

    resize(attrs) {
        const { width, height } = attrs;

        this.scenes.forEach((scene) => {
            const { camera, renderer } = scene;

            camera.aspect = this.aspectRatio;
            camera.updateProjectionMatrix();

            renderer.setSize(
                OMG_FKN_VR_BBQ ? width / 2 : width,
                height
            );
        });
    },

    _onContextMenu(event) {
        if (!this.debug) {
            event.preventDefault;
        }
    },

    _onDrag(e) {
        if (e.clientX <= 0 && e.clientY <= 0) {
            return;
        }

        const last = this.lastClick;

        if (e.clientX - last.x || e.clientY - last.y) {
            this.lon = (last.x - e.clientX) * 0.17 + last.lon;
            this.lat = (last.y - e.clientY) * 0.2 + last.lat;
        }
    },

    _onDragStart(e) {
        /*
        if (typeof e.dataTransfer.setDragImage === 'function') {
            e.dataTransfer.setDragImage(TRANSPARENT_PIXEL_IMAGE, 1, 1);
        }
        */

        this.lastClick = {
            x: e.clientX,
            y: e.clientY,
            lon: this.lon,
            lat: this.lat
        };

        document.body.classList.add('media-player-is-dragging');
    },

    _onDragEnd() {
        document.body.classList.remove('media-player-is-dragging');
    },

    view(vnode) {
        const containerProps = {
            onclick: vnode.attrs.onTogglePlay.bind(this),
            oncontextmenu: this._onContextMenu.bind(this),
            ondrag: this._onDrag.bind(this),
            ondragstart: this._onDragStart.bind(this),
            ondragend: this._onDragEnd.bind(this)
        };
        return m('.viewer.vr', containerProps, [
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

export default VRViewer;
