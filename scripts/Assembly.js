class Assembly { // for now, all assemblies are assumed to be centered on origin (X and Z directions). lowest point will be at Y = 0
    constructor(meta, models, toolbar) {
        this.meta = meta
        this.models = models
        this.toolbar = toolbar
    }

    unload() {
        this.toolbar.unload()
        Object.values(this.models).forEach(model => {
            model_viewer.scene.remove(model)
        })
    }

    static parse(assemblyCfg, materialsCfg) { // parses the Assembly cfg and returns an assembly (loads all models from assembly into scene)
        const metaCfg = assemblyCfg.meta
        const assemblyID = metaCfg.assemblyID
        const srcPath = metaCfg.srcPath
        const loadModels = assemblyCfg.models
        var toolbar = new Toolbar()
        var meta = new Object()
        meta.id = assemblyID
        meta.materials = Materials.parse(materialsCfg, toolbar)
        meta.height = metaCfg.height
        meta.width = metaCfg.width
        meta.depth = metaCfg.depth
        var models = new Object()

        const loader = new THREE.STLLoader() //THREE.GLTFLoader()
        var loaded = 0
        Object.keys(loadModels).forEach(modelKey => {
            const modelCfg = loadModels[modelKey]
            Assembly.loadSTL(loader, srcPath, modelCfg, modelKey, meta.materials, models, toolbar, () => loaded += 1)
            // TODO: add to toggle bar
        })
        // TODO: wait until all loaded before returning assembly
        return new Assembly(meta, models, toolbar)  
    }

    static loadGLTF(loader, srcPath, modelCfg, modelKey, materials, modelDict, toolbar, callback) { // loads a gltf model with given params, adding itself into the modelDict when loaded
        loader.load(srcPath + modelCfg.src, (gltf) => {
            console.log(gltf)
            const root = gltf.scene;
            root.rotation.order = 'YXZ'
            root.traverse((o) => {
                if (o.isMesh) o.material = materials[modelCfg.material]; // set material to given material
            });
            model_viewer.scene.add(root); // add to scene
            modelDict[modelKey] = root
            if (modelCfg.toggle) toolbar.addModelToggle(root, modelCfg.toggle)            
        });
    }

    static loadSTL(loader, srcPath, modelCfg, modelKey, materials, modelDict, toolbar, callback) { // loads a gltf model with given params, adding itself into the modelDict when loaded
        loader.load(srcPath + modelCfg.src, (geometry) => {
            const material = materials[modelCfg.material]
            const mesh = new THREE.Mesh(geometry, material)
            if (material.isTransparent) mesh.renderOrder = 1 // fixes rendering of "stacked" translucent/transparent models
            mesh.rotation.set(- Math.PI / 2, 0, 0 );
            mesh.rotation.order = 'YXZ'
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            model_viewer.scene.add(mesh); // add to scene
            modelDict[modelKey] = mesh
            if (modelCfg.toggle) toolbar.addModelToggle(mesh, modelCfg.toggle)            
        });
    }
}