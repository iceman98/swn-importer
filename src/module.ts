import { TemplatePreloader } from "./module/helper/TemplatePreloader";
import { Importer } from './module/importer';

let swnImporter: Importer;

Hooks.once("init", async () => {
    console.log("=============================HMR============================")
    CONFIG.debug.hooks = true;
    swnImporter = new Importer();
});

Hooks.once("ready", async () => {
    //new Importer('/modules/swn-importer/acheron-rho.json').importFile();
    //swnImporter.openImportDialog();
});

Hooks.on("renderSceneDirectory", function (_, html: JQuery) {
    swnImporter.initUI(html);
});

if (process.env.NODE_ENV === "development") {
    if (module.hot) {
        module.hot.accept();

        if (module.hot.status() === "apply") {
            for (const template in _templateCache) {
                if (Object.prototype.hasOwnProperty.call(_templateCache, template)) {
                    delete _templateCache[template];
                }
            }

            TemplatePreloader.preloadHandlebarsTemplates().then(() => {
                for (const application in ui.windows) {
                    if (Object.prototype.hasOwnProperty.call(ui.windows, application)) {
                        ui.windows[application].render(true);
                    }
                }
            });
        }
    }
}