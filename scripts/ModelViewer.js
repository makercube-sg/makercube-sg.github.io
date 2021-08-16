class ModelViewer {
    constructor() {
        this.canvas = document.getElementById("ModelViewerCanvas")

        this.initiateRenderer()
        this.initiateCamera()
        this.initiateControls()
        this.initiateScene()

        const axesHelper = new THREE.AxesHelper(250);
        this.scene.add( axesHelper );

        this.loading = false
        this.assemblies = []

        this.basePlastic = new THREE.MeshStandardMaterial({
            color: 0x0000ff,
            metalness: 0.5
        });

        const render = () => {
            this.renderer.render(this.scene, this.camera);
            requestAnimationFrame(render);
        }
        requestAnimationFrame(render);
    }

    resizeRendererToDisplaySize() {
        const renderer = this.renderer
        const canvas = renderer.domElement;
        const pixelRatio = window.devicePixelRatio;
        const width  = canvas.clientWidth  * pixelRatio | 0;
        const height = canvas.clientHeight * pixelRatio | 0;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            renderer.setSize(width, height, false);
            this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
            this.camera.updateProjectionMatrix();
        }
        return needResize;
    }

    initiateRenderer() {
        var canvas = $('#ModelViewerCanvas');
        canvas.css("width", $(window).width());
        canvas.css("height", $(window).height());
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true
        })
        this.renderer.toneMapping = THREE.CineonToneMapping
        this.renderer.toneMappingExposure = 1.0
        this.renderer.setPixelRatio( window.devicePixelRatio);
        const width  = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        this.renderer.setSize(width , height, false);
        this.renderer.outputEncoding = THREE.sRGBEncoding; // for gltf
    }

    initiateCamera() {
        this.camera = new THREE.PerspectiveCamera(45, this.canvas.clientWidth / this.canvas.clientHeight, 100, 1500)
    }

    initiateControls() {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement)
        this.controls.maxDistance = 1000
        this.controls.update()
    }

    initiateScene() {
        this.scene = new THREE.Scene()
        this.scene.background = new THREE.Color('white')
        const pmremGenerator = new THREE.PMREMGenerator( this.renderer );
        this.scene.environment =
          pmremGenerator.fromScene( new THREE.RoomEnvironment(), 0.04 ).texture;
        Toolbar.addSceneColorPicker(this.scene)
    }

    initiateSpotlights(xLen, yMax, zLen) { // object centered on x and z

        const midY = yMax / 2
        const zMax = zLen / 2
        const xMax = xLen / 2

        const spotTop = new THREE.PointLight( 0xffffff, 1, 0 );
        spotTop.position.set(0, yMax + midY, 0)
        this.scene.add(spotTop)

        const spotBack = new THREE.PointLight( 0xffffff, 1, 0 );
        spotBack.position.set(0, midY, -(zMax + zLen))
        this.scene.add(spotBack)

        const spotLeft = new THREE.PointLight( 0xffffff, 1, 0 );
        spotLeft.position.set(-(xMax + xLen), midY, zMax)
        this.scene.add(spotLeft)

        const spotRight = new THREE.PointLight( 0xffffff, 1, 0 );
        spotRight.position.set(xMax + xLen, midY, zMax)
        this.scene.add(spotRight)

        const spotBottom = new THREE.PointLight( 0xffffff, 1, 0 );
        spotBottom.position.set(0, - (yMax), 0)
        this.scene.add(spotBottom)

        this.activeLights = [spotBack, spotLeft, spotRight, spotBottom]
    }

    frameAssembly(yMax, zLen) {
        //tan(45deg) = 0.414 * camera distance from front of model = 1/2 height
        // cam distance from front of model = (0.5*height) / 0.414
        const camZFromModelFront = 0.5 * yMax / 0.414
        const camZ = camZFromModelFront * 1.25 + zLen / 2
        const camY = yMax / 2
        const camX = 0
        this.camera.position.set(camX, camY, camZ)
        const lookAtVector = new THREE.Vector3(0, camY, 0)
        this.camera.lookAt(lookAtVector)
        this.camera.far = 3 * zLen + 500
        this.camera.updateProjectionMatrix();
        this.controls.target = lookAtVector
        this.controls.maxDistance = 3 * zLen
        this.controls.update()
        // camera height is height/2
        // focus point and control target is (0, height/2, 0)
    }

    loadAssembly(assemblySrc, materialsSrc) {
        var promises = [assemblySrc, materialsSrc].map(src => fetch(src).then(resp => resp.json()))
        // wait for both assembly json and materials json to be fetched
        Promise.allSettled(promises).then( fulfilled => {
            var assembly = Assembly.parse(fulfilled[0].value, fulfilled[1].value) // pass assembly and material cfg objects to relevant parsers
            this.assemblies.push(assembly)
            this.initiateSpotlights(assembly.meta.width, assembly.meta.height, assembly.meta.depth)
            this.frameAssembly(assembly.meta.height, assembly.meta.depth)
        })
    }

    unloadAssembly() {
        const assembly = this.assemblies.pop()
        assembly.unload()
        this.activeLights.forEach(light => this.scene.remove(light))
    }
}
