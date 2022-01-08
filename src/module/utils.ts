import { Constants } from './constants';
import { Attributes } from './model/attributes';
import { BaseEntity } from './model/base-entity';
import { PositionedEntity } from './model/positioned-entity';
import { SectorData } from './model/sector-data';
import { TreeNode } from './model/tree-node';

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
        // TODO: localize!
        switch (name) {
            case 'occupation':
                return "Occupation";
            case 'situation':
                return "Situation";
            case 'atmosphere':
                return "Atmosphere";
            case 'biosphere':
                return "Biosphere";
            case 'population':
                return "Population";
            case 'techLevel':
                return "Technology level";
            case 'temperature':
                return "Temperature";
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
