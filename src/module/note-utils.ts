import { NoteDataConstructorData } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/noteData';
import { Constants } from './constants';
import { Coordinates } from './model/coordinates';
import { IconPosition } from './model/icon-position';
import { Options } from './model/options';
import { PositionedEntity } from './model/positioned-entity';
import { SectorData } from './model/sector-data';
import { SectorTree } from './model/sector-tree';
import { TreeNode } from './model/tree-node';
import { Utils } from './utils';

export class NoteUtils {

    /**
     * Gets a Foundry Note Data list to generate scene pins for a system/blackhole
     * @param node The tree node to generate pins for
     * @param options The options object
     * @returns The Foundry Note Data list
     */
    static getSectorNotes(sectorTree: SectorTree, options: Options): NoteDataConstructorData[] {
        const notes: NoteDataConstructorData[] = [];

        sectorTree.root.children.forEach(node => {
            notes.push(...this.getSystemNotes(node, options));
        });

        return notes;
    }

    /**
     * Gets the icon path that represents an entity type
     * @param type The type of entity
     * @param options The options object
     * @returns The icon path
     */
    public static getEntityIcon(type: keyof SectorData, options: Options): string {
        return options[type + "Path"];
    }

    private static getSystemNotes(system: TreeNode, options: Options): NoteDataConstructorData[] {
        let nodes: TreeNode[];

        if (options.generateNotesForAllEntities) {
            nodes = Utils.traversal(system, 'preorder');
        } else {
            nodes = [system, ...system.children];
        }

        const notes = nodes
            .filter(node => node.type !== 'note')
            .map((node, index, list) => this.createEntityNote(node, list.length, index, options))
            .reverse();

        return notes;
    }

    private static createEntityNote(node: TreeNode, entityCount: number, entityIndex: number, options: Options): NoteDataConstructorData {
        const iconPosition = this.getIconPosition(node, entityCount, entityIndex);

        const note: NoteDataConstructorData = {
            entryId: node.journal?.id,
            x: iconPosition.x,
            y: iconPosition.y,
            icon: this.getEntityIcon(node.type, options),
            iconSize: 32,
            text: node.entity.name,
            fontSize: 32,
            textAnchor: iconPosition.tooltipPosition
        };

        return note;
    }

    private static getIconPosition(node: TreeNode, entityCount: number, entityIndex: number): IconPosition {
        const parent = <PositionedEntity>Utils.getContainingSystem(node).entity;
        const center = this.getHexCenterPosition(parent.x - 1, parent.y - 1);

        let offset: Coordinates = { x: 0, y: 0 };
        let tooltipPosition: foundry.CONST.TEXT_ANCHOR_POINTS = foundry.CONST.TEXT_ANCHOR_POINTS.CENTER;

        const orbitingEntities = entityCount - 1;
        const orbitingEntityIndex = entityIndex - 1;

        if (entityIndex !== 0) {
            const step = (2 * Math.PI) / orbitingEntities;
            const angle = orbitingEntityIndex * step;

            if (angle <= (1 / 4) * Math.PI) {
                tooltipPosition = foundry.CONST.TEXT_ANCHOR_POINTS.RIGHT;
            } else if (angle <= (3 / 4) * Math.PI) {
                tooltipPosition = foundry.CONST.TEXT_ANCHOR_POINTS.BOTTOM;
            } else if (angle <= (5 / 4) * Math.PI) {
                tooltipPosition = foundry.CONST.TEXT_ANCHOR_POINTS.LEFT;
            } else if (angle <= (7 / 4) * Math.PI) {
                tooltipPosition = foundry.CONST.TEXT_ANCHOR_POINTS.TOP;
            } else {
                tooltipPosition = foundry.CONST.TEXT_ANCHOR_POINTS.RIGHT;
            }

            offset = this.getEntityOffset(angle);
        }

        return {
            x: Math.floor(center.x + offset.x),
            y: Math.floor(center.y + offset.y),
            tooltipPosition
        };
    }

    private static getEntityOffset(angle: number): Coordinates {
        const x = Math.cos(angle) * Constants.ORBITING_DISTANCE;
        const y = Math.sin(angle) * Constants.ORBITING_DISTANCE;

        return { x: x, y: y };
    }

    private static getHexCenterPosition(column: number, row: number): Coordinates {
        let verticalOffset = 0;

        if (column % 2 === 0) {
            verticalOffset = Constants.HEX_VERTICAL_RADIUS;
        } else {
            verticalOffset = 2 * Constants.HEX_VERTICAL_RADIUS;
        }

        return {
            x: Math.floor(((3 / 4) * Constants.HEX_WIDTH * column) + Constants.HEX_RADIUS),
            y: Math.floor((Constants.HEX_HEIGHT * row) + Constants.HEX_VERTICAL_RADIUS + verticalOffset)
        }
    }

}
