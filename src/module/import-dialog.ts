import { Importer } from './importer';

export class ImportDialog extends Application {

    private state: any;

    static get defaultOptions(): Application.Options {
        const defaults = super.defaultOptions;

        const overrides = {
            popOut: true,
            minimizable: true,
            resizable: true,
            height: 'auto',
            id: 'swn-importer-dialog',
            template: "modules/swn-importer/templates/dialog.html",
            title: 'Import Sector Without Numbers sector'
        };

        const mergedOptions = mergeObject(defaults, <Application.Options>overrides);

        return mergedOptions;
    }

    constructor(private importer: Importer) {
        super();
        this.initializeState();
    }

    initializeState() {
        this.state = { importEnabled: false };
    }

    getData(): any {
        return this.state;
    }

    activateListeners(html: JQuery): void {
        const input = <HTMLInputElement>html.find("#swn-importer-file-input")[0];
        const accept = <HTMLButtonElement>html.find("#swn-importer-import-button")[0];

        html.on("change", "#swn-importer-file-input", _ => {
            const files = input.files;
            if (files?.length) {
                accept.removeAttribute("disabled");
            } else {
                accept.setAttribute("disabled", "disabled");
            }
        });

        html.on("click", "#swn-importer-import-button", _ => {
            const url = URL.createObjectURL(input.files?.item(0));
            const options = {};
            this.importer.importFile(url, options);
            this.close();
        });

        html.on("click", "#swn-importer-cancel-button", _ => {
            this.close();
        });
    }

}
