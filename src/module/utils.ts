import { Constants } from './constants';
import { Attributes } from './model/attributes';
import { BaseEntity } from './model/base-entity';
import { DisplayList } from './model/display-list';
import { DisplayTag } from './model/display-tag';
import { PositionedEntity } from './model/positioned-entity';
import { SectorData } from './model/sector-data';
import { SectorTree } from './model/sector-tree';
import { Tag } from './model/tag';
import { TreeNode } from './model/tree-node';
import { TreeTag } from './model/tree-tag';

export class Utils {

    /**
     * Get a localized label from the module i18m tables
     * @param name The label key
     * @returns The localized label
     */
    static getLabel(name: string): string {
        return game.i18n.localize(Constants.LOCALIZATION_NAMESPACE + "." + name);
    }

    /**
     * Get a localized entity type name
     * @param type The entity type
     * @returns The localized entity type name
     */
    static getTypeName(type: keyof SectorData): string {
        switch (type) {
            case 'asteroidBase':
                return Utils.getLabel("ASTEROID-BASE");
            case 'asteroidBelt':
                return Utils.getLabel("ASTEROID-BELT");
            case 'blackHole':
                return Utils.getLabel("BLACK-HOLE");
            case 'deepSpaceStation':
                return Utils.getLabel("DEEP-SPACE-STATION");
            case 'gasGiantMine':
                return Utils.getLabel("GAS-GIANT-MINE");
            case 'moon':
                return Utils.getLabel("MOON");
            case 'moonBase':
                return Utils.getLabel("MOON-BASE");
            case 'orbitalRuin':
                return Utils.getLabel("ORBITAL-RUIN");
            case 'planet':
                return Utils.getLabel("PLANET");
            case 'refuelingStation':
                return Utils.getLabel("REFUELING-STATION");
            case 'researchBase':
                return Utils.getLabel("RESEARCH-BASE");
            case 'sector':
                return Utils.getLabel("SECTOR");
            case 'spaceStation':
                return Utils.getLabel("SPACE-STATION");
            case 'system':
                return Utils.getLabel("SYSTEM");
            default:
                return "";
        }
    }

    /**
     * Get a localized label with parameters from the module i18m tables
     * @param name The label key
     * @param data The data for the label parameters
     * @returns The localized label
     */
    static formatLabel(name: string, data: Record<string, any>): string {
        return game.i18n.format(Constants.LOCALIZATION_NAMESPACE + "." + name, data);
    }

    /**
     * Get the Foundry flags for a SWN entity
     * @param node The node to generate flags for
     * @returns The Foundry flags
     */
    static getNodeFlags(node: TreeNode): Record<string, any> {
        const flags: Record<string, any> = {};
        flags[Constants.MODULE_ID + "." + "id"] = node.id;
        flags[Constants.MODULE_ID + "." + "type"] = node.type;
        return flags;
    }

    /**
     * Get the Foundry flags for a SWN tag
     * @param node The tag to generate flags for
     * @returns The Foundry flags
     */
    static getTagFlags(tagNode: TreeTag): Record<string, any> {
        const flags: Record<string, any> = {};
        flags[Constants.MODULE_ID + "." + "id"] = tagNode.tag.name;
        return flags;
    }

    /**
     * Get the SWN id of a Foundry entity
     * @param entity The entity to get the id for
     * @returns The entity SWN id
     */
    static getIdFlag(entity: Entity): string {
        return <string>entity.getFlag(Constants.MODULE_ID, "id");
    }

    /**
     * Get all nodes from a root node preordered or postordered
     * @param node The root node of the traversal
     * @param strategy The type of traversal (preorder: root + children | postorder: children + root)
     * @returns A list with the node and all its children traversed with the specified strategy
     */
    static traversal(node: TreeNode, strategy: 'preorder' | 'postorder'): TreeNode[] {
        const list: TreeNode[] = [];

        switch (strategy) {
            case 'postorder':
                node.children.forEach(child => {
                    list.push(...this.traversal(child, strategy));
                });
                list.push(node);
                break;
            case 'preorder':
                list.push(node);
                node.children.forEach(child => {
                    list.push(...this.traversal(child, strategy));
                });
                break;
        }

        return list;
    }

    /**
     * Convert a Foundry create/update response to a list of created/updated entities
     * @param entities An object, object array or null
     * @returns A list with the the object or objects (or empty)
     */
    static getAsList<E>(entities: E | E[] | null): E[] {
        if (entities) {
            if (entities instanceof Array) {
                return entities;
            } else {
                return [entities];
            }
        } else {
            return [];
        }
    }

    /**
     * Execute a function on every entity of an imported sector of specified types
     * @param sectorData The sector data to visit
     * @param types The entity types that will be visited
     * @param consumer The function to be executed on every visited entity
     */
    private static forEachEntity(sectorData: SectorData, types: 'all' | 'only-basic' | 'only-systems', consumer: (key: string, entity: BaseEntity, type: keyof SectorData) => void) {
        this.forEachEntityType(sectorData, types, (type, map) => {
            for (const x in map) {
                consumer(x, map[x], type);
            }
        });
    }

    /**
     * Get a hex coordinates as XXYY where XX is the column and YY is the row
     * @param column Zero-based grid column
     * @param row Zero-based grid row
     * @returns The coordinates of the hex
     */
    static getHexCoordinates(column: number, row: number): string {
        const xt = column < 10 ? "0" + column : column.toString();
        const yt = row < 10 ? "0" + row : row.toString();
        return xt + yt;
    }

    /**
     * Get a module image path
     * @param name The image name
     * @returns The image path
     */
    static getImagePath(name: string): string {
        return `modules/${Constants.MODULE_ID}/images/${name}`;
    }

    /**
     * Get a module template path
     * @param name The template name
     * @returns The template path
     */
    static getTemplatePath(name: string): string {
        return `modules/${Constants.MODULE_ID}/templates/${name}`;
    }

    /**
     * Convert a sector data to a map of tree nodes indexed by the entity key
     * @param sectorData The sector data to be parsed
     * @returns A map with all sector entities as nodes
     */
    static getDataAsNodeMap(sectorData: SectorData): Map<string, TreeNode> {
        const nodeMap = new Map<string, TreeNode>();
        Utils.forEachEntity(sectorData, "all", (k, e, t) => {
            const node: TreeNode = {
                id: k,
                entity: e,
                type: t,
                children: [],
                coordinates: ('x' in e) ? Utils.getSystemCoordinates(<PositionedEntity>e) : undefined,
                parent: undefined,
                folder: undefined,
                journal: undefined
            };
            nodeMap.set(k, node);
        });
        return nodeMap;
    }

    /**
     * Modify every unlinked node of the map to create a node tree by the entity.parent property
     * @param nodeMap The node map to parse
     */
    static linkTreeNodes(nodeMap: Map<string, TreeNode>): void {
        nodeMap.forEach(node => {
            if (node.entity.parent) {
                const parent = nodeMap.get(node.entity.parent);
                if (parent) {
                    if (!parent.children.includes(node)) {
                        parent.children.push(node);
                    }
                    node.parent = parent;
                }
            }
        });
    }

    /**
     * Get a localized label of the attribute name
     * @param name The attribute name
     * @returns The localized name of the attribute
     */
    static getAttributeName(name: keyof Attributes): string {
        switch (name) {
            case 'occupation':
                return Utils.getLabel("ATTRIBUTE-OCCUPATION");
            case 'situation':
                return Utils.getLabel("ATTRIBUTE-SITUATION");
            case 'atmosphere':
                return Utils.getLabel("ATTRIBUTE-ATMOSPHERE");
            case 'biosphere':
                return Utils.getLabel("ATTRIBUTE-BIOSPHERE");
            case 'population':
                return Utils.getLabel("ATTRIBUTE-POPULATION");
            case 'techLevel':
                return Utils.getLabel("ATTRIBUTE-TECHNOLOGY-LEVEL");
            case 'temperature':
                return Utils.getLabel("ATTRIBUTE-TEMPERATURE");
            default:
                return name;
        }
    }

    /**
     * Get a localized label of the tag list name
     * @param name The tag list
     * @returns The localized name of the tag list
     */
    static getTagListName(name: keyof Tag): string {
        switch (name) {
            case 'complications':
                return Utils.getLabel("TAG-COMPLICATIONS");
            case 'enemies':
                return Utils.getLabel("TAG-ENEMIES");
            case 'friends':
                return Utils.getLabel("TAG-FRIENDS");
            case 'places':
                return Utils.getLabel("TAG-PLACES");
            case 'things':
                return Utils.getLabel("TAG-THINGS");
            default:
                return name;
        }
    }

    /**
     * Traverse all node ascendants of the current node to find its containing system/blackhole
     * @param node The leaf entity node
     * @returns The tree node representing the containing system/blackhole of the node (including itself)
    */
    static getContainingSystem(node: TreeNode): TreeNode {
        if (node.type === 'system' || node.type === 'blackHole') {
            return node;
        } else {
            if (node.parent) {
                return this.getContainingSystem(node.parent);
            }
        }

        throw new Error("Couldnt find containing system of " + node.id);
    }

    /**
     * Finds the distance between a node and a descendant node
     * @param ascendant The ascendant node
     * @param descendant The descendant node
     * @returns The distance between nodes
     */
    static getDistance(ascendant: TreeNode, descendant: TreeNode): number {
        if (ascendant === descendant) {
            return 0;
        } else {
            if (descendant.parent) {
                return this.getDistance(ascendant, descendant.parent) + 1;
            }
        }

        throw new Error("Entities are not linked: " + ascendant.id + " - " + descendant.id);
    }

    /**
     * Find out if a node is the last child of its parent
     * @param node The node to evaluate
     * @returns True if this node is the last child of its parent
     */
    static isLastChild(node: TreeNode) {
        if (node.parent) {
            const siblings = node.parent.children;
            return node === siblings[siblings.length - 1];
        }

        return false;
    }

    /**
     * Gets all the distinct tags of a node list into a map
     * @param nodeList The node list to process
     * @returns A map with the tag name and content
     */
    static getTagMap(nodeList: TreeNode[]): Map<string, TreeTag> {
        const tagMap = new Map<string, TreeTag>();
        nodeList.forEach(node => {
            if (node.entity.attributes.tags) {
                node.entity.attributes.tags.forEach(tag => {
                    if (!tagMap.has(tag.name)) {
                        tagMap.set(tag.name, { id: tag.name, tag, displayTag: Utils.getDisplayTag(tag), journal: undefined });
                    }
                });
            }
        });
        return tagMap;
    }

    /**
     * Get the values of a map into a list
     * @param map The map to parse
     * @returns A list with all values in the map
     */
    static getValueList<K, V>(map: Map<K, V>): V[] {
        const result: V[] = [];
        map.forEach(value => result.push(value));
        return result;
    }

    /**
     * Gets a list of display tags for a given entity
     * @param sectorTree The sector tree
     * @param node The node to get the tags for
     * @returns The list of display tags for the node
     */
    static getEntityDisplayTags(sectorTree: SectorTree, node: TreeNode): DisplayTag[] | undefined {
        if (node && node.entity && node.entity.attributes && node.entity.attributes.tags) {
            return <DisplayTag[]>node.entity.attributes.tags
                .map(t => sectorTree.tagMap.get(t.name))
                .filter(t => t !== undefined)
                .map(t => t?.displayTag);
        }
        return undefined;
    }

    /**
     * Returns a unique name for an entity, timestamping the name if necessary
     * @param collection The collection to check
     * @param name The entity name to check
     * @returns The name if not found, or else the name with a timestamp
     */
    static getTimestampedName(collection: EntityCollection | undefined, name: string): string {
        if (collection) {
            if (collection.getName(name)) {
                name = `${name} (${(new Date()).toLocaleString()})`;
            }
        }
        return name;
    }

    private static getDisplayTag(tag: Tag): DisplayTag {
        const lists: DisplayList[] = [];

        for (const key in tag) {
            if (key !== 'types' && tag[key] instanceof Array) {
                lists.push({
                    name: Utils.getTagListName(<keyof Tag>key),
                    elements: tag[key]
                });
            }
        }

        return {
            name: tag.name,
            description: tag.description,
            lists,
            link: undefined
        };
    }

    private static forEachEntityType(sectorData: SectorData, types: 'all' | 'only-basic' | 'only-systems', consumer: (type: keyof SectorData, entities: Record<string, BaseEntity>) => void) {
        let entities: (keyof SectorData)[];

        switch (types) {
            case 'all':
                entities = ['asteroidBase', 'asteroidBelt', 'blackHole', 'deepSpaceStation', 'gasGiantMine', 'moon', 'moonBase', 'note', 'orbitalRuin', 'planet', 'refuelingStation', 'researchBase', 'sector', 'spaceStation', 'system'];
                break;
            case 'only-basic':
                entities = ['asteroidBase', 'asteroidBelt', 'deepSpaceStation', 'gasGiantMine', 'moon', 'moonBase', 'orbitalRuin', 'planet', 'refuelingStation', 'researchBase', 'spaceStation'];
                break;
            case 'only-systems':
                entities = ['blackHole', 'system'];
                break;
        }

        entities.forEach(type => {
            const map = <Record<string, BaseEntity>>sectorData[type];
            consumer(type, map);
        });
    }

    private static getSystemCoordinates(system: PositionedEntity): string {
        return this.getHexCoordinates(system.x - 1, system.y - 1);
    }

}
