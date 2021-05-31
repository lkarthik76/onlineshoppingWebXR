import * as THREE from "./libs/three.module.js";
import { GLTFLoader } from "./libs/GLTFLoader.js";
import { LoadingBar } from "./libs/LoadingBar.js";
import { RGBELoader } from "./libs/RGBELoader.js";
import { OrbitControls } from './libs/OrbitControls.js';


class Prod {
    constructor() {

        const item = sessionStorage.getItem('data');
        this.productitem = JSON.parse(item);
        console.log(this.productitem);
        console.log(this.productitem.id);
        const canvas = document.querySelector('#renderCanvas');;

        this.colors = [{
            texture: './assets/d025.jpg',
            size: [2, 2, 2],
            shininess: 60
        }, {
            texture: './assets/wood_.jpg',
            size: [2, 2, 2],
            shininess: 60
        }, {
            texture: './assets/denim_.jpg',
            size: [2, 2, 2],
            shininess: 60
        }, {
            texture: './assets/fabric_.jpg',
            size: [2, 2, 2],
            shininess: 60
        }, {
            texture: './assets/pattern_.jpg',
            size: [2, 2, 2],
            shininess: 60
        }, {
            color: '131417'
        }, {
            color: '374047'
        }, {
            color: '5f6e78'
        }];
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(0, 4, 14);

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xaaaaaa);

        const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 0.5);
        this.scene.add(ambient);

        const light = new THREE.DirectionalLight(0xFFFFFF, 1.5);
        light.position.set(0.2, 1, 1);
        this.scene.add(light);

        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.physicallyCorrectLights = true;
        // document.body.appendChild(this.renderer.domElement);

        this.setEnvironment();

        this.loadingBar = new LoadingBar();

        this.loadGLTF(this.productitem.id, this.productitem.sscale);
        this.buildColors();
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 3.5, 0);
        this.controls.update();
        if (this.productitem.Name) {
            document.getElementById("productname").innerText = this.productitem.Name;
        }
        window.addEventListener('resize', this.resize.bind(this));
    }
    setEnvironment() {
        const loader = new RGBELoader().setDataType(THREE.UnsignedByteType);
        const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        pmremGenerator.compileEquirectangularShader();

        const self = this;

        loader.load(
            "./assets/venice_sunset_1k.hdr",
            (texture) => {
                const envMap = pmremGenerator.fromEquirectangular(texture).texture;
                pmremGenerator.dispose();

                self.scene.environment = envMap;
            },
            undefined,
            (err) => {
                console.error("An error occurred setting the environment");
            }
        );
    }

    buildColors() {

        const self = this;

        const TRAY = document.getElementById('js-tray-slide');
        console.log(typeof(self.colors));
        for (let [i, color] of self.colors.entries()) {
            let swatch = document.createElement('div');
            swatch.classList.add('tray__swatch');

            if (color.texture) {
                swatch.style.backgroundImage = "url(" + color.texture + ")";
            } else {
                swatch.style.background = "#" + color.color;
            }

            swatch.setAttribute('data-key', i);
            TRAY.append(swatch);
        }
        const swatches = document.querySelectorAll(".tray__swatch");
        for (const swatch of swatches) {
            swatch.addEventListener('click', event => {
                let color = this.colors[event.target.dataset.key];
                console.log(color);
                let new_mtl;
                if (color.texture) {
                    let txt = new THREE.TextureLoader().load(color.texture);
                    txt.repeat.set(color.size[0], color.size[1], color.size[2]);
                    txt.wrapS = THREE.RepeatWrapping;
                    txt.wrapT = THREE.RepeatWrapping;
                    new_mtl = new THREE.MeshPhongMaterial({
                        map: txt,
                        shininess: color.shininess ? color.shininess : 10
                    });
                } else {
                    new_mtl = new THREE.MeshPhongMaterial({
                        color: parseInt('0x' + color.color),
                        shininess: color.shininess ? color.shininess : 60
                    });
                }
                this.setMaterial(this.chair, new_mtl);
            });
        }
    }

    setMaterial(parent, mtl) {
        parent.traverse(o => {
            if (o.isMesh != null) {
                o.material = mtl;
                o.material.side = THREE.DoubleSide;
            }
        });
    }
    loadGLTF(id, lscale) {
        const loader = new GLTFLoader().setPath('./assets/');
        const self = this;

        // Load a glTF resource
        loader.load(
            // resource URL
            `${id}.glb`,
            // called when the resource is loaded
            function(gltf) {
                const bbox = new THREE.Box3().setFromObject(gltf.scene);
                console.log(`min:${bbox.min.x.toFixed(2)},${bbox.min.y.toFixed(2)},${bbox.min.z.toFixed(2)} -  max:${bbox.max.x.toFixed(2)},${bbox.max.y.toFixed(2)},${bbox.max.z.toFixed(2)}`);

                let txt = new THREE.TextureLoader().load('./assets/d025.jpg');
                let new_mtl = new THREE.MeshPhongMaterial({
                    map: txt
                });

                gltf.scene.traverse((child) => {
                    if (child.isMesh) {
                        child.material.metalness = 0.2;
                        child.material = new_mtl;
                        child.material.side = THREE.DoubleSide;
                    }
                })
                self.chair = gltf.scene;

                gltf.scene.scale.set(lscale, lscale, lscale);

                self.scene.add(gltf.scene);

                self.loadingBar.visible = false;

                self.renderer.setAnimationLoop(self.render.bind(self));
            },
            // called while loading is progressing
            function(xhr) {

                self.loadingBar.progress = (xhr.loaded / xhr.total);

            },
            // called when loading has errors
            function(error) {

                console.log('An error happened');

            }
        );
    }
    resize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        var width = window.innerWidth;
        var height = window.innerHeight;
        var canvasPixelWidth = canvas.width / window.devicePixelRatio;
        var canvasPixelHeight = canvas.height / window.devicePixelRatio;

        const needResize = canvasPixelWidth !== width || canvasPixelHeight !== height;
        if (needResize) {

            renderer.setSize(width, height, false);
        }
        return needResize;
    }

    render() {
        // this.chair.rotateY(0.01);
        this.renderer.render(this.scene, this.camera);

        if (this.resizeRendererToDisplaySize(this.renderer)) {
            const canvas = this.renderer.domElement;
            this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
            this.camera.updateProjectionMatrix();
        }

    }
}
export { Prod };