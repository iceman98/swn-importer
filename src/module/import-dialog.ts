import { Importer } from './importer';
import { Options } from './model/options';

export class ImportDialog extends FormApplication<FormApplication.Options, Options, Options> {

    static get defaultOptions(): FormApplication.Options {
        const defaults = super.defaultOptions;

        const overrides: Partial<FormApplication.Options> = {
            popOut: true,
            minimizable: true,
            resizable: true,
            height: 'auto',
            id: 'swn-importer-dialog',
            template: "modules/swn-importer/templates/dialog.html",
            title: 'Import Sector Without Numbers sector',
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

    _updateObject(_: Event, formData?: Options): Promise<void> {
        const url = this.getFileUrl();
        if (formData && url) {
            return this.importer.importFile(url, formData);
        } else {
            return Promise.resolve();
        }
    }

    getFileUrl(): string | null {
        const input = <HTMLInputElement>$('swn-sector-file')[0];
        if (input.files?.length) {
            return URL.createObjectURL(<Blob>input.files.item(0));
        } else {
            return null;
        }
    }

}
