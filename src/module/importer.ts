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
const ORBITING_DISTANCE = 0.5 * HEX_RADIUS;

export class Importer {

    constructor(private fileName: string) {
        game.folders?.forEach(f => f.delete());
        game.journal?.forEach(j => j.delete());
        game.scenes?.forEach(s => s.delete());
    }

    importFile() {
        fetch(this.fileName).then(str => str.json()).then(d => {
            const sectorData: SectorData = {
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

            this.preprocessEntity(sectorData, 'asteroidBase');
            this.preprocessEntity(sectorData, 'asteroidBelt');
            this.preprocessEntity(sectorData, 'blackHole');
            this.preprocessEntity(sectorData, 'deepSpaceStation');
            this.preprocessEntity(sectorData, 'gasGiantMine');
            this.preprocessEntity(sectorData, 'moon');
            this.preprocessEntity(sectorData, 'moonBase');
            this.preprocessEntity(sectorData, 'orbitalRuin');
            this.preprocessEntity(sectorData, 'planet');
            this.preprocessEntity(sectorData, 'refuelingStation');
            this.preprocessEntity(sectorData, 'researchBase');
            this.preprocessEntity(sectorData, 'spaceStation');
            this.preprocessEntity(sectorData, 'system');

            this.processSector(sectorData);
        });
    }

    preprocessEntity(sectorData: SectorData, type: keyof SectorData) {
        const entities = (<Map<string, BaseEntity>>sectorData[type]).entries();
        entities.forEach(e => {
            e.value.id = e.key;
            e.value.type = type;
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

        const notes: Note.Data[] = this.getSectorNotes(sectorData, journals);

        const sceneData: Partial<Scene.Data> = {
            active: true,
            backgroundColor: "#01162c",
            flags: { "swn-importer.id": sector.key, "swn-importer.type": 'sector' },
            grid: HEX_WIDTH,
            gridAlpha: 0.3,
            gridColor: "#99caff",
            gridDistance: 1,
            gridType: CONST.GRID_TYPES.HEXODDQ,
            gridUnits: "units",
            height: this.getSceneHeight(sector.value.rows),
            img: "modules/swn-importer/images/starField.png",
            name: `Sector ${sector.value.name}`,
            padding: 0,
            notes: notes,
            width: this.getSceneWidth(sector.value.columns)
        };

        return Scene.create(sceneData);
    }

    getSectorNotes(sectorData: SectorData, journals: JournalEntry[]): Note.Data[] {
        const notes: Note.Data[] = [];

        const groupedEntities = this.getGroupedEntities(sectorData);

        groupedEntities.forEach((k, v) => {
            const system = this.getSystemById(sectorData, k);
            if (system) {
                notes.push(...this.getSystemNotes(system, journals, v));
            }
        });

        return notes;
    }

    getSystemNotes(system: PositionedEntity, journals: JournalEntry[], entities: BaseEntity[]): Note.Data[] {
        const notes: Note.Data[] = [];

        console.log("Importer", system, entities);

        const systemNote = this.createEntityNote(system, journals);
        if (systemNote) {
            notes.push(systemNote);
        }

        for (let entityIndex = 0; entityIndex < entities.length; entityIndex++) {
            const note = this.createEntityNote(system, journals, entities[entityIndex], entities.length, entityIndex);
            if (note) {
                notes.push(note);
            }
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
        const sectorMap = new Map<string, BaseEntity[]>({});

        sectorData.system.forEach((k, _) => {
            sectorMap.put(k, []);
        });

        sectorData.blackHole.forEach((k, _) => {
            sectorMap.put(k, []);
        });

        sectorData.asteroidBase.forEach((_, v) => {
            const systemId = this.getContainingSystemId(sectorData, v);
            if (systemId) {
                sectorMap.get(systemId).push(v);
            }
        });

        sectorData.asteroidBelt.forEach((_, v) => {
            const systemId = this.getContainingSystemId(sectorData, v);
            if (systemId) {
                sectorMap.get(systemId).push(v);
            }
        });

        sectorData.deepSpaceStation.forEach((_, v) => {
            const systemId = this.getContainingSystemId(sectorData, v);
            if (systemId) {
                sectorMap.get(systemId).push(v);
            }
        });

        sectorData.gasGiantMine.forEach((_, v) => {
            const systemId = this.getContainingSystemId(sectorData, v);
            if (systemId) {
                sectorMap.get(systemId).push(v);
            }
        });

        sectorData.moon.forEach((_, v) => {
            const systemId = this.getContainingSystemId(sectorData, v);
            if (systemId) {
                sectorMap.get(systemId).push(v);
            }
        });

        sectorData.moonBase.forEach((_, v) => {
            const systemId = this.getContainingSystemId(sectorData, v);
            if (systemId) {
                sectorMap.get(systemId).push(v);
            }
        });

        sectorData.orbitalRuin.forEach((_, v) => {
            const systemId = this.getContainingSystemId(sectorData, v);
            if (systemId) {
                sectorMap.get(systemId).push(v);
            }
        });

        sectorData.planet.forEach((_, v) => {
            const systemId = this.getContainingSystemId(sectorData, v);
            if (systemId) {
                sectorMap.get(systemId).push(v);
            }
        });

        sectorData.refuelingStation.forEach((_, v) => {
            const systemId = this.getContainingSystemId(sectorData, v);
            if (systemId) {
                sectorMap.get(systemId).push(v);
            }
        });

        sectorData.researchBase.forEach((_, v) => {
            const systemId = this.getContainingSystemId(sectorData, v);
            if (systemId) {
                sectorMap.get(systemId).push(v);
            }
        });

        sectorData.spaceStation.forEach((_, v) => {
            const systemId = this.getContainingSystemId(sectorData, v);
            if (systemId) {
                sectorMap.get(systemId).push(v);
            }
        });

        const result = new Map<string, BaseEntity[]>({});
        sectorMap.forEach((k, v) => {
            result.put(k, this.getSortedEntityArray(v));
        });

        return result;
    }

    getSortedEntityArray(entities: BaseEntity[]): BaseEntity[] {
        const result: BaseEntity[] = [];

        entities.filter(ab => ab.type === 'asteroidBelt').forEach(ab => {
            result.push(ab);
            entities.filter(b => b.type === 'asteroidBase' && b.parent === ab.id).forEach(b => result.push(b));
            entities.filter(rs => rs.type === 'refuelingStation' && rs.parent === ab.id).forEach(rs => result.push(rs));
        });

        entities.filter(p => p.type === 'planet').forEach(p => {
            result.push(p);
            entities.filter(m => m.type === 'moon' && m.parent === p.id).forEach(m => {
                result.push(m);
                entities.filter(mb => mb.type === 'moonBase' && mb.parent === m.id).forEach(mb => result.push(mb));
                entities.filter(or => or.type === 'orbitalRuin' && or.parent === m.id).forEach(or => result.push(or));
                entities.filter(rs => rs.type === 'refuelingStation' && rs.parent === m.id).forEach(rs => result.push(rs));
                entities.filter(rb => rb.type === 'researchBase' && rb.parent === m.id).forEach(rb => result.push(rb));
            });
            entities.filter(ggm => ggm.type === 'gasGiantMine' && ggm.parent === p.id).forEach(ggm => result.push(ggm));
            entities.filter(or => or.type === 'orbitalRuin' && or.parent === p.id).forEach(or => result.push(or));
            entities.filter(rs => rs.type === 'refuelingStation' && rs.parent === p.id).forEach(rs => result.push(rs));
            entities.filter(rb => rb.type === 'researchBase' && rb.parent === p.id).forEach(rb => result.push(rb));
            entities.filter(ss => ss.type === 'spaceStation' && ss.parent === p.id).forEach(ss => result.push(ss));
        });

        entities.filter(rs => rs.type === 'refuelingStation' && rs.parentEntity === 'system').forEach(rs => result.push(rs));
        entities.filter(rs => rs.type === 'refuelingStation' && rs.parentEntity === 'blackHole').forEach(rs => result.push(rs));

        entities.filter(rb => rb.type === 'researchBase' && rb.parentEntity === 'system').forEach(rs => result.push(rs));
        entities.filter(rb => rb.type === 'researchBase' && rb.parentEntity === 'blackHole').forEach(rs => result.push(rs));

        entities.filter(dss => dss.type === 'deepSpaceStation' && dss.parentEntity === 'system').forEach(dss => result.push(dss));
        entities.filter(dss => dss.type === 'deepSpaceStation' && dss.parentEntity === 'blackHole').forEach(dss => result.push(dss));

        if (result.length != entities.length) {
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
                entryId: entity ? this.getJournalEntry(journals, entity.id) : null,
                x: iconPosition.x,
                y: iconPosition.y,
                icon: this.getEntityIcon(entity ? entity.type : parentEntity.type),
                iconSize: 32,
                text: entity ? entity.name : parentEntity.name,
                //flags: { "swn-importer.id": e.key, "swn-importer.type": type }
            };

            console.log("Importer", note);

            return note;
        } else {
            return null;
        }
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
                return "modules/swn-importer/images/blackHole.png";
            case 'asteroidBase':
                return "modules/swn-importer/images/asteroidBase.png";
            case 'asteroidBelt':
                return "modules/swn-importer/images/asteroidBelt.png";
            case 'moon':
                return "modules/swn-importer/images/moon.png";
            case 'planet':
                return "modules/swn-importer/images/planet.png";
            case 'gasGiantMine':
                return "modules/swn-importer/images/gasGiant.png";
            case 'researchBase':
                return "modules/swn-importer/images/researchBase.png";
            case 'refuelingStation':
                return "modules/swn-importer/images/refuelingStation.png";
            case 'spaceStation':
                return "modules/swn-importer/images/spaceStation.png";
            case 'moonBase':
                return "modules/swn-importer/images/moonBase.png";
            case 'deepSpaceStation':
                return "modules/swn-importer/images/deepSpaceStation.png";
            case 'orbitalRuin':
                return "modules/swn-importer/images/orbitalRuin.png";
            default:
                return CONST.DEFAULT_NOTE_ICON;
        }
    }

    getIconPosition(parentEntity: PositionedEntity, entityCount?: number, entityIndex?: number): { x: number; y: number; } | null {
        const column = parentEntity.x - 1;
        const row = parentEntity.x - 1;

        let offset: { horizontal: number, vertical: number };

        if (entityCount && entityIndex) {
            offset = this.getEntityOffset(entityCount, entityIndex);
        } else {
            offset = { horizontal: 0, vertical: 0 };
        }

        if (column % 2 == 0) {
            offset.vertical += HEX_VERTICAL_RADIUS;
        }

        return {
            x: Math.floor(((3 / 4) * HEX_WIDTH * column) + HEX_RADIUS + offset.horizontal),
            y: Math.floor((HEX_HEIGHT * row) + HEX_VERTICAL_RADIUS + offset.vertical)
        };
    }

    getEntityOffset(entityCount: number, entityIndex: number): { horizontal: number, vertical: number } {
        const step = (2 * Math.PI) / entityCount;
        const angle = entityIndex * step;

        const x = Math.cos(angle) * ORBITING_DISTANCE;
        const y = Math.sin(angle) * ORBITING_DISTANCE;

        return { horizontal: x, vertical: y };
    }

    getContainingSystem(sectorData: SectorData, entity: BaseEntity): PositionedEntity | null {
        const systemId = this.getContainingSystemId(sectorData, entity);
        if (systemId) {
            const system = sectorData.system.get(systemId);
            const blackHole = sectorData.blackHole.get(systemId);
            return system || blackHole;
        } else {
            return null;
        }
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
        const sectorName = `Sector - ${sector.value.name}`;
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

