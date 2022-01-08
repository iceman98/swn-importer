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
    static getSectorNotes(sectorTree: SectorTree, options: Options): Note.Data[] {
        const notes: Note.Data[] = [];

        sectorTree.root.children.forEach(node => {
            notes.push(...this.getSystemNotes(node, options));
        });

        return notes;
    }

    private static getSystemNotes(system: TreeNode, options: Options): Note.Data[] {
        let nodes: TreeNode[];

        if (options.generateNotesForAllEntities) {
            nodes = Utils.traversal(system, 'preorder');
        } else {
            nodes = [system, ...system.children];
        }

        const notes = nodes.map((node, index) => <Note.Data>this.createEntityNote(node, nodes.length, index));
        return notes;
    }

    private static createEntityNote(node: TreeNode, entityCount: number, entityIndex: number): Partial<Note.Data> {
        const iconPosition = this.getIconPosition(node, entityCount, entityIndex);

        const note: Partial<Note.Data> = {
            entryId: node.journal?.id,
            x: iconPosition.x,
            y: iconPosition.y,
            icon: this.getEntityIcon(node.type),
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
        let tooltipPosition: number = CONST.TEXT_ANCHOR_POINTS.CENTER;

        const orbitingEntities = entityCount - 1;
        const orbitingEntityIndex = entityIndex - 1;

        if (entityIndex !== 0) {
            const step = (2 * Math.PI) / orbitingEntities;
            const angle = orbitingEntityIndex * step;

            if (angle <= (1 / 4) * Math.PI) {
                tooltipPosition = CONST.TEXT_ANCHOR_POINTS.RIGHT;
            } else if (angle <= (3 / 4) * Math.PI) {
                tooltipPosition = CONST.TEXT_ANCHOR_POINTS.BOTTOM;
            } else if (angle <= (5 / 4) * Math.PI) {
                tooltipPosition = CONST.TEXT_ANCHOR_POINTS.LEFT;
            } else if (angle <= (7 / 4) * Math.PI) {
                tooltipPosition = CONST.TEXT_ANCHOR_POINTS.TOP;
            } else {
                tooltipPosition = CONST.TEXT_ANCHOR_POINTS.RIGHT;
            }

            offset = this.getEntityOffset(angle);
        }

        return {
            x: Math.floor(center.x + offset.x),
            y: Math.floor(center.y + offset.y),
            tooltipPosition: <Const.TextAnchorPoint>tooltipPosition
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

    private static getEntityIcon(type: keyof SectorData): string {
        return Utils.getImagePath(type + ".png");
    }

}
