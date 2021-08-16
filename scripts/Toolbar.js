// shows drop down menus on mouseover
$(document).on({
    mouseenter: function () {
        $(this).find("div.dropdown-content").css("display", "block");
    },
    mouseleave: function () {
        $(this).find("div.dropdown-content").css("display", "none");
    }
}, "li.dropdown");

class Toolbar {
    static addSceneColorPicker(scene) {
        const id = "#colorPicker_" + Toolbar.guidGenerator()
        var dropdownEle = Toolbar.createDropdownElement("colorDrop", "Background")
        var colorpicker = document.createElement("input")
        colorpicker.id = id.replace("#","")
        dropdownEle.appendChild(colorpicker)
        const jqueryEle = $(id)

        var initialColor = ["rgb", scene.background.r, scene.background.g, scene.background.b].join(" ")

        jqueryEle.spectrum({
            type: "color",
            hideAfterPaletteSelect: true,
            showInput: true,
            showInitial: true,
            allowEmpty: false,
            move: colorMap =>  {
                scene.background.r = colorMap._r/255
                scene.background.g = colorMap._g/255
                scene.background.b = colorMap._b/255
                window.localStorage.setItem("Background", JSON.stringify(colorMap)) // update stored color in local storage
            }
        })

        // check if localstorage contains color for this material (key is display text)
        var storedColor = window.localStorage.getItem("Background")
        if (storedColor != null) {
            storedColor = JSON.parse(storedColor)
            // update color of background
            scene.background.r = storedColor._r/255
            scene.background.g = storedColor._g/255
            scene.background.b = storedColor._b/255
            jqueryEle.spectrum("set", 
                ["rgba", storedColor._r, storedColor._g, storedColor._b, storedColor._a]
                .join(" ")
            )
        } else {
            jqueryEle.spectrum("set", initialColor)
        }        
    }

    static addAssemblies(assemblies) {
        Object.keys(assemblies).forEach(assemblyName => {
            this.createDropdownElement("modelDrop", assemblyName, () => {
                model_viewer.unloadAssembly()
                model_viewer.loadAssembly(assemblies[assemblyName].assembly, assemblies[assemblyName].materials)
            })
        })
    }

    static addAboutButton() {
        document.getElementById("aboutBtn").onclick = () => {
            document.getElementById("overlay").style.display = "block"
            document.getElementById("overlayBg").style.display = "block"
        }
        document.getElementById("overlayBg").onclick = () => {
            document.getElementById("overlay").style.display = "none"
            document.getElementById("overlayBg").style.display = "none"
        }
    }

    static createDropdownElement(dropdown, text, fn) {
        const drop = document.getElementById(dropdown)
        var a = document.createElement("a")
        if (text) {
            var text = document.createTextNode(text)
            a.appendChild(text)
        }        
        if (fn) {
            a.onclick = fn
        }        
        drop.appendChild(a)
        return a;
    }

    static guidGenerator() {
        var S4 = function() {
           return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
        };
        return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
    }

    // manages toolbar entities that are specific to an assembly, allow for cleaner load and unload
    constructor() {
        this.toggles = []
        this.colorPickers = [] 
    }

    addModelToggle(model, displayText) {
        this.toggles.push(Toolbar.createDropdownElement("toggleDrop", displayText, () => {
            model.visible = !model.visible
        }))
    }

    removeModelToggle(ele) {
        ele.removeAttribute("onclick")
        ele.remove()
    }

    addColorPicker(material, displayText, initialColor) {
        const id = "#colorPicker_" + Toolbar.guidGenerator()
        var dropdownEle = Toolbar.createDropdownElement("colorDrop", displayText)
        var colorpicker = document.createElement("input")
        colorpicker.id = id.replace("#","")
        dropdownEle.appendChild(colorpicker)
        const jqueryEle = $(id)

        
        jqueryEle.spectrum({
            type: "color",
            hideAfterPaletteSelect: true,
            showInput: true,
            showInitial: true,
            allowEmpty: false,
            move: colorMap =>  {
                this.spectrumToMaterial(colorMap, material) // update color of material
                window.localStorage.setItem(displayText, JSON.stringify(colorMap)) // update stored color in local storage
            }
        })
        // check if localstorage contains color for this material (key is display text)
        var storedColor = window.localStorage.getItem(displayText)
        if (storedColor != null) {
            storedColor = JSON.parse(storedColor)
            jqueryEle.spectrum("set", 
                ["rgba", storedColor._r, storedColor._g, storedColor._b, storedColor._a]
                .join(" ")
            )
            this.spectrumToMaterial(storedColor, material) // update color of material
        } else {
            jqueryEle.spectrum("set", initialColor)
        }
        
        this.colorPickers.push(dropdownEle)
    }

    spectrumToMaterial(colorMap, material) { // applies spectrum color map to given material
        material.opacity = colorMap._a
        const color_style_str = "rgb(" + [
            Math.round(colorMap._r), 
            Math.round(colorMap._g), 
            Math.round(colorMap._b)
        ].join(",") + ")"   

        material.color.setStyle(color_style_str)
        if (!material.isMetal) material.specular.setStyle(color_style_str)
    }

    removeColorPicker(ele) {
        const colorPickerID = ele.getElementsByTagName("input")[0].id
        $("#" + colorPickerID).spectrum("destroy")
        ele.remove()
    }

    unload() {
        this.toggles.forEach(toggle => this.removeModelToggle(toggle))
        this.colorPickers.forEach(colorPicker => this.removeColorPicker(colorPicker))
    }

}