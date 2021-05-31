import * as THREE from "./libs/three.module.js";
import { GLTFLoader } from "./libs/GLTFLoader.js";
import { RGBELoader } from "./libs/RGBELoader.js";
import { ARButton } from "./libs/ARButton.js";
import { LoadingBar } from "./libs/LoadingBar.js";
import { CanvasUI } from "./libs/CanvasUI.js";
import { Player } from "./libs/Player.js";
import { ControllerGestures } from "./libs/ControllerGestures.js";

class App {
    constructor() {
        const container = document.createElement("div");
        document.body.appendChild(container);

        this.clock = new THREE.Clock();

        this.BASE_URL = 'https://mobilitycoe.azurewebsites.net';

        this.loadingBar = new LoadingBar();
        this.loadingBar.visible = false;

        this.assetsPath = "./assets/";

        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.05,
            25
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
        // this.getListCategories();
        this.viewProductList();
        window.addEventListener("resize", this.resize.bind(this));

        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            this.isMobile = true;
        } else {
            this.isMobile = false;
        }
    }

    getListCategories() {
        const self = this;
        axios.get(self.BASE_URL + '/api/tblcategories')
            .then(function(response) {
                console.log(response);
                self.listCategory = response.data;

            })
            .catch(function(error) {
                console.log(error);
            })
            .then(function() {
                self.viewListCategories(self.listCategory);
            });
    }

    viewListCategories(listCategory) {
        let categoryTab = document.getElementById('myTab');
        let categorySideTab = document.getElementById('myList');
        if (listCategory) {
            for (let i = 0; i < listCategory.length; i++) {
                let item = listCategory[i].name;
                console.log(item.toLowerCase());
                let link = '#' + item.toLowerCase();
                let node = document.createElement("li");
                let subnode = document.createElement("a");
                subnode.setAttribute('class', 'nav-link');
                subnode.setAttribute('data-toggle', 'tab');
                subnode.setAttribute('href', link);
                subnode.appendChild(document.createTextNode(item));
                node.appendChild(subnode);
                categoryTab.appendChild(node);

                subnode = document.createElement("a");
                subnode.setAttribute('class', 'list-group-item');
                subnode.setAttribute('href', link);
                subnode.appendChild(document.createTextNode(item));
                categorySideTab.appendChild(subnode);
            }

        }

    }

    viewProductList() {
        let prodlist = JSON.parse(plist);
        for (let key in prodlist) {
            console.log(prodlist[key]);
            console.log("test");
        }

    }

    /* creating the UI */
    createUI() {
            const self = this;

            function onPink() {
                const msg = "pink pressed";
                console.log(msg);
                self.applyTexture(false, 'rgb(238, 130, 238)');
            }

            function onYellow() {
                const msg = "yello pressed";
                console.log(msg);
                self.applyTexture(false, 'rgb(255, 160, 122)');
            }

            function onGreen() {
                const msg = "green pressed";
                console.log(msg);
                self.applyTexture(false, 'rgb(152, 251, 152)');
            }

            function onContinue() {
                const session = self.renderer.xr.getSession();
                session.end();
                window.location.reload();
            }

            const config = {
                panelSize: { width: 0.7, height: 2.5 },
                height: 600,
                body: { backgroundColor: "#fffff000" },
                label: { type: "text", position: { top: 100, left: 0 }, width: 350, height: 70, fontSize: 40, fontColor: "#000000" },
                pink: { type: "button", borderRadius: 30, position: { top: 180, left: 0 }, width: 200, height: 60, fontSize: 50, fontColor: "#000", backgroundColor: "#ee82ee", hover: "#E194C8", onSelect: onPink },
                yellow: { type: "button", borderRadius: 30, position: { top: 250, left: 0 }, width: 200, height: 60, fontSize: 45, fontColor: "#000", backgroundColor: "#FFA07A", hover: "#FFD784", onSelect: onYellow },
                green: { type: "button", borderRadius: 30, position: { top: 320, left: 0 }, width: 200, height: 60, fontSize: 45, fontColor: "#000", backgroundColor: "#98FB98", hover: "#2EB157", onSelect: onGreen },
                exit: { type: "button", borderRadius: 30, position: { top: 0, left: 0 }, width: 300, height: 50, fontSize: 40, fontColor: "#000", backgroundColor: "#1bf", hover: "#3df", onSelect: onContinue },
                renderer: this.renderer
            }
            const content = {
                label: "COLOR",
                pink: "",
                yellow: "",
                green: "",
                exit: "Exit AR"
            }
            this.ui = new CanvasUI(content, config);
        }
        /* end of canvasUI */
    applyTexture(isTexture, hcolor) {
        var mat;
        var geo;
        const self = this;
        self.objgltf.traverse(function(object) {
            if ((object instanceof THREE.Mesh)) {
                if (!isTexture) {
                    mat = object.material;
                    //mat.map = null;
                    object.material = new THREE.MeshPhongMaterial({ map: mat.map, color: hcolor });
                    object.material.needsUpdate = true;
                } else {
                    var textureLoader = new THREE.TextureLoader();
                    var texture = textureLoader.load('./assets/d025.jpg');
                    texture.encoding = THREE.sRGBEncoding;
                    texture.flipY = false;
                    mat = object.material;
                    geo = object.geometry;
                    mat.map = texture;
                }
            }
        });
    }
    setupXR() {
        this.renderer.xr.enabled = true;

        if ("xr" in navigator) {
            navigator.xr.isSessionSupported("immersive-ar").then((supported) => {
                if (supported && this.isMobile) {
                    const collection = document.getElementsByClassName("ar-button");
                    [...collection].forEach((el) => {
                        el.style.display = "block";
                    });
                } else {
                    const collection = document.getElementsByClassName("web-button");
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

        // gestures
        this.gestures = new ControllerGestures(this.renderer);
        this.gestures.addEventListener("tap", (ev) => {
            console.log("tap");
            if (!self.knight.object.visible) {
                self.knight.object.visible = true;
                self.knight.object.position.set(0, -0.3, -0.5).add(ev.position);
                self.scene.add(self.knight.object);
            }
        });
        /* this.gestures.addEventListener("doubletap", (ev) => {
             console.log("doubletap");
         });
         this.gestures.addEventListener("press", (ev) => {
             console.log("press");
         });*/

        this.gestures.addEventListener('pan', (ev) => {
            if (ev.initialise !== undefined) {
                self.startPosition = self.knight.object.position.clone();
            } else {
                const pos = self.startPosition.clone().add(ev.delta.multiplyScalar(3));
                self.knight.object.position.copy(pos);
            }
        });

        /*this.gestures.addEventListener("swipe", (ev) => {
            console.log(ev + "swipe");
            if (self.knight.object.visible) {
                self.knight.object.visible = false;
                self.scene.remove(self.knight.object);
            }
        });*/

        this.gestures.addEventListener('pinch', (ev) => {
            // console.log(ev + "pinch");
            if (ev.initialise !== undefined) {
                self.startScale = self.knight.object.scale.clone();
            } else {
                const scale = self.startScale.clone().multiplyScalar(ev.scale);
                self.knight.object.scale.copy(scale);
            }
        });
        this.gestures.addEventListener('rotate', (ev) => {
            //console.log(ev + "rotate");
            if (ev.initialise !== undefined) {
                self.startQuaternion = self.knight.object.quaternion.clone();
            } else {
                self.knight.object.quaternion.copy(self.startQuaternion);
                self.knight.object.rotateY(ev.theta);
            }
        });
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


    show3dObject(id, isTextureAvl, isTexture, hcolor, sscale, name) {
            const prodItem = { 'id': id, 'sscale': sscale, "Name": name };
            sessionStorage.setItem("data", JSON.stringify(prodItem));
            window.location.href = './productdetails.html'
        }
        /* is the function which loads the 3D object */
    showARObject(id, isTextureAvl, isTexture, hcolor, sscale) {
        this.initAR();
        var mat;
        var geo;
        const loader = new GLTFLoader().setPath(this.assetsPath);
        const self = this;

        this.loadingBar.visible = true;

        // Load a glTF resource
        loader.load(
            // resource URL
            //`chair${id}.glb`,
            `${id}.glb`,

            // called when the resource is loaded
            function(gltf) {

                const object = gltf.scene;
                self.objgltf = object;
                const options = {
                    object: object,
                    speed: 0.5,
                    animations: gltf.animations,
                    clip: gltf.animations[0],
                    app: self,
                    name: "knight",
                    npc: false,
                };

                self.knight = new Player(options);
                self.knight.object.visible = false;

                // if (!id.includes('chair')) {
                //     const scale = 0.002;
                //     gltf.scene.scale.set(scale, scale, scale);
                // }
                if (sscale !== '') {
                    gltf.scene.scale.set(sscale, sscale, sscale);
                }
                var textureLoader = new THREE.TextureLoader();

                var texture = textureLoader.load('./assets/d025.jpg');

                texture.encoding = THREE.sRGBEncoding;

                texture.flipY = false;

                if (isTextureAvl) {
                    gltf.scene.traverse(function(object) {
                        if ((object instanceof THREE.Mesh)) {
                            if (!isTexture) {
                                mat = object.material;
                                object.material = new THREE.MeshPhongMaterial({ map: mat.map, color: hcolor })
                            } else {
                                mat = object.material;
                                geo = object.geometry;
                                mat.map = texture;
                            }
                        }
                    });
                }

                self.scene.add(gltf.scene);
                self.chair = gltf.scene;

                self.chair.visible = false;

                self.loadingBar.visible = false;

                self.renderer.setAnimationLoop(self.render.bind(self));
            },
            // called while loading is progressing
            function(xhr) {
                self.loadingBar.progress = xhr.loaded / xhr.total;
            },
            // called when loading has errors
            function(error) {
                console.log("An error happened");
            }
        );
        // calling the canvas
        this.createUI();
        this.gestureHandling();
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
            self.ui.mesh.position.set(-0.25, -0.5, -1.75);
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

        session.requestReferenceSpace("viewer").then(function(referenceSpace) {
            session
                .requestHitTestSource({ space: referenceSpace })
                .then(function(source) {
                    self.hitTestSource = source;
                });
        });

        session.addEventListener("end", function() {
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

        const dt = this.clock.getDelta();
        if (this.renderer.xr.isPresenting) {
            this.gestures.update();
            this.ui.update();
        }
        if (this.knight !== undefined) this.knight.update(dt);
        this.renderer.render(this.scene, this.camera);
    }
}

export { App };