import { SectorData } from './model/sector-data';
import { BaseEntity } from './model/base-entity';
import { PositionedEntity } from './model/positioned-entity';
import { ImportDialog } from './import-dialog';
import { Options } from './model/options';
import { ImportResult } from './model/import-result';
import { IconPosition } from './model/icon-position';
import { Coordinates } from './model/icon-offset';
import { Utils } from './utils';
import { Sector } from './model/sector';

const HEX_RADIUS = 100;
const HEX_WIDTH = 2 * HEX_RADIUS;
const HEX_HEIGHT = 2 * ((-1 * ((HEX_RADIUS / 2) ** 2 - HEX_RADIUS ** 2)) ** 0.5);
const HEX_VERTICAL_RADIUS = HEX_HEIGHT / 2;
const ORBITING_DISTANCE = 0.55 * HEX_RADIUS;

export class Importer {

    private dialog: ImportDialog;
    private options = new Options();

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

    importFile(fileName: string, options: Options): Promise<void> {
        this.options = options;

        if (game.user?.isGM) {
            return fetch(fileName)
                .then(str => str.json())
                .then(d => {
                    const sectorData: SectorData = {
                        asteroidBase: new Map(Object.entries(d.asteroidBase)),
                        asteroidBelt: new Map(Object.entries(d.asteroidBelt)),
                        blackHole: new Map(Object.entries(d.blackHole)),
                        deepSpaceStation: new Map(Object.entries(d.deepSpaceStation)),
                        gasGiantMine: new Map(Object.entries(d.gasGiantMine)),
                        moon: new Map(Object.entries(d.moon)),
                        moonBase: new Map(Object.entries(d.moonBase)),
                        note: null,
                        orbitalRuin: new Map(Object.entries(d.orbitalRuin)),
                        planet: new Map(Object.entries(d.planet)),
                        refuelingStation: new Map(Object.entries(d.refuelingStation)),
                        researchBase: new Map(Object.entries(d.researchBase)),
                        sector: new Map(Object.entries(d.sector)),
                        spaceStation: new Map(Object.entries(d.spaceStation)),
                        system: new Map(Object.entries(d.system))
                    };

                    Utils.forEachEntity(sectorData, 'all', (key, value, type) => {
                        value.id = key;
                        value.type = type;
                    });

                    return this.processSector(sectorData);
                })
                .then(r => {
                    const sector = <Sector>r.sectorData?.sector.values().next().value;
                    new Dialog({
                        title: Utils.getLabel("RESULT-DIALOG-TITLE"),
                        content: Utils.formatLabel("RESULT-DIALOG-CONTENT", { sectorName: sector.name, journals: r.entityJournals?.length }),
                        buttons: {
                            ok: {
                                icon: '<i class="fas fa-check"></i>',
                                label: Utils.getLabel("ACCEPT-BUTTON")
                            }
                        },
                        default: "ok"
                    }).render(true);
                    return Promise.resolve();
                });
        }

        return Promise.resolve();
    }

    preprocessEntity(sectorData: SectorData, type: keyof SectorData) {
        const entities = (<Map<string, BaseEntity | Sector>>sectorData[type]);
        entities.forEach((entity, key, _) => {
            entity.id = key;
            entity.type = type;
        });
    }

    processSector(sectorData: SectorData): Promise<ImportResult> {
        const holder: ImportResult = {};

        return Promise.resolve(sectorData)
            .then(d => {
                holder.sectorData = d;
                holder.groupedEntities = this.getGroupedEntities(sectorData);
                return this.createSectorJournalFolder(d)
            })
            .then(f => {
                holder.sectorJournalFolder = f;
                return this.createSystemJournalFolders(sectorData, f);
            })
            .then(sf => {
                holder.systemJournalFolders = sf;
                return this.createJournals(sectorData, <Folder>holder.sectorJournalFolder, sf);
            })
            .then(js => {
                holder.entityJournals = js;
                return this.createScene(sectorData, js);
            })
            .then(s => {
                holder.scene = s;
                return this.updateJournalContent(<SectorData>holder.sectorData, <Map<string, BaseEntity[]>>holder.groupedEntities, <JournalEntry[]>holder.entityJournals);
            })
            .then(_ => {
                return Promise.resolve(holder);
            });
    }

    updateJournalContent(sectorData: SectorData, groupedEntities: Map<string, BaseEntity[]>, journals: JournalEntry[]): Promise<JournalEntry[]> {
        const promises: (Promise<Partial<JournalEntry.Data>> | null)[] = [];

        groupedEntities.forEach((entityGroup, parentEntityId, __) => {
            entityGroup.forEach(entity => {
                promises.push(this.getJournalUpdate(groupedEntities, parentEntityId, entity.id, journals));
            });
        });

        promises.push(this.getSectorJournalUpdate(sectorData, journals));

        return Promise.all(promises.filter(p => p != null)).then(jl => (<any>JournalEntry).updateDocuments(jl));
    }

    getSectorJournalUpdate(sectorData: SectorData, journals: JournalEntry[]): Promise<Partial<JournalEntry.Data>> | null {
        const systems: PositionedEntity[] = [];
        Utils.forEachEntity(sectorData, 'only-systems', (_, system, __) => {
            systems.push(<PositionedEntity>system);
        })

        const sector = <Sector>sectorData.sector.values().next().value;

        const template = this.getEntityTemplate(sector.type);
        const templateData = this.getEntityTemplateData(systems, sector, sector, journals);

        const entityJournalList = Utils.filterByTagId(journals, sector.id);
        if (entityJournalList.length) {
            const entityJournal = entityJournalList[0];
            return renderTemplate(template, templateData)
                .then(content => {
                    const changedData: Partial<JournalEntry.Data> = {
                        _id: entityJournal.id,
                        content
                    };
                    return changedData;
                });
        }

        return null;
    }

    getJournalUpdate(groupedEntities: Map<string, BaseEntity[]>, groupId: string, entityId: string, journals: JournalEntry[]): Promise<Partial<JournalEntry.Data>> | null {
        const entityGroup = groupedEntities.get(groupId);

        if (entityGroup != undefined) {
            const entityList = entityGroup.filter(e => e.id === entityId);
            if (entityList.length) {
                const entity = entityList[0];
                const entityJournalList = Utils.filterByTagId(journals, entity.id);
                if (entityJournalList.length) {
                    const entityJournal = entityJournalList[0];
                    const systemEntityList = entityGroup.filter(e => e.id === groupId);
                    if (systemEntityList.length) {
                        const systemEntity = systemEntityList[0];
                        const promise = this.getJournalContent(entityGroup, <PositionedEntity>systemEntity, entity, journals)
                            .then(content => {
                                const changedData: Partial<JournalEntry.Data> = {
                                    _id: entityJournal.id,
                                    content
                                };
                                return changedData;
                            });

                        return promise;
                    }
                }
            }
        }

        return null;
    }

    getJournalContent(groupEntities: BaseEntity[], systemEntity: PositionedEntity, entity: BaseEntity, journals: JournalEntry[]): Promise<string> {
        const template = this.getEntityTemplate(entity.type);
        const templateData = this.getEntityTemplateData(groupEntities, systemEntity, entity, journals);
        return renderTemplate(template, templateData);
    }

    getEntityTemplateData(groupEntities: BaseEntity[], systemEntity: BaseEntity, entity: BaseEntity, journals: JournalEntry[]): { [k: string]: any } {
        const childEntities = groupEntities.filter(e => e.parent === entity.id).map(e => {
            const childData: any = {
                name: e.name,
                type: Utils.getTypeName(e.type),
                orbiting: false,
                link: this.getJournalLink(journals, e.id)
            }
            if ('x' in e) {
                const system = <PositionedEntity>e;
                childData.position = Utils.getSystemCoordinates(system);
            }
            return childData;
        });

        const positionedEntity = ('x' in systemEntity && 'y' in systemEntity) ? <PositionedEntity>systemEntity : null;

        const data = {
            ...entity,
            showType: !this.options.addTypeToEntityJournal,
            type: Utils.getTypeName(entity.type),
            orbiting: !(entity.type === 'moonBase' || entity.type === 'researchBase'),
            parentIsEntity: !(entity.parentEntity === 'system' || entity.parentEntity === 'blackHole'),
            parentLink: this.getJournalLink(journals, entity.parent),
            parentType: Utils.getTypeName(entity.parentEntity),
            systemLink: this.getJournalLink(journals, systemEntity.id),
            systemType: Utils.getTypeName(systemEntity.type),
            children: childEntities,
            coordinates: positionedEntity ? Utils.getSystemCoordinates(positionedEntity) : null
        };

        return data;
    }

    getJournalLink(journals: JournalEntry[], entityId: string): string | null {
        const entityJournalList = Utils.filterByTagId(journals, entityId);
        if (entityJournalList.length) {
            return entityJournalList[0].link;
        } else {
            return null;
        }
    }

    getEntityTemplate(type: keyof SectorData): string {
        if (type === 'sector') {
            return Utils.getTemplatePath("sector.html");
        } else if (type === 'system' || type === 'blackHole') {
            return Utils.getTemplatePath("sun.html");
        } else {
            return Utils.getTemplatePath("entity.html");
        }
    }

    createScene(sectorData: SectorData, journals: JournalEntry[]): Promise<Scene | null> {
        const sector = <Sector>sectorData.sector.values().next().value;

        const notes: Note.Data[] = this.getSectorNotes(sectorData, journals);

        const drawings: Drawing.Data[] = [];
        if (this.options.generateSectorCoordinates) {
            drawings.push(...this.getSectorLabels(sectorData));
        }

        const sectorJournal = journals.find(j => j.getFlag(Utils.MODULE_ID, "id") === sector.id);

        const sceneData: Partial<Scene.Data> = {
            active: true,
            backgroundColor: "#01162c",
            drawings,
            flags: Utils.getEntityFlags(sector),
            grid: HEX_WIDTH,
            gridAlpha: 0.3,
            gridColor: "#99caff",
            gridDistance: 1,
            gridType: CONST.GRID_TYPES.HEXODDQ,
            gridUnits: Utils.getLabel("HEX-UNIT-NAME"),
            height: this.getSceneHeight(sector.rows),
            img: Utils.getImagePath("starField.png"),
            name: Utils.getEntityJournalName(sector, this.options.addTypeToEntityJournal),
            padding: 0,
            notes,
            journal: sectorJournal?.id,
            width: this.getSceneWidth(sector.columns)
        };

        return Scene.create(sceneData);
    }

    getSectorLabels(sectorData: SectorData): Drawing.Data[] {
        const labels: Drawing.Data[] = [];
        const sector = sectorData.sector.values().next().value;

        for (let row = 0; row < sector.rows; row++) {
            for (let column = 0; column < sector.columns; column++) {
                const coordinates = this.getHexCenterPosition(column, row);

                const label: any = {
                    x: coordinates.x,
                    y: Math.floor(coordinates.y + (9 / 10) * HEX_VERTICAL_RADIUS),
                    text: Utils.getHexCoordinates(column, row),
                    fontSize: 16
                };
                labels.push(label);
            }
        }

        if (this.options.generateHexName) {
            Utils.forEachEntity(sectorData, 'only-systems', (_, e, __) => {
                const system = <PositionedEntity>e;
                const coordinates = this.getHexCenterPosition(system.x - 1, system.y - 1);
                const label: any = {
                    x: coordinates.x - Math.floor(HEX_HEIGHT / 2),
                    y: Math.floor(coordinates.y - (9 / 10) * HEX_VERTICAL_RADIUS),
                    text: e.name,
                    width: HEX_HEIGHT,
                    fontSize: 16
                };
                labels.push(label);
            });
        }

        return labels;
    }

    getSectorNotes(sectorData: SectorData, journals: JournalEntry[]): Note.Data[] {
        const notes: Note.Data[] = [];

        const groupedEntities = this.getGroupedEntities(sectorData);

        groupedEntities.forEach((v, k, _) => {
            const system = this.getSystemById(sectorData, k);
            if (system) {
                notes.push(...this.getSystemNotes(system, journals, v));
            }
        });

        return notes;
    }

    getSystemNotes(system: PositionedEntity, journals: JournalEntry[], entities: BaseEntity[]): Note.Data[] {
        const notes: Note.Data[] = [];

        let filteredEntities = entities.filter(e => e != system);
        if (!this.options.generateNotesForAllEntities) {
            filteredEntities = filteredEntities.filter(e => e.parentEntity === 'system' || e.parentEntity === 'blackHole');
        }

        for (let entityIndex = 0; entityIndex < filteredEntities.length; entityIndex++) {
            const note = this.createEntityNote(system, journals, filteredEntities[entityIndex], filteredEntities.length, entityIndex);
            if (note) {
                notes.push(note);
            }
        }

        const systemNote = this.createEntityNote(system, journals);
        if (systemNote) {
            notes.push(systemNote);
        }

        return notes;
    }

    getSystemById(sectorData: SectorData, k: string): PositionedEntity | null {
        const entities: PositionedEntity[] = [];
        entities.push(...sectorData.system.values());
        entities.push(...sectorData.blackHole.values());
        const entity = entities.filter(e => e.id === k);
        if (entity.length) {
            return entity[0];
        } else {
            return null;
        }
    }

    getGroupedEntities(sectorData: SectorData): Map<string, BaseEntity[]> {
        const sectorMap = new Map<string, BaseEntity[]>();

        sectorData.system.forEach((v, k, __) => {
            sectorMap.set(k, [v]);
        });

        sectorData.blackHole.forEach((v, k, __) => {
            sectorMap.set(k, [v]);
        });

        Utils.forEachEntity(sectorData, 'only-basic', (_, entity, __) => {
            const systemId = this.getContainingSystemId(sectorData, entity);
            if (systemId) {
                sectorMap.get(systemId)?.push(entity);
            }
        });

        const result = new Map<string, BaseEntity[]>();
        sectorMap.forEach((v, k, _) => {
            result.set(k, this.getSortedEntityArray(v));
        });

        return result;
    }

    getSortedEntityArray(entities: BaseEntity[]): BaseEntity[] {
        const result: BaseEntity[] = [];

        entities.filter(s => s.type === 'system' && s.parentEntity === 'sector').forEach(s => result.push(s));
        entities.filter(bh => bh.type === 'blackHole' && bh.parentEntity === 'sector').forEach(bh => result.push(bh));

        entities.filter(p => p.type === 'planet' && p.parentEntity === 'system').forEach(p => {
            result.push(p);
            entities.filter(m => m.type === 'moon' && m.parent === p.id).forEach(m => {
                result.push(m);
                entities.filter(mb => mb.type === 'moonBase' && mb.parent === m.id).forEach(mb => result.push(mb));
                entities.filter(rb => rb.type === 'researchBase' && rb.parent === m.id).forEach(rb => result.push(rb));
                entities.filter(rs => rs.type === 'refuelingStation' && rs.parent === m.id).forEach(rs => result.push(rs));
                entities.filter(or => or.type === 'orbitalRuin' && or.parent === m.id).forEach(or => result.push(or));
            });
            entities.filter(rb => rb.type === 'researchBase' && rb.parent === p.id).forEach(rb => result.push(rb));
            entities.filter(ggm => ggm.type === 'gasGiantMine' && ggm.parent === p.id).forEach(ggm => result.push(ggm));
            entities.filter(rs => rs.type === 'refuelingStation' && rs.parent === p.id).forEach(rs => result.push(rs));
            entities.filter(ss => ss.type === 'spaceStation' && ss.parent === p.id).forEach(ss => result.push(ss));
            entities.filter(or => or.type === 'orbitalRuin' && or.parent === p.id).forEach(or => result.push(or));
        });

        entities.filter(ab => ab.type === 'asteroidBelt' && ab.parentEntity === 'system').forEach(ab => {
            result.push(ab);
            entities.filter(b => b.type === 'asteroidBase' && b.parent === ab.id).forEach(b => result.push(b));
            entities.filter(rs => rs.type === 'refuelingStation' && rs.parent === ab.id).forEach(rs => result.push(rs));
            entities.filter(rb => rb.type === 'researchBase' && rb.parent === ab.id).forEach(rb => result.push(rb));
            entities.filter(ss => ss.type === 'spaceStation' && ss.parent === ab.id).forEach(ss => result.push(ss));
        });

        entities.filter(rs => rs.type === 'refuelingStation' && rs.parentEntity === 'system').forEach(rs => result.push(rs));
        entities.filter(rs => rs.type === 'refuelingStation' && rs.parentEntity === 'blackHole').forEach(rs => result.push(rs));

        entities.filter(rb => rb.type === 'researchBase' && rb.parentEntity === 'system').forEach(rs => result.push(rs));
        entities.filter(rb => rb.type === 'researchBase' && rb.parentEntity === 'blackHole').forEach(rs => result.push(rs));

        entities.filter(dss => dss.type === 'deepSpaceStation' && dss.parentEntity === 'system').forEach(dss => result.push(dss));
        entities.filter(dss => dss.type === 'deepSpaceStation' && dss.parentEntity === 'blackHole').forEach(dss => result.push(dss));

        entities.filter(or => or.type === 'orbitalRuin' && or.parentEntity === 'system').forEach(or => result.push(or));
        entities.filter(or => or.type === 'orbitalRuin' && or.parentEntity === 'blackHole').forEach(or => result.push(or));

        if (result.length != entities.length) {
            const missing = entities.filter(e => !result.includes(e));
            missing.forEach(m => console.log(`Missing entity ${m.name} (${m.type}) within parent ${m.parentEntity}`))
            console.log(entities, result);
            throw new Error("Some entity is not linked with its parent");
        }

        return result;
    }

    getSceneWidth(columns: number): number {
        return Math.floor((((3 / 4) * HEX_WIDTH) * columns) + ((1 / 4) * HEX_WIDTH));
    }

    getSceneHeight(rows: number): number {
        return Math.floor((rows + 1) * HEX_HEIGHT);
    }

    createEntityNote(parentEntity: PositionedEntity, journals: JournalEntry[], entity?: BaseEntity, entityCount?: number, entityIndex?: number): Note.Data | null {
        const iconPosition = this.getIconPosition(parentEntity, entityCount, entityIndex);

        if (iconPosition) {
            const note: any = {
                entryId: this.getJournalEntry(journals, entity ? entity.id : parentEntity.id),
                x: iconPosition.x,
                y: iconPosition.y,
                icon: this.getEntityIcon(entity ? entity.type : parentEntity.type),
                iconSize: 32,
                text: entity ? entity.name : parentEntity.name,
                fontSize: 32,
                textAnchor: iconPosition.tooltipPosition,
                iconTint: this.getIconTint(entity ? entity.type : parentEntity.type)
            };

            return note;
        } else {
            return null;
        }
    }

    getIconTint(type: keyof SectorData): string {
        switch (type) {
            // case 'system':
            //     return this.getRandomColor("#fff4ae", 128);
            // case 'blackHole':
            //     return "modules/swn-importer/images/blackHole.png";
            // case 'asteroidBase':
            //     return "modules/swn-importer/images/asteroidBase.png";
            // case 'asteroidBelt':
            //     return "modules/swn-importer/images/asteroidBelt.png";
            // case 'moon':
            //     return "modules/swn-importer/images/moon.png";
            // case 'planet':
            //     return this.getRandomColor("#4168fb", 128);
            // case 'gasGiantMine':
            //     return "modules/swn-importer/images/gasGiant.png";
            // case 'researchBase':
            //     return "modules/swn-importer/images/researchBase.png";
            // case 'refuelingStation':
            //     return "modules/swn-importer/images/refuelingStation.png";
            // case 'spaceStation':
            //     return "modules/swn-importer/images/spaceStation.png";
            // case 'moonBase':
            //     return "modules/swn-importer/images/moonBase.png";
            // case 'deepSpaceStation':
            //     return "modules/swn-importer/images/deepSpaceStation.png";
            // case 'orbitalRuin':
            //     return "modules/swn-importer/images/orbitalRuin.png";
            default:
                return "#ffffff";
        }
    }

    getRandomColor(baseColor: string, variation: number): string {
        const bytes = hexToRGB(colorStringToHex(baseColor));
        for (let i = 0; i < 3; i++) {
            const offset = Math.floor(Math.random() * variation) - (variation / 2);
            bytes[i] = bytes[i] + offset;
            bytes[i] = Math.min(bytes[i], 255);
            bytes[i] = Math.max(bytes[i], 0);
        }
        return hexToRGBAString(rgbToHex(bytes));
    }

    getJournalEntry(journals: JournalEntry[], key: string): string | null {
        const journal = Utils.filterByTagId(journals, key);
        return journal.length ? journal[0].id : null;
    }

    getEntityIcon(type: keyof SectorData): string {
        return Utils.getImagePath(type + ".png");
    }

    getIconPosition(parentEntity: PositionedEntity, entityCount?: number, entityIndex?: number): IconPosition | null {
        const center = this.getHexCenterPosition(parentEntity.x - 1, parentEntity.y - 1);

        let offset: Coordinates = { x: 0, y: 0 };
        let tooltipPosition: number = CONST.TEXT_ANCHOR_POINTS.CENTER;

        if (entityCount != undefined && entityIndex != undefined) {
            const step = (2 * Math.PI) / entityCount;
            const angle = entityIndex * step;

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
            tooltipPosition
        };
    }

    getHexCenterPosition(column: number, row: number): Coordinates {
        let verticalOffset = 0;

        if (column % 2 === 0) {
            verticalOffset = HEX_VERTICAL_RADIUS;
        }

        return {
            x: Math.floor(((3 / 4) * HEX_WIDTH * column) + HEX_RADIUS),
            y: Math.floor((HEX_HEIGHT * row) + HEX_VERTICAL_RADIUS + verticalOffset)
        }
    }

    getEntityOffset(angle: number): Coordinates {
        const x = Math.cos(angle) * ORBITING_DISTANCE;
        const y = Math.sin(angle) * ORBITING_DISTANCE;

        return { x: x, y: y };
    }

    getContainingSystem(sectorData: SectorData, entity: BaseEntity): PositionedEntity | null {
        const systemId = this.getContainingSystemId(sectorData, entity);
        if (systemId) {
            const system = sectorData.system.get(systemId);
            const blackHole = sectorData.blackHole.get(systemId);
            return system || blackHole || null;
        } else {
            return null;
        }
    }

    createJournals(sectorData: SectorData, sectorFolder: Folder, systemFolders: Folder[]): Promise<JournalEntry[]> {
        const journals: Partial<JournalEntry.Data>[] = [];

        Utils.forEachEntityType(sectorData, 'all', (_, entities) => {
            journals.push(...this.createEntityJournals(sectorData, Utils.getMapValues(entities), sectorFolder, systemFolders));
        });

        return JournalEntry.create(journals).then(js => Utils.getAsList(js));
    }

    createEntityJournals(sectorData: SectorData, entities: BaseEntity[], sectorFolder: Folder, systemFolders: Folder[]): Partial<JournalEntry.Data>[] {
        return entities.map(e => {
            const hidden = (this.options.onlyGMJournals || e.isHidden);
            const permission: Entity.Permission = {
                default: hidden ? CONST.ENTITY_PERMISSIONS.NONE : CONST.ENTITY_PERMISSIONS.OBSERVER
            };

            const journal: Partial<JournalEntry.Data> = {
                type: 'JournalEntry',
                name: Utils.getEntityJournalName(e, this.options.addTypeToEntityJournal),
                folder: this.getContainingSystemFolder(sectorData, sectorFolder, systemFolders, e),
                content: e.name,
                flags: Utils.getEntityFlags(e),
                permission
            };
            return journal;
        });
    }

    getContainingSystemFolder(sectorData: SectorData, sectorFolder: Folder, systemFolders: Folder[], entity: BaseEntity): string | undefined {
        if (entity.type === 'sector') {
            return sectorFolder.id;
        } else {
            const systemId = this.getContainingSystemId(sectorData, entity);
            if (systemId) {
                const folder = Utils.filterByTagId(systemFolders, systemId);
                if (folder.length) {
                    return folder[0].id;
                } else {
                    return undefined;
                }
            } else {
                return undefined;
            }
        }
    }

    createSystemJournalFolders(sectorData: SectorData, parentFolder: Folder | null): Promise<Folder[]> {
        if (parentFolder) {
            const folders: Partial<Folder.Data>[] = [];

            sectorData.system.forEach((v, _, __) => {
                folders.push({
                    name: Utils.getEntityJournalName(v, this.options.addTypeToEntityJournal),
                    type: "JournalEntry",
                    parent: parentFolder,
                    flags: Utils.getEntityFlags(v),
                });
            });

            sectorData.blackHole.forEach((v, _, __) => {
                folders.push({
                    name: Utils.getEntityJournalName(v, this.options.addTypeToEntityJournal),
                    type: "JournalEntry",
                    parent: parentFolder,
                    flags: Utils.getEntityFlags(v),
                });
            });

            return Folder.create(folders).then(f => Utils.getAsList(f));
        } else {
            return Promise.resolve([]);
        }
    }

    createSectorJournalFolder(sectorData: SectorData): Promise<Folder | null> {
        const sector = sectorData.sector.values().next().value;
        return Folder.create({
            name: Utils.getEntityJournalName(sector, this.options.addTypeToEntityJournal),
            type: "JournalEntry",
            flags: Utils.getEntityFlags(sector),
        });
    }

    getContainingSystemId(sectorData: SectorData, entity: BaseEntity): string | null {
        if (entity.parentEntity) {
            if (entity.parentEntity === 'sector') {
                return entity.id;
            } else if (entity.parentEntity === 'system' || entity.parentEntity === 'blackHole') {
                return entity.parent;
            } else {
                const parent = (<Map<string, BaseEntity>>sectorData[entity.parentEntity]).get(entity.parent);
                if (parent) {
                    return this.getContainingSystemId(sectorData, parent);
                } else {
                    return null;
                }
            }
        } else {
            return null;
        }
    }
}

