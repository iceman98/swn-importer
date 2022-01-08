import { TemplatePreloader } from "./module/helper/TemplatePreloader";
import { Importer } from './module/importer';
// import { Options } from './module/model/options';

let swnImporter: Importer;

Hooks.once("init", async () => {
    swnImporter = new Importer();
});

Hooks.once("ready", async () => {
    // Importer.removeExistingData();
    // swnImporter.importFile('/modules/swn-importer/test-alpha.json', new Options());
    // swnImporter.openImportDialog();
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