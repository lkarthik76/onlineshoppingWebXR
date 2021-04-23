import * as THREE from "./libs/three.module.js";
import { GLTFLoader } from "./libs/GLTFLoader.js";
import { RGBELoader } from "./libs/RGBELoader.js";
import { ARButton } from "./libs/ARButton.js";
import { LoadingBar } from "./libs/LoadingBar.js";
import { CanvasUI } from "./libs/CanvasUI.js";

class App {
    constructor() {
        const container = document.createElement("div");
        document.body.appendChild(container);

        this.loadingBar = new LoadingBar();
        this.loadingBar.visible = false;

        this.assetsPath = "./assets/";

        this.camera = new THREE.PerspectiveCamera(
            70,
            window.innerWidth / window.innerHeight,
            0.01,
            20
        );
        this.camera.position.set(0, 1.6, 0);

        this.scene = new THREE.Scene();

        const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        ambient.position.set(0.5, 1, 0.25);
        this.scene.add(ambient);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        container.appendChild(this.renderer.domElement);
        this.setEnvironment();

        this.reticle = new THREE.Mesh(
            new THREE.RingBufferGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
            new THREE.MeshBasicMaterial()
        );

        this.reticle.matrixAutoUpdate = false;
        this.reticle.visible = false;
        this.scene.add(this.reticle);

        this.setupXR();

        window.addEventListener("resize", this.resize.bind(this));
    }
    /* creating the UI */

    createUI() {
        const self = this;

        function onPrev() {
            const session = self.renderer.xr.getSession();
            session.end();
            session = null;
            //window.location.reload();
        }

        /* function onStop(){
                const msg = "Stop pressed";
                console.log(msg);
                self.ui.updateElement( "info", msg );
            }
            
            function onNext(){
                const msg = "Next pressed";
                console.log(msg);
                self.ui.updateElement( "info", msg );
            }
            
            function onContinue(){
                const msg = "Continue pressed";
                console.log(msg);
                self.ui.updateElement( "info", msg );
            }*/

        const config = {
            panelSize: { width: 1, height: 0.25 },
            height: 64,
            //info: { type: "text", position:{ left: 6, top: 6 }, width: 500, height: 58, backgroundColor: "#aaa", fontColor: "#000" },
            prev: {
                type: "button",
                position: { top: 10, left: 10 },
                width: 500,
                fontColor: "#bb0",
                hover: "#ff0",
                onSelect: onPrev,
            },
            // stop: { type: "button", position:{ top: 64, left: 64 }, width: 64, fontColor: "#bb0", hover: "#ff0", onSelect: onStop },
            //next: { type: "button", position:{ top: 64, left: 128 }, width: 64, fontColor: "#bb0", hover: "#ff0", onSelect: onNext },
            // continue: { type: "button", position:{ top: 70, right: 10 }, width: 200, height: 52, fontColor: "#fff", backgroundColor: "#1bf", hover: "#3df", onSelect: onContinue },
            renderer: this.renderer,
        };
        const content = {
            //info: "",
            //prev: "<path>M 10 32 L 54 10 L 54 54 Z</path>",
            //stop: "<path>M 50 15 L 15 15 L 15 50 L 50 50 Z<path>",
            // next: "<path>M 54 32 L 10 10 L 10 54 Z</path>",
            //continue: "Continue"
            prev: "exit AR View"
        };
        this.ui = new CanvasUI(content, config);
    }
    /* end of canvasUI */

    setupXR() {
        this.renderer.xr.enabled = true;

        if ("xr" in navigator) {
            navigator.xr.isSessionSupported("immersive-ar").then((supported) => {
                if (supported) {
                    const collection = document.getElementsByClassName("ar-button");
                    [...collection].forEach((el) => {
                        el.style.display = "block";
                    });
                }
            });
        }

        const self = this;

        this.hitTestSourceRequested = false;
        this.hitTestSource = null;

        function onSelect() {
            
            if (self.chair === undefined) return;

            if (self.reticle.visible) {
                self.chair.position.setFromMatrixPosition(self.reticle.matrix);
                self.chair.visible = true;
            }
        }

        this.controller = this.renderer.xr.getController(0);
        this.controller.addEventListener("select", onSelect);

        this.scene.add(this.controller);
    }

    resize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
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
    /* is the function which loads the 3D object */
    showChair(id) {
        this.initAR();

        const loader = new GLTFLoader().setPath(this.assetsPath);
        const self = this;

        this.loadingBar.visible = true;

        // Load a glTF resource
        loader.load(
            // resource URL
            //`chair${id}.glb`,
            `${id}.glb`,

            // called when the resource is loaded
            function (gltf) {
                self.scene.add(gltf.scene);
                self.chair = gltf.scene;

                self.chair.visible = false;

                self.loadingBar.visible = false;

                self.renderer.setAnimationLoop(self.render.bind(self));
            },
            // called while loading is progressing
            function (xhr) {
                self.loadingBar.progress = xhr.loaded / xhr.total;
            },
            // called when loading has errors
            function (error) {
                console.log("An error happened");
            }
        );
        // calling the canvas
        this.createUI();
    }

    initAR() {
        let currentSession = null;
        const self = this;

        const sessionInit = { requiredFeatures: ["hit-test"] };

        function onSessionStarted(session) {
            session.addEventListener("end", onSessionEnded);

            self.renderer.xr.setReferenceSpaceType("local");
            self.renderer.xr.setSession(session);

            currentSession = session;
            self.ui.mesh.position.set(0, 1, -3);
            self.scene.add(self.ui.mesh);
        }

        function onSessionEnded() {
            currentSession.removeEventListener("end", onSessionEnded);

            currentSession = null;

            if (self.chair !== null) {
                self.scene.remove(self.chair);
                self.chair = null;
            }

            self.renderer.setAnimationLoop(null);
            self.scene.remove(self.ui.mesh);
        }

        if (currentSession === null) {
            navigator.xr
                .requestSession("immersive-ar", sessionInit)
                .then(onSessionStarted);
        } else {
            currentSession.end();
        }
    }

    requestHitTestSource() {
        const self = this;

        const session = this.renderer.xr.getSession();

        session.requestReferenceSpace("viewer").then(function (referenceSpace) {
            session
                .requestHitTestSource({ space: referenceSpace })
                .then(function (source) {
                    self.hitTestSource = source;
                });
        });

        session.addEventListener("end", function () {
            self.hitTestSourceRequested = false;
            self.hitTestSource = null;
            self.referenceSpace = null;
        });

        this.hitTestSourceRequested = true;
    }

    getHitTestResults(frame) {
        const hitTestResults = frame.getHitTestResults(this.hitTestSource);

        if (hitTestResults.length) {
            const referenceSpace = this.renderer.xr.getReferenceSpace();
            const hit = hitTestResults[0];
            const pose = hit.getPose(referenceSpace);

            this.reticle.visible = true;
            this.reticle.matrix.fromArray(pose.transform.matrix);
        } else {
            this.reticle.visible = false;
        }
    }

    render(timestamp, frame) {
        if (frame) {
            if (this.hitTestSourceRequested === false) this.requestHitTestSource();

            if (this.hitTestSource) this.getHitTestResults(frame);
        }

        this.renderer.render(this.scene, this.camera);
        this.ui.update();
    }
}

export { App };
