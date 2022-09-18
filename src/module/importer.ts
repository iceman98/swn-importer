import { Constants } from './constants';
import { ImportDialog } from './import-dialog';
import { Options } from './model/options';
import { SectorData } from './model/sector-data';
import { SectorLoader } from './sector-loader';
import { Utils } from './utils';

export class Importer {

    private dialog: ImportDialog;

    constructor() {
        this.dialog = new ImportDialog(this);
    }

    // TODO: remove!
    static removeExistingData() {
        if ((<any>game).user?.isGM) {
            Folders.instance?.filter(f => Utils.getIdFlag(f) !== undefined).forEach(f => f.delete());
            Journal.instance?.filter(j => Utils.getIdFlag(j) !== undefined).forEach(j => j.delete());
            Scenes.instance?.filter(s => Utils.getIdFlag(s) !== undefined).forEach(s => s.delete());
        }
    }

    // TODO: remove!
    openImportDialog(): void {
        this.dialog.render(true);
    }

    /**
     * Attach the import button on the scene directory panel
     * @param sceneDirectory The jquery object of the SceneDirectory
     */
    initUI(sceneDirectory: JQuery) {
        if ((<any>game).user?.isGM) {
            const content = `
                <button id='swn-import-button' title='${Utils.getLabel("IMPORT-BUTTON-TOOLTIP")}'>
                    <i class='fas fa-cloud-download-alt'></i>
                    ${Utils.getLabel("IMPORT-BUTTON-NAME")}
                </button>
            `;
            sceneDirectory.find('.header-actions').append(content);
            sceneDirectory.on('click', '#swn-import-button', _ => this.openImportDialog());
        }
    }

    /**
     * Imports a sector file into Foundry, creating journals and a scene and showing a result dialog
     * @param fileName The sector file path
     * @param options The import options
     */
    async importFile(fileName: string, options: Options): Promise<void> {
        const start = new Date();

        if ((<any>game).user?.isGM) {
            try {
                const importedData: SectorData = await (await fetch(fileName)).json();

                const loader = new SectorLoader(importedData, options);
                const result = await loader.import();

                let journals = 0;
                result.nodeMap.forEach(node => {
                    if (node.journal) {
                        journals++;
                    }
                })

                const name = result.root.entity.name;
                const time = (new Date()).getTime() - start.getTime();

                new Dialog({
                    title: Utils.getLabel("RESULT-DIALOG-TITLE"),
                    content: Utils.formatLabel("RESULT-DIALOG-CONTENT", { sectorName: name, journals, time }),
                    buttons: {
                        ok: {
                            icon: '<i class="fas fa-check"></i>',
                            label: Utils.getLabel("ACCEPT-BUTTON")
                        }
                    },
                    default: "ok"
                }).render(true);
            } catch (e) {
                console.log(e);
                new Dialog({
                    title: Utils.getLabel("RESULT-DIALOG-TITLE"),
                    content: <string>e,
                    buttons: {
                        ok: {
                            icon: '<i class="fas fa-check"></i>',
                            label: Utils.getLabel("ACCEPT-BUTTON")
                        }
                    },
                    default: "ok"
                }).render(true);
            }
        }
    }

    /**
     * Register the handlebars partials
     */
    async registerPartials() {
        const templates = await loadTemplates(Constants.PARTIALS.map(t => Utils.getTemplatePath(t + ".html")));
        Constants.PARTIALS.forEach((name, index) => {
            Handlebars.registerPartial(name, templates[index]);
        })
    }
}