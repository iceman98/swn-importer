import { SectorData } from './model/sector-data';
import { BaseEntity } from './model/base-entity';
import { Map } from './model/map';

const MODULE_NAME = 'swn-importer';
// const HEX_RADIUS = 100;
// const HEX_WIDTH = 2 * HEX_RADIUS;
// const HEX_HEIGHT = 2 * Utils.sqrt(-1 * ((HEX_RADIUS / 2) ** 2 - HEX_RADIUS ** 2));

export class Importer {
    importFile(fileName: string) {
        fetch(fileName).then(str => str.json()).then(d => {
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
        // const sector = sectorData.sector.values()[0];

        this.createFolders(sectorData).then(fs => this.createJournals(sectorData, fs));

        // const sceneData: Partial<Scene.Data> = {
        //     name: sector.name,
        //     active: true,
        //     navigation: false,
        //     gridType: CONST.GRID_TYPES.HEXODDQ,
        //     grid: HEX_WIDTH,
        //     gridDistance: 1,
        //     gridUnits: "spaces",
        //     width: Utils.getMapWidth(sector.columns, HEX_WIDTH),
        //     height: Utils.getMapHeight(sector.rows, HEX_HEIGHT),
        //     padding: 0,
        //     notes: this.getNotes(sectorData),
        //     img: `modules/${MODULE_NAME}/images/starfield.png`,
        //     gridColor: "#aaaaaa",
        //     gridAlpha: 0.6,
        //     backgroundColor: "#000000",
        // };
        // Scene.create(sceneData);
    }

    createJournals(sectorData: SectorData, fs: Folder | Folder[] | null): Promise<JournalEntry | JournalEntry[] | null> {
        if (fs) {
            const journals: Partial<JournalEntry.Data>[] = [];
            const systems = fs instanceof Folder ? [fs] : fs;

            this.createEntityJournals(sectorData, 'asteroidBase', systems).forEach(j => journals.push(j));
            this.createEntityJournals(sectorData, 'asteroidBelt', systems).forEach(j => journals.push(j));
            this.createEntityJournals(sectorData, 'deepSpaceStation', systems).forEach(j => journals.push(j));
            this.createEntityJournals(sectorData, 'gasGiantMine', systems).forEach(j => journals.push(j));
            this.createEntityJournals(sectorData, 'moon', systems).forEach(j => journals.push(j));
            this.createEntityJournals(sectorData, 'moonBase', systems).forEach(j => journals.push(j));
            this.createEntityJournals(sectorData, 'orbitalRuin', systems).forEach(j => journals.push(j));
            this.createEntityJournals(sectorData, 'planet', systems).forEach(j => journals.push(j));
            this.createEntityJournals(sectorData, 'refuelingStation', systems).forEach(j => journals.push(j));
            this.createEntityJournals(sectorData, 'researchBase', systems).forEach(j => journals.push(j));
            this.createEntityJournals(sectorData, 'spaceStation', systems).forEach(j => journals.push(j));

            return JournalEntry.create(journals);
        } else {
            return Promise.resolve(null);
        }
    }

    createEntityJournals(sectorData: SectorData, type: keyof SectorData, systemFolders: Folder[]): Partial<JournalEntry.Data>[] {
        const journals: Partial<JournalEntry.Data>[] = [];
        const entities = <Map<string, BaseEntity>>sectorData[type];

        entities.forEach((k, v) => {
            journals.push({
                type: 'JournalEntry',
                name: this.getJournalName(v, type),
                content: this.getJournalContent(v, type),
                folder: this.getContainingSystemFolder(sectorData, systemFolders, v),
                flags: { "swn-importer.id": k, "swn-importer.type": type }
            });
        });

        return journals;
    }

    getContainingSystemFolder(sectorData: SectorData, systemFolders: Folder[], entity: BaseEntity): string | undefined {
        const systemId = this.getContainingSystemId(sectorData, entity);
        if (systemId) {
            return systemFolders.filter(f => f.getFlag(MODULE_NAME, 'id') === systemId)[0].id;
        } else {
            return undefined;
        }
    }

    getJournalContent(entity: BaseEntity, type: keyof SectorData): string {
        if ('atmosphere' in entity.attributes) {
            return this.getPlanetJournalContent(entity);
        } else {
            const typeName = this.getTypeName(type);
            return `This is a journal for the ${typeName} entity called ${entity.name}\n${JSON.stringify(entity)}`;
        }
    }

    getPlanetJournalContent(planet: BaseEntity): string {
        // const attributes = <PlanetAttributes>planet.attributes;
        //renderTemplate('static/templates/planet.html', { ...attributes, name: planet.name });
        return `This is a journal for the Planet called ${planet.name}\n${JSON.stringify(planet)}`;
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

    createFolders(sectorData: SectorData) {
        return this.createSectorJournalFolder(sectorData).then(f => this.createSystemJournalFolders(sectorData, f))
    }

    createSystemJournalFolders(sectorData: SectorData, parentFolder: Folder | null): Promise<Folder | Folder[] | null> {
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

            return Folder.create(folders);
        } else {
            return Promise.resolve(null);
        }
    }

    createSectorJournalFolder(sectorData: SectorData): Promise<Folder | null> {
        const sector = sectorData.sector.entries()[0];
        const randomNumber = Math.floor(Math.random() * 100);
        const sectorName = `Sector - ${sector.value.name} ${randomNumber}`;
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

