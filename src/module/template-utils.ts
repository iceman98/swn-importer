import { SectorData } from './model/sector-data';
import { Utils } from './utils';

export class TemplateUtils {

    static async renderTemplate(type: keyof SectorData, data: { [k: string]: any }): Promise<string> {
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
