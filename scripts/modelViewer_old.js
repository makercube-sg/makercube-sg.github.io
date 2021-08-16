class modelViewer {
    constructor() {
        var scene = new xeogl.Scene({
            canvas: "modelViewCanvas",
            transparent: true // use webpage background
        });
        xeogl.setDefaultScene(scene)
        this.scene = scene
        this.createGround(0)
        this.setupCamera()
        this.setupLights()
        

        this.assemblies = []
        // this.loadMaterials(materialsJson)
        //     .then(this.loadAssembly(assemblyJson)
        //     .then(this.createGround(x, y, this.assembly.lowestModel)))
    }

    setupCamera() {
        this.camera = this.scene.camera
        this.camera.projection = "ortho" // ortho graphic projection
        this.camera.worldAxis = [ // set +Z axis as up
        -1, 0, 0, // Right
        0, 0, 1, // Up
        0, 1, 0  // Forward
        ]
        this.camera.up = [0, 0, 1]; // +Z is up
        // this.camera.look = [0, 8.25, 265]; // focal point
        // this.camera.eye = [0, -735, 350];
        this.camera.look = [0, 0, 325]
        this.camera.eye = [0, -1450, 325]
        this.ortho = this.camera.ortho
        this.ortho.scale = 1450
        this.cameraFlight = new xeogl.CameraFlightAnimation()
        this.cameraControl = new xeogl.CameraControl({
            intertia: 0.2
        }) 
        this.orbit = true
        const orbitFn = () => {
            if(this.orbit) this.camera.orbitYaw(-0.025)
        }
        this.scene.on("tick", orbitFn)
        
    }

    setupLights() {
        this.scene.clearLights()
        this.leftLight = new xeogl.DirLight({
            dir: [25, 20, -10],     // Direction the light is shining in
            color: [1, 1, 1],
            intensity: 1,
            space: "world",      // Other option is "world", for World-space
            shadow: true, 
            id: "left"
        });
        this.rightLight = new xeogl.DirLight({
            dir: [-25, 20, -10],     // Direction the light is shining in
            color: [1, 1, 1],
            intensity: 1,
            space: "world",      // Other option is "world", for World-space
            shadow: true, 
            id: "right"
        });
        this.backLight = new xeogl.DirLight({
            dir: [0, -10, -5],     // Direction the light is shining in
            color: [1, 1, 1],
            intensity: 1.4,
            space: "world",      // Other option is "world", for World-space
            shadow: true, 
            id: "back"
        });
        this.topLight = new xeogl.DirLight({
            dir: [0, 5, -50],     // Direction the light is shining in
            color: [1, 1, 1],
            intensity: 1.4,
            space: "world",      // Other option is "world", for World-space
            shadow: true, 
            id: "top"
        });
    }

    loadAssembly(assemblySrc, materialsSrc) {
        var promises = [assemblySrc, materialsSrc].map(src => fetch(src).then(resp => resp.json()))
        // async load both src then pass to Assembly to parse when ready
        Promise.allSettled(promises).then( fulfilled => {
            var parsed = Assembly.parse(fulfilled[0].value, fulfilled[1].value, this.ground.aabb[5])
            // Assembly returns [id, assemblyObject], to be stored at this.assemblies[id]
            this.assemblies.push(parsed[1])                
        })
    }

    unloadAssemblies() {
        var assembly = this.assemblies.pop()
        while(assembly) {
            assembly.unload()
            assembly = this.assemblies.pop()
        }
    }

    createGround(zPos) {
        this.ground = new xeogl.STLModel({
            src: "models/ground.stl",
            material: new xeogl.SpecularMaterial({
                diffuse: [0.1, 0.1, 0.1],
                specular: [0.1, 0.1, 0.1],
                glossiness: 0
            }),
            position: [0, 0, zPos],
            collidable: false,
            pickable: false
        });
        Toolbar.addDeskToggle(this.ground)
    }

    placeOnGround(assembly) { // modifies positions of all models in assembly such that they are "on" ground
        assembly.meta.lowestModel.on("loaded", () => {
            const topOfGround = this.ground.aabb[5]
            console.log(topOfGround)
            const bottomOfAssembly = assembly.meta.lowestModel.aabb[2]
            console.log(assembly.meta.lowestModel.aabb)
            const zMovement = topOfGround - bottomOfAssembly //if negative, assembly above ground hence move down
            // apply zmovement ot position of all models in assemnly
            console.log(zMovement)

            // Object.values(assembly.models).forEach(model => {
            //     console.log(model)
            //     model.position = [model.position[0], model.position[1], model.position[2] + zMovement]
            // }) 
        })        
    }

    // toggle visibility of given model key
    toggleModel(modelKey) {
        this.models.relatedModels[modelKey].visible = !this.models.relatedModels[modelKey].visible
    }

    // update color of given models to given rgbastring
    updateModelsColor(modelKeys, rgbaString) {
        var color = rgbaString.replace("rgba(", "").replace(")", "").split(",")
        const alpha = color.pop()
        const rgb = color.map(ele => ele/255)
        modelKeys.forEach(modelKey => {
            var material = this.models.relatedModels[modelKey]._material
            material.diffuse = rgb
            material.specular = rgb
            material.alpha = alpha
        })            
    }
    toggleOrbit() {
        this.orbit = !this.orbit      
    }
}