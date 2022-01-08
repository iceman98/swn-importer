import { SectorData } from './model/sector-data';
import { Utils } from './utils';

export class TemplateUtils {

    /**
     * Renders the data on the appropiate template for the entity type
     * @param type The entity type to select a template
     * @param data The data for the template
     * @returns The template rendered with the provided data (promise)
     */
    static async renderJournalContent(type: keyof SectorData, data: { [k: string]: any }): Promise<string> {
        const path = TemplateUtils.getTemplatePath(type);
        const content = renderTemplate(path, data);
        return content;
    }

    private static getTemplatePath(type: keyof SectorData): string {
        if (type === 'sector') {
            return Utils.getTemplatePath("sector.html");
        } else if (type === 'system' || type === 'blackHole') {
            return Utils.getTemplatePath("sun.html");
        } else {
            return Utils.getTemplatePath("entity.html");
        }
    }

}
