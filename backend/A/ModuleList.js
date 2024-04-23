class ModuleList {
    static modules = {
        'command': require("../Modulse/command"),
        'loger': require("../Modulse/loger"),
        'text': require("../Modulse/text"),
        'question': require("../Modulse/question"),
        'textMassage': require("../Modulse/textMassage"),
    };

    static get(moduleId) {
        return ModuleList.modules[moduleId];
    }

}

module.exports = ModuleList;


