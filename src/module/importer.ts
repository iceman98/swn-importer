import { ImportDialog } from './import-dialog';
import { Options } from './model/options';
import { SectorData } from './model/sector-data';
import { SectorLoader } from './sector-loader';
import { Utils } from './utils';

export class Importer {

    private dialog: ImportDialog;
    // private options = new Options();

    constructor() {
        this.dialog = new ImportDialog(this);
    }

    removeExistingData() {
        if (game.user?.isGM) {
            game.folders?.forEach(f => f.delete());
            game.journal?.forEach(j => j.delete());
            game.scenes?.forEach(s => s.delete());
        }
    }

    initUI(html: JQuery) {
        if (game.user?.isGM) {
            const content = `
                <button id='swn-import-button' title='${Utils.getLabel("IMPORT-BUTTON-TOOLTIP")}'>
                    <i class='fas fa-cloud-download-alt'></i>
                    ${Utils.getLabel("IMPORT-BUTTON-NAME")}
                </button>
            `;
            html.find('.header-actions').append(content);
            html.on('click', '#swn-import-button', _ => this.openImportDialog());
        }
    }

    openImportDialog(): void {
        this.dialog.render(true);
    }

    async importFile(fileName: string, options: Options): Promise<void> {
        const start = new Date();

        if (game.user?.isGM) {
            const importedData: SectorData = await (await fetch(fileName)).json();
            const loader = new SectorLoader(importedData, options);
            const result = await loader.import();

            let journals = 0;
            result.nodeMap.forEach(node => {
                if (node.journal) {
                    journals++;
                }
            })

            const name = result.root.entity.name;
            const time = (new Date()).getTime() - start.getTime();

            new Dialog({
                title: Utils.getLabel("RESULT-DIALOG-TITLE"),
                content: Utils.formatLabel("RESULT-DIALOG-CONTENT", { sectorName: name, journals, time }),
                buttons: {
                    ok: {
                        icon: '<i class="fas fa-check"></i>',
                        label: Utils.getLabel("ACCEPT-BUTTON")
                    }
                },
                default: "ok"
            }).render(true);
        }
    }

    // processSector(sectorData: SectorData): Promise<ImportResult> {
    //     sectorData;
    //     const holder: ImportResult = {};

    //     return Promise.resolve(sectorData)
    //         .then(js => {
    //             holder.entityJournals = js;
    //             return this.createScene(sectorData, js);
    //         })
    //         .then(s => {
    //             holder.scene = s;
    //             return this.updateSceneThumbnail(s);
    //         })

    //     return Promise.resolve(holder);
    // }

    // getIconTint(type: keyof SectorData): string {
    //     switch (type) {
    //         // case 'system':
    //         //     return this.getRandomColor("#fff4ae", 128);
    //         // case 'blackHole':
    //         //     return "modules/swn-importer/images/blackHole.png";
    //         // case 'asteroidBase':
    //         //     return "modules/swn-importer/images/asteroidBase.png";
    //         // case 'asteroidBelt':
    //         //     return "modules/swn-importer/images/asteroidBelt.png";
    //         // case 'moon':
    //         //     return "modules/swn-importer/images/moon.png";
    //         // case 'planet':
    //         //     return this.getRandomColor("#4168fb", 128);
    //         // case 'gasGiantMine':
    //         //     return "modules/swn-importer/images/gasGiant.png";
    //         // case 'researchBase':
    //         //     return "modules/swn-importer/images/researchBase.png";
    //         // case 'refuelingStation':
    //         //     return "modules/swn-importer/images/refuelingStation.png";
    //         // case 'spaceStation':
    //         //     return "modules/swn-importer/images/spaceStation.png";
    //         // case 'moonBase':
    //         //     return "modules/swn-importer/images/moonBase.png";
    //         // case 'deepSpaceStation':
    //         //     return "modules/swn-importer/images/deepSpaceStation.png";
    //         // case 'orbitalRuin':
    //         //     return "modules/swn-importer/images/orbitalRuin.png";
    //         default:
    //             return "#ffffff";
    //     }
    // }

    // getRandomColor(baseColor: string, variation: number): string {
    //     const bytes = hexToRGB(colorStringToHex(baseColor));
    //     for (let i = 0; i < 3; i++) {
    //         const offset = Math.floor(Math.random() * variation) - (variation / 2);
    //         bytes[i] = bytes[i] + offset;
    //         bytes[i] = Math.min(bytes[i], 255);
    //         bytes[i] = Math.max(bytes[i], 0);
    //     }
    //     return hexToRGBAString(rgbToHex(bytes));
    // }

    // getJournalEntry(journals: JournalEntry[], key: string): string | null {
    //     const journal = Utils.filterByTagId(journals, key);
    //     return journal.length ? journal[0].id : null;
    // }

    // getEntityIcon(type: keyof SectorData): string {
    //     return Utils.getImagePath(type + ".png");
    // }

    // getIconPosition(parentEntity: PositionedEntity, entityCount?: number, entityIndex?: number): IconPosition | null {
    //     const center = this.getHexCenterPosition(parentEntity.x - 1, parentEntity.y - 1);

    //     let offset: Coordinates = { x: 0, y: 0 };
    //     let tooltipPosition: number = CONST.TEXT_ANCHOR_POINTS.CENTER;

    //     if (entityCount != undefined && entityIndex != undefined) {
    //         const step = (2 * Math.PI) / entityCount;
    //         const angle = entityIndex * step;

    //         if (angle <= (1 / 4) * Math.PI) {
    //             tooltipPosition = CONST.TEXT_ANCHOR_POINTS.RIGHT;
    //         } else if (angle <= (3 / 4) * Math.PI) {
    //             tooltipPosition = CONST.TEXT_ANCHOR_POINTS.BOTTOM;
    //         } else if (angle <= (5 / 4) * Math.PI) {
    //             tooltipPosition = CONST.TEXT_ANCHOR_POINTS.LEFT;
    //         } else if (angle <= (7 / 4) * Math.PI) {
    //             tooltipPosition = CONST.TEXT_ANCHOR_POINTS.TOP;
    //         } else {
    //             tooltipPosition = CONST.TEXT_ANCHOR_POINTS.RIGHT;
    //         }

    //         offset = this.getEntityOffset(angle);
    //     }

    //     return {
    //         x: Math.floor(center.x + offset.x),
    //         y: Math.floor(center.y + offset.y),
    //         tooltipPosition
    //     };
    // }

    // getEntityOffset(angle: number): Coordinates {
    //     const x = Math.cos(angle) * ORBITING_DISTANCE;
    //     const y = Math.sin(angle) * ORBITING_DISTANCE;

    //     return { x: x, y: y };
    // }

    // getContainingSystem(sectorData: SectorData, entity: BaseEntity): PositionedEntity | null {
    //     const systemId = this.getContainingSystemId(sectorData, entity);
    //     if (systemId) {
    //         const system = sectorData.system[systemId];
    //         const blackHole = sectorData.blackHole[systemId];
    //         return system || blackHole || null;
    //     } else {
    //         return null;
    //     }
    // }

    // getContainingSystemId(sectorData: SectorData, entity: BaseEntity): string | null {
    //     if (entity.parentEntity) {
    //         if (entity.parentEntity === 'sector') {
    //             return entity.id;
    //         } else if (entity.parentEntity === 'system' || entity.parentEntity === 'blackHole') {
    //             return entity.parent;
    //         } else {
    //             const parent = (<Map<string, BaseEntity>>sectorData[entity.parentEntity]).get(entity.parent);
    //             if (parent) {
    //                 return this.getContainingSystemId(sectorData, parent);
    //             } else {
    //                 return null;
    //             }
    //         }
    //     } else {
    //         return null;
    //     }
    // }

}

