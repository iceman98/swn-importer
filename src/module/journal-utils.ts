import { FolderUtils } from './folder-utils';
import { AttributeEntry } from './model/attribute-entry';
import { Attributes } from './model/attributes';
import { DiagramEntry } from './model/diagram-entry';
import { DisplayChild } from './model/display-child';
import { DisplayEntity } from './model/display-entity';
import { DisplayTag } from './model/display-tag';
import { Options } from './model/options';
import { SectorTree } from './model/sector-tree';
import { TreeNode } from './model/tree-node';
import { TreeTag } from './model/tree-tag';
import { NoteUtils } from './note-utils';
import { TemplateUtils } from './template-utils';
import { Utils } from './utils';

export class JournalUtils {

    /**
     * Gets a Foundry Journal Data object to generate an empty journal for an entity
     * @param node The tree node to generate an empty journal for
     * @param options The options object
     * @returns The Foundry Journal Data
     */
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
            permission,
            img: node.entity.image
        };

        return journal;
    }

    /**
     * Gets a Foundry Journal Data object to update an existing journal for an entity
     * @param sectorTree The sector tree
     * @param node The tree node to generate a journal update for
     * @param options The options object
     * @returns The Foundry Journal update Data (promise)
     */
    static async getUpdateJournalData(sectorTree: SectorTree, node: TreeNode, options: Options): Promise<Partial<JournalEntry.Data>> {
        if (node.journal) {
            const templateData = JournalUtils.getTemplateData(sectorTree, node, options);
            const content = await TemplateUtils.renderJournalContent(node.type, templateData);

            const updateData: Partial<JournalEntry.Data> = {
                _id: node.journal.id,
                content
            };

            return updateData;
        } else {
            throw new Error("Couldn't find the journal for the entity " + node.id);
        }
    }

    /**
     * Gets a Foundry Journal Data object to generate a journal for a tag
     * @param tag The tag to create a journal entry for
     * @param folder The folder to put the journal into
     */
    static async getTagJournalData(tagNode: TreeTag, folder: Folder): Promise<Partial<JournalEntry.Data>> {
        const journal: Partial<JournalEntry.Data> = {
            type: 'JournalEntry',
            name: tagNode.tag.name,
            content: await renderTemplate(Utils.getTemplatePath("tag.html"), tagNode.displayTag),
            folder: folder.id,
            flags: Utils.getTagFlags(tagNode),
            permission: { default: CONST.ENTITY_PERMISSIONS.NONE }
        };

        return journal;
    }

    private static getTemplateData(sectorTree: SectorTree, node: TreeNode, options: Options): DisplayEntity {
        const system = (node.type !== 'sector') ? Utils.getContainingSystem(node) : undefined;

        const children: DisplayChild[] = node.children
            .filter(node => node.type !== 'note')
            .map(child => {
                const childData: any = {
                    link: child.journal?.link,
                    type: Utils.getTypeName(child.type),
                    coordinates: child.coordinates,
                    tags: Utils.getEntityDisplayTags(sectorTree, child)
                }
                return childData;
            });

        const attributes: AttributeEntry[] = [];

        let tags: DisplayTag[] | undefined;
        let description: string | undefined;

        const notes: AttributeEntry[] = node.children
            .filter(node => node.type === 'note')
            .map(node => { return { name: node.entity.name, description: node.entity.attributes.content } });

        for (const key in node.entity.attributes) {
            const attributeName = <keyof Attributes>key;
            switch (attributeName) {
                case 'description':
                    description = node.entity.attributes.description;
                    break;
                case 'tags':
                    tags = Utils.getEntityDisplayTags(sectorTree, node);
                    break;
                default:
                    attributes.push({
                        name: Utils.getAttributeName(attributeName),
                        description: <string>node.entity.attributes[attributeName]
                    });
                    break;
            }
        }

        const includeSystemLink: boolean = (!!system && system !== node && system !== node.parent);

        const data: DisplayEntity = {
            name: node.entity.name,
            diagram: JournalUtils.generateDiagram(sectorTree, node, options),
            attributes,
            description,
            notes,
            image: node.entity.image,
            tags,
            showType: !options.addTypeToEntityJournal,
            type: Utils.getTypeName(node.type),
            location: JournalUtils.getLocationWithinParent(node),
            parentLink: node.parent?.journal?.link,
            parentType: node.parent ? Utils.getTypeName(node.parent.type) : undefined,
            parentTags: node.parent ? Utils.getEntityDisplayTags(sectorTree, node.parent) : undefined,
            systemLink: (includeSystemLink && system) ? system.journal?.link : undefined,
            systemType: (includeSystemLink && system) ? Utils.getTypeName(system.type) : undefined,
            systemTags: (includeSystemLink && system) ? Utils.getEntityDisplayTags(sectorTree, system) : undefined,
            children,
            coordinates: system?.coordinates
        };

        return data;

    }

    private static getLocationWithinParent(node: TreeNode): string | undefined {
        if (!node.parent) {
            // surely it's a system?!??
            return undefined;
        } else {
            switch (node.parent.type) {
                case 'asteroidBelt':
                    // TODO: localize!
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

    private static generateDiagram(sectorTree: SectorTree, diagramRoot: TreeNode, options: Options): DiagramEntry[] {
        const entities = Utils.traversal(diagramRoot, 'preorder').filter(n => n.type !== 'note');

        if (entities.length > 1) {
            return entities.map((node) => {
                const indentation: string[] = [];
                const distance = Utils.getDistance(diagramRoot, node);
                for (let i = 0; i < distance; i++) {
                    if (i === distance - 1) {
                        if (Utils.isLastChild(node)) {
                            indentation.push('└');
                        } else {
                            indentation.push('├');
                        }
                    } else {
                        indentation.push('│');
                    }
                }
                return {
                    indentation,
                    image: NoteUtils.getEntityIcon(node.type, options),
                    link: (diagramRoot !== node) ? node.journal?.link : undefined,
                    type: !options.addTypeToEntityJournal ? node.type : undefined,
                    tags: Utils.getEntityDisplayTags(sectorTree, node)
                }
            });
        }

        return [];
    }

}
