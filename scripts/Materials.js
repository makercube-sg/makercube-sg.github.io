class Materials {
    static parse(cfg, toolbar) {
        var materials = new Object() // dictionary for materials
        Object.keys(cfg.fixed).forEach(materialCfgKey => { // create fixed materials
            const materialCfg = cfg.fixed[materialCfgKey];
            const material = this.createMaterial(materialCfg)
            materials[materialCfgKey] = material
        })
        Object.keys(cfg.configurable).forEach(materialCfgKey => { // create toggleable materials
            const materialCfg = cfg.configurable[materialCfgKey];
            const material = this.createMaterial(materialCfg)
            materials[materialCfgKey] = material
            // TODO: add to toolbar
            var rgbStr = material.color.getStyle() // rgb(x, y, z)
            if (material.transparent) {
                rgbStr = rgbStr
                    .replace(")", "," + material.opacity + ")")
                    .replace("rgb", "rgba")
            }
            toolbar.addColorPicker(material, materialCfg.displayName, rgbStr)
        })
        return materials
    }

    static createMaterial(cfg) { // takes json cfg specifying material properties and returns material
        const colorStr = "rgb(" + [cfg.r, cfg.g, cfg.b].join(", ") + ")"
        const baseColor = new THREE.Color(colorStr)
        var metalSpecular = new THREE.Color(colorStr)
        metalSpecular.offsetHSL(0, 0, 0.1)
        var plasticSpecular = new THREE.Color(colorStr)
        plasticSpecular.offsetHSL(0, 0, 0.01)

        var material = new THREE.MeshPhongMaterial({
            flatShading: false,
            color: new THREE.Color(colorStr),
            specular: cfg.metal ? metalSpecular: plasticSpecular,
            shininess: 100*(1-cfg.roughness),
            transparent: true,
            opacity: cfg.alpha ? cfg.alpha : 1
            // side: THREE.DoubleSide
        })
        material.isMetal = cfg.metal
        material.isTransparent = cfg.alpha ? true : false
        return material
   }
}
