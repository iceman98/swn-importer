import { Constants } from './constants';
import { Coordinates } from './model/coordinates';
import { Options } from './model/options';
import { PositionedEntity } from './model/positioned-entity';
import { Sector } from './model/sector';
import { SectorTree } from './model/sector-tree';
import { NoteUtils } from './note-utils';
import { Utils } from './utils';

export class SceneUtils {

    /**
     * Gets a Foundry Scene Data object to generate a scene for a sector
     * @param node The sector tree to generate a scene for
     * @param options The options object
     * @returns The Foundry Scene Data
     */
    static getSceneData(sectorTree: SectorTree, options: Options): Partial<Scene.Data> {
        const sector = <Sector>sectorTree.root.entity;

        const sceneData: Partial<Scene.Data> = {
            active: true,
            backgroundColor: Constants.BACKGROUND_COLOR,
            drawings: this.getSectorLabels(sectorTree, options),
            flags: Utils.getNodeFlags(sectorTree.root),
            grid: Constants.HEX_WIDTH,
            gridAlpha: 0.3,
            gridColor: Constants.GRID_COLOR,
            gridDistance: 1,
            gridType: CONST.GRID_TYPES.HEXODDQ,
            gridUnits: Utils.getLabel("HEX-UNIT-NAME"),
            height: SceneUtils.getSceneHeight(sector.rows),
            img: options.backgroundPath,
            name: Utils.getTimestampedName(game.scenes, sectorTree.root.entity.name),
            padding: 0,
            notes: NoteUtils.getSectorNotes(sectorTree, options),
            journal: sectorTree.root.journal?.id,
            width: SceneUtils.getSceneWidth(sector.columns)
        };

        return sceneData;
    }

    private static getSceneHeight(rows: number): number {
        return Math.floor((rows + 1) * Constants.HEX_HEIGHT);
    }

    private static getSceneWidth(columns: number): number {
        return Math.floor((((3 / 4) * Constants.HEX_WIDTH) * columns) + ((1 / 4) * Constants.HEX_WIDTH));
    }

    private static getSectorLabels(sectorTree: SectorTree, options: Options): Drawing.Data[] {
        const labels: Drawing.Data[] = [];

        if (options.generateSectorCoordinates) {
            const sector = <Sector>sectorTree.root.entity;
            for (let row = 0; row < sector.rows; row++) {
                for (let column = 0; column < sector.columns; column++) {
                    const coordinates = this.getHexCenterPosition(column, row);

                    const label: any = {
                        x: coordinates.x,
                        y: Math.floor(coordinates.y + (9 / 10) * Constants.HEX_VERTICAL_RADIUS),
                        text: Utils.getHexCoordinates(column, row),
                        fontSize: 16
                    };
                    labels.push(label);
                }
            }
        }

        if (options.generateHexName) {
            sectorTree.root.children
                .filter(node => node.type !== 'note')
                .forEach(node => {
                    const system = <PositionedEntity>node.entity;
                    const coordinates = this.getHexCenterPosition(system.x - 1, system.y - 1);
                    const label: any = {
                        x: coordinates.x - Math.floor(Constants.HEX_HEIGHT / 2),
                        y: Math.floor(coordinates.y - (9 / 10) * Constants.HEX_VERTICAL_RADIUS),
                        text: system.name,
                        width: Constants.HEX_HEIGHT,
                        fontSize: 16
                    };
                    labels.push(label);
                });
        }

        return labels;
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
