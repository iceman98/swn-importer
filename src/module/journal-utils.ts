import { FolderUtils } from './folder-utils';
import { Attributes } from './model/attributes';
import { Options } from './model/options';
import { TreeNode } from './model/tree-node';
import { TemplateUtils } from './template-utils';
import { Utils } from './utils';

export class JournalUtils {

    static getEmptyJournalData(node: TreeNode, options: Options): Partial<JournalEntry.Data> {
        const hidden = (options.onlyGMJournals || node.entity.isHidden);
        const permission: Entity.Permission = {
            default: hidden ? CONST.ENTITY_PERMISSIONS.NONE : CONST.ENTITY_PERMISSIONS.OBSERVER
        };

        const name = options.addTypeToEntityJournal ? `[${Utils.getTypeName(node.type)}] ${node.entity.name}` : node.entity.name;
        const folder = FolderUtils.getContainingFolder(node)?.id;

        const journal: Partial<JournalEntry.Data> = {
            type: 'JournalEntry',
            name,
            folder,
            flags: Utils.getNodeFlags(node),
            permission
        };

        return journal;
    }

    static async getUpdateJournalData(node: TreeNode, options: Options): Promise<Partial<JournalEntry.Data>> {
        if (node.journal) {
            const templateData = JournalUtils.getTemplateData(node, options);
            const content = await TemplateUtils.renderTemplate(node.type, templateData);

            const updateData: Partial<JournalEntry.Data> = {
                _id: node.journal.id,
                content
            };

            return updateData;
        } else {
            throw new Error("Couldn't find the journal for the entity " + node.id);
        }
    }

    private static getTemplateData(node: TreeNode, options: Options): { [k: string]: any; } {

        const children = node.children.map(child => {
            const childData: any = {
                name: child.entity.name,
                type: Utils.getTypeName(child.type),
                orbiting: false,
                link: child.journal?.link,
                position: child.coordinates
            }
            return childData;
        });

        const location = JournalUtils.getParentLocation(node);

        const system = Utils.getSystemNode(node);

        const attributes: { name: string, description: string }[] = [];

        let description: string | undefined;

        for (const key in node.entity.attributes) {
            const attributeName = <keyof Attributes>key;
            switch (attributeName) {
                case 'description':
                    description = node.entity.attributes.description;
                    break;
                case 'tags':
                    // implement?
                    break;
                default:
                    attributes.push({
                        name: Utils.getAttributeName(attributeName),
                        description: <string>node.entity.attributes[attributeName]
                    });
                    break;
            }
        }

        const data = {
            name: node.entity.name,
            attributes,
            description,
            tags: node.entity.attributes.tags,
            showType: !options.addTypeToEntityJournal,
            type: Utils.getTypeName(node.type),
            location,
            parentLink: node.parent?.journal?.link,
            parentType: node.parent ? Utils.getTypeName(node.parent.type) : undefined,
            systemLink: node.parent === system ? undefined : system?.journal?.link,
            systemType: system ? Utils.getTypeName(system.type) : undefined,
            children,
            coordinates: system?.coordinates
        };

        return data;

    }

    private static getParentLocation(node: TreeNode): string | undefined {
        if (!node.parent) {
            // surely it's a system???
            return undefined;
        } else {
            switch (node.parent.type) {
                case 'asteroidBelt':
                    return "in an asteroid of";
                case 'sector':
                    return "in";
                case 'blackHole':
                case 'system':
                    return "in orbit around";
                case 'moon':
                case 'planet':
                    if (node.type === 'moonBase' || node.type === 'researchBase') {
                        return "on the surface of";
                    } else {
                        return "in orbit around";
                    }
                default:
                    return "in";
            }
        }
    }
}
