import { BaseEntity } from './model/base-entity';
import { PositionedEntity } from './model/positioned-entity';
import { Sector } from './model/sector';
import { SectorData } from './model/sector-data';

export class Utils {

    static readonly MODULE_ID = "swn-importer";
    static readonly LOCALIZATION_NAMESPACE = "SWN-IMPORTER";

    static getLabel(name: string): string {
        return game.i18n.localize(this.LOCALIZATION_NAMESPACE + "." + name);
    }

    static getSystemFolderName(system: PositionedEntity, includeCoordinates: boolean): string {
        return includeCoordinates ? `[${this.getSystemCoordinates(system)}] ${system.name}` : system.name;
    }

    static getEntityJournalName(entity: BaseEntity, includeType: boolean): string {
        if (includeType) {
            return `${this.getTypeName(entity.type)} - ${entity.name}`;
        } else {
            return entity.name;
        }
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

    static getEntityFlags(entity: BaseEntity | Sector): { [k: string]: any } {
        const flags: { [k: string]: any } = {};
        flags[this.MODULE_ID + "." + "id"] = entity.id;
        flags[this.MODULE_ID + "." + "type"] = entity.type;
        return flags;
    }

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

    static filterByTagId(entities: Entity[], id: string): Entity[] {
        return entities.filter(e => e.getFlag(this.MODULE_ID, "id") === id);
    }

    static forEachEntityType(sectorData: SectorData, types: 'all' | 'only-basic' | 'only-systems', consumer: (type: keyof SectorData, entities: Map<string, BaseEntity>) => void) {
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
            const map = <Map<string, BaseEntity>>sectorData[type];
            consumer(type, map);
        });
    }

    static forEachEntity(sectorData: SectorData, types: 'all' | 'only-basic' | 'only-systems', consumer: (key: string, entity: BaseEntity, type: keyof SectorData) => void) {
        this.forEachEntityType(sectorData, types, (type, map) => {
            map.forEach((v, k, _) => {
                consumer(k, v, type);
            });
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

    static getMapValues<K, V>(map: Map<K, V>): V[] {
        const values: V[] = [];
        map.forEach((v, _, __) => {
            values.push(v);
        });
        return values;
    }

}
