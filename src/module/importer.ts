import { SectorData } from './model/sector-data';
import { BaseEntity } from './model/base-entity';
import { Map } from './model/map';
import { PlanetAttributes } from './model/planet-attributes';
import { Attributes } from './model/attributes';
import { PositionedEntity } from './model/positioned-entity';

const MODULE_NAME = 'swn-importer';
const HEX_RADIUS = 100;
const HEX_WIDTH = 2 * HEX_RADIUS;
const HEX_HEIGHT = 2 * ((-1 * ((HEX_RADIUS / 2) ** 2 - HEX_RADIUS ** 2)) ** 0.5);
const HEX_VERTICAL_RADIUS = HEX_HEIGHT / 2;

export class Importer {

    constructor(private fileName: string) {
        game.folders?.forEach(f => f.delete());
        game.journal?.forEach(j => j.delete());
        game.scenes?.forEach(s => s.delete());
    }

    importFile() {
        fetch(this.fileName).then(str => str.json()).then(d => {
            const data: SectorData = {
                asteroidBase: new Map(d.asteroidBase),
                asteroidBelt: new Map(d.asteroidBelt),
                blackHole: new Map(d.blackHole),
                deepSpaceStation: new Map(d.deepSpaceStation),
                gasGiantMine: new Map(d.gasGiantMine),
                moon: new Map(d.moon),
                moonBase: new Map(d.moonBase),
                note: null,
                orbitalRuin: new Map(d.orbitalRuin),
                planet: new Map(d.planet),
                refuelingStation: new Map(d.refuelingStation),
                researchBase: new Map(d.researchBase),
                sector: new Map(d.sector),
                spaceStation: new Map(d.spaceStation),
                system: new Map(d.system)
            };
            this.processSector(data);
        });
    }

    processSector(sectorData: SectorData) {
        const holder: {
            sectorJournalFolder?: Folder | null,
            systemJournalFolders?: Folder[],
            entityJournals?: JournalEntry[],
            scene?: Scene | null
        } = {};

        Promise.resolve(sectorData)
            .then(d => {
                return this.createSectorJournalFolder(d)
            })
            .then(f => {
                holder.sectorJournalFolder = f;
                return this.createSystemJournalFolders(sectorData, f);
            })
            .then(sf => {
                holder.systemJournalFolders = sf;
                return this.createJournals(sectorData, sf);
            })
            .then(js => {
                holder.entityJournals = js;
                return this.createScene(sectorData, js);
            })
            .then(s => {
                holder.scene = s;
            });
    }

    createScene(sectorData: SectorData, journals): Promise<Scene | null> {
        const sector = sectorData.sector.entries()[0];

        const notes: Note.Data[] = [];
        notes.push(...this.createEntityNotes(sectorData, 'system', journals));
        notes.push(...this.createEntityNotes(sectorData, 'blackHole', journals));

        const sceneData: Partial<Scene.Data> = {
            active: true,
            backgroundColor: "#000000",
            flags: { "swn-importer.id": sector.key, "swn-importer.type": 'sector' },
            grid: HEX_WIDTH,
            gridAlpha: 0.6,
            gridColor: "#aaaaaa",
            gridDistance: 1,
            gridType: CONST.GRID_TYPES.HEXODDQ,
            gridUnits: "units",
            height: this.getSceneHeight(sector.value.rows),
            img: "modules/swn-importer/images/starfield.png",
            name: `Sector ${sector.value.name} ${(new Date()).getTime()}`,
            padding: 0,
            notes: notes,
            width: this.getSceneWidth(sector.value.columns)
        };

        return Scene.create(sceneData);
    }

    getSceneWidth(columns: number): number {
        return Math.floor((((3 / 4) * HEX_WIDTH) * columns) + ((1 / 4) * HEX_WIDTH));
    }

    getSceneHeight(rows: number): number {
        return Math.floor((rows + 1) * HEX_HEIGHT);
    }

    createEntityNotes(sectorData: SectorData, type: keyof SectorData, journals: JournalEntry[]): Note.Data[] {
        const entities = <Map<string, BaseEntity>>sectorData[type];

        journals.map;

        const notes = entities.entries().map(e => {
            const iconData: { x: number; y: number; } = this.getIconPosition(sectorData, type, e.value);

            const note: any = {
                entryId: this.getJournalEntry(journals, e.key),
                x: iconData.x,
                y: iconData.y,
                icon: this.getEntityIcon(type),
                iconSize: 32,
                text: e.value.name,
                //flags: { "swn-importer.id": e.key, "swn-importer.type": type }
            };

            return note;
        });

        return notes;
    }

    getJournalEntry(journals: JournalEntry[], key: string): string | null {
        const journal = journals.filter(j => j.getFlag(MODULE_NAME, "id") === key);
        return journal.length ? journal[0].id : null;
    }

    getEntityIcon(type: keyof SectorData): string | null {
        switch (type) {
            case 'system':
                return "modules/swn-importer/images/sun.png";
            case 'blackHole':
                return "modules/swn-importer/images/blackhole.png";
            default:
                return null;
        }
    }

    getEntityOffset(type: keyof SectorData): { horizontal: number, vertical: number } {
        switch (type) {
            case 'system':
                return { horizontal: 0, vertical: 0 };
            case 'blackHole':
                return { horizontal: 0, vertical: 0 };
            default:
                return { horizontal: 0, vertical: 0 };
        }
    }

    getIconPosition(sectorData: SectorData, type: keyof SectorData, entity: BaseEntity): { x: number; y: number; } {
        let row: number;
        let column: number;

        sectorData; // TODO: remove

        if ('x' in entity) {
            const positionedEntity = <PositionedEntity>entity;
            column = positionedEntity.x - 1;
            row = positionedEntity.y - 1;
        } else {
            row = 0;
            column = 0;
        }

        const offset = this.getEntityOffset(type);

        if (column % 2 == 0) {
            offset.vertical += HEX_VERTICAL_RADIUS;
        }

        return {
            x: Math.floor(((3 / 4) * HEX_WIDTH * column) + HEX_RADIUS + offset.horizontal),
            y: Math.floor((HEX_HEIGHT * row) + HEX_VERTICAL_RADIUS + offset.vertical)
        };
    }

    createJournals(sectorData: SectorData, systems: Folder[]): Promise<JournalEntry[]> {
        const promises: Promise<Partial<JournalEntry.Data>[]>[] = [];

        promises.push(this.createEntityJournals(sectorData, 'asteroidBase', systems));
        promises.push(this.createEntityJournals(sectorData, 'asteroidBelt', systems));
        promises.push(this.createEntityJournals(sectorData, 'deepSpaceStation', systems));
        promises.push(this.createEntityJournals(sectorData, 'gasGiantMine', systems));
        promises.push(this.createEntityJournals(sectorData, 'moon', systems));
        promises.push(this.createEntityJournals(sectorData, 'moonBase', systems));
        promises.push(this.createEntityJournals(sectorData, 'orbitalRuin', systems));
        promises.push(this.createEntityJournals(sectorData, 'planet', systems));
        promises.push(this.createEntityJournals(sectorData, 'refuelingStation', systems));
        promises.push(this.createEntityJournals(sectorData, 'researchBase', systems));
        promises.push(this.createEntityJournals(sectorData, 'spaceStation', systems));

        return Promise.all(promises).then(jaa => {
            const journals: Partial<JournalEntry.Data>[] = [];
            jaa.forEach(ja => {
                ja.forEach(j => journals.push(j));
            });
            return JournalEntry.create(journals).then(js => js ? (js instanceof JournalEntry ? [js] : js) : []);
        });
    }

    createEntityJournals(sectorData: SectorData, type: keyof SectorData, systemFolders: Folder[]): Promise<Partial<JournalEntry.Data>[]> {
        const entities = <Map<string, BaseEntity>>sectorData[type];

        const promises = entities.entries().map(e => {
            return new Promise<Partial<JournalEntry.Data>>(accept => {
                this.getJournalContent(e.value, type).then(c => {
                    const journal = {
                        type: 'JournalEntry',
                        name: this.getJournalName(e.value, type),
                        folder: this.getContainingSystemFolder(sectorData, systemFolders, e.value),
                        content: c,
                        flags: { "swn-importer.id": e.key, "swn-importer.type": type }
                    };
                    accept(journal);
                });
            });
        });

        return Promise.all(promises);
    }

    getContainingSystemFolder(sectorData: SectorData, systemFolders: Folder[], entity: BaseEntity): string | undefined {
        const systemId = this.getContainingSystemId(sectorData, entity);
        if (systemId) {
            const folder = systemFolders.filter(f => f.getFlag(MODULE_NAME, 'id') === systemId);
            if (folder.length) {
                return folder[0].id;
            } else {
                return undefined;
            }
        } else {
            return undefined;
        }
    }

    getJournalContent(entity: BaseEntity, type: keyof SectorData): Promise<string> {
        if ('atmosphere' in entity.attributes) {
            return this.getPlanetJournalContent(entity);
        } else {
            return this.getEntityJournalContent(entity, type);
        }
    }

    getEntityJournalContent(entity: BaseEntity, type: keyof SectorData): Promise<string> {
        const attributes = <Attributes>entity.attributes;
        return renderTemplate('modules/swn-importer/templates/entity.html', {
            ...attributes,
            name: entity.name,
            type: this.getTypeName(type)
        });
    }

    getPlanetJournalContent(planet: BaseEntity): Promise<string> {
        const attributes = <PlanetAttributes>planet.attributes;
        return renderTemplate('modules/swn-importer/templates/planet.html', {
            ...attributes,
            name: planet.name
        });
    }

    getTypeName(type: keyof SectorData): string | null {
        switch (type) {
            case 'asteroidBase':
                return "Asteroid Base";
            case 'asteroidBelt':
                return "Asteroid Belt";
            case 'blackHole':
                return "Black Hole";
            case 'deepSpaceStation':
                return "Deep Space Station";
            case 'gasGiantMine':
                return "Gas Giant Mine";
            case 'moon':
                return "Moon";
            case 'moonBase':
                return "Moon Base";
            case 'orbitalRuin':
                return "Orbital Ruin";
            case 'planet':
                return "Planet";
            case 'refuelingStation':
                return "Refueling Station";
            case 'researchBase':
                return "Research Base";
            case 'sector':
                return "Sector";
            case 'spaceStation':
                return "Space Station";
            case 'system':
                return "System";
            default:
                return null;
        }
    }

    getJournalName(entity: BaseEntity, type: keyof SectorData): string {
        const typeName = this.getTypeName(type);
        return `${typeName} - ${entity.name}`;
    }

    createSystemJournalFolders(sectorData: SectorData, parentFolder: Folder | null): Promise<Folder[]> {
        if (parentFolder) {
            const folders: Partial<Folder.Data>[] = [];

            sectorData.system.forEach((k, v) => {
                const systemName = `System - ${v.name}`;
                folders.push({
                    name: systemName,
                    type: "JournalEntry",
                    parent: parentFolder,
                    flags: { "swn-importer.id": k, "swn-importer.type": "system" }
                });
            });

            sectorData.blackHole.forEach((k, v) => {
                const systemName = `Black Hole - ${v.name}`;
                folders.push({
                    name: systemName,
                    type: "JournalEntry",
                    parent: parentFolder,
                    flags: { "swn-importer.id": k, "swn-importer.type": "blackHole" }
                });
            });

            return Folder.create(folders).then(f => f ? (f instanceof Folder ? [f] : f) : []);
        } else {
            return Promise.resolve([]);
        }
    }

    createSectorJournalFolder(sectorData: SectorData): Promise<Folder | null> {
        const sector = sectorData.sector.entries()[0];
        const sectorName = `Sector - ${sector.value.name} ${(new Date()).getTime()}`;
        return Folder.create({ name: sectorName, type: "JournalEntry", flags: { id: sector.key, type: 'sector' } });
    }

    getContainingSystemId(sectorData: SectorData, entity: BaseEntity): string | null {
        if (entity.parentEntity) {
            if (entity.parentEntity == 'system' || entity.parentEntity == 'blackHole') {
                return entity.parent;
            } else {
                const parent = (<Map<string, BaseEntity>>sectorData[entity.parentEntity]).get(entity.parent);
                return this.getContainingSystemId(sectorData, parent);
            }
        } else {
            return null;
        }
    }
}

