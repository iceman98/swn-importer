import { Importer } from './importer';
import { Options } from './model/options';
import { Utils } from './utils';

export class ImportDialog extends FormApplication<FormApplication.Options, Options, Options> {

    static get defaultOptions(): FormApplication.Options {
        const defaults = super.defaultOptions;

        const overrides: Partial<FormApplication.Options> = {
            popOut: true,
            minimizable: true,
            resizable: true,
            height: 'auto',
            id: 'swn-importer-dialog',
            template: Utils.getTemplatePath("dialog.html"),
            title: Utils.getLabel("DIALOG-TITLE"),
            editable: true
        };

        const mergedOptions = mergeObject(defaults, <FormApplication.Options>overrides);

        return mergedOptions;
    }

    constructor(private importer: Importer) {
        super();
    }


    getData(): Options {
        return new Options();
    }

    async _updateObject(_: Event, formData?: Options): Promise<void> {
        const url = ImportDialog.getFileUrl();
        if (formData && url) {
            await this.close();
            this.importer.importFile(url, formData);
        }
    }

    private static getFileUrl(): string | null {
        const input = <HTMLInputElement>$('#swn-sector-file')[0];
        if (input.files?.length) {
            return URL.createObjectURL(<Blob>input.files.item(0));
        } else {
            return null;
        }
    }

}
