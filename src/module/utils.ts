import { Attributes } from './model/attributes';
import { BaseEntity } from './model/base-entity';
import { PositionedEntity } from './model/positioned-entity';
import { SectorData } from './model/sector-data';
import { TreeNode } from './model/tree-node';

export class Utils {

    static readonly MODULE_ID = "swn-importer";
    static readonly LOCALIZATION_NAMESPACE = "SWN-IMPORTER";

    static getLabel(name: string): string {
        return game.i18n.localize(this.LOCALIZATION_NAMESPACE + "." + name);
    }

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

    static formatLabel(name: string, data: { [k: string]: string | number | null | undefined }): string {
        return game.i18n.format(this.LOCALIZATION_NAMESPACE + "." + name, data);
    }

    static getNodeFlags(node: TreeNode): { [k: string]: any } {
        const flags: { [k: string]: any } = {};
        flags[this.MODULE_ID + "." + "id"] = node.id;
        flags[this.MODULE_ID + "." + "type"] = node.type;
        return flags;
    }

    static getIdFlag(entity: Entity): string {
        return <string>entity.getFlag(Utils.MODULE_ID, "id");
    }

    // static treeAsPreorder(node: TreeNode): TreeNode[] {
    //     const nodes: TreeNode[] = [];
    //     Utils.preorderTraversal(node, nodes);
    //     return nodes;
    // }

    // private static preorderTraversal(node: TreeNode, list: TreeNode[]): void {
    //     node.children.forEach(child => Utils.preorderTraversal(child, list));
    //     list.push(node);
    // }

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

    // static filterByTagId(entities: Entity[], id: string): Entity[] {
    //     return entities.filter(e => e.getFlag(this.MODULE_ID, "id") === id);
    // }

    static forEachEntityType(sectorData: SectorData, types: 'all' | 'only-basic' | 'only-systems', consumer: (type: keyof SectorData, entities: { [k: string]: BaseEntity }) => void) {
        let entities: (keyof SectorData)[];

        switch (types) {
            case 'all':
                entities = ['asteroidBase', 'asteroidBelt', 'blackHole', 'deepSpaceStation', 'gasGiantMine', 'moon', 'moonBase', 'orbitalRuin', 'planet', 'refuelingStation', 'researchBase', 'sector', 'spaceStation', 'system'];
                break;
            case 'only-basic':
                entities = ['asteroidBase', 'asteroidBelt', 'deepSpaceStation', 'gasGiantMine', 'moon', 'moonBase', 'orbitalRuin', 'planet', 'refuelingStation', 'researchBase', 'spaceStation'];
                break;
            case 'only-systems':
                entities = ['blackHole', 'system'];
                break;
        }

        entities.forEach(type => {
            const map = <{ [k: string]: BaseEntity }>sectorData[type];
            consumer(type, map);
        });
    }

    static forEachEntity(sectorData: SectorData, types: 'all' | 'only-basic' | 'only-systems', consumer: (key: string, entity: BaseEntity, type: keyof SectorData) => void) {
        this.forEachEntityType(sectorData, types, (type, map) => {
            for (const x in map) {
                consumer(x, map[x], type);
            }
        });
    }

    static getSystemCoordinates(system: PositionedEntity): string {
        return this.getHexCoordinates(system.x - 1, system.y - 1);
    }

    static getHexCoordinates(column: number, row: number): string {
        const xt = column < 10 ? "0" + column : column.toString();
        const yt = row < 10 ? "0" + row : row.toString();
        return xt + yt;
    }

    static getImagePath(name: string): string {
        return `modules/${this.MODULE_ID}/images/${name}`;
    }

    static getTemplatePath(name: string): string {
        return `modules/${this.MODULE_ID}/templates/${name}`;
    }

    // static getMapValues<V>(map: { [k: string]: V }): V[] {
    //     const values: V[] = [];
    //     for (const k in map) {
    //         values.push(map[k]);
    //     }
    //     return values;
    // }

    static getDataAsNodeMap(sectorData: SectorData) {
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

    static getSystemNode(node: TreeNode): TreeNode | undefined {
        if (node.type === 'system' || node.type === 'blackHole') {
            return node;
        } else {
            if (node.parent) {
                return Utils.getSystemNode(node.parent);
            } else {
                return undefined;
            }
        }
    }

    static getAttributeName(name: keyof Attributes): string {
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
}
