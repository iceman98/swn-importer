import { BaseEntity } from './model/base-entity';
import { Sector } from './model/sector';
import { SectorData } from './model/sector-data';
import { Map } from './model/map';

export class Utils {

    static readonly MODULE_ID = "swn-importer";
    static readonly LOCALIZATION_NAMESPACE = "SWN-IMPORTER";

    static getLabel(name: string): string {
        return game.i18n.localize(this.LOCALIZATION_NAMESPACE + "." + name);
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

    static forEachEntityType(sectorData: SectorData, types: 'all' | 'only-basic', consumer: (type: keyof SectorData, entities: Map<string, BaseEntity>) => void) {
        const entities: (keyof SectorData)[] = types === 'all' ?
            ['asteroidBase', 'asteroidBelt', 'blackHole', 'deepSpaceStation', 'gasGiantMine', 'moon', 'moonBase', 'orbitalRuin', 'planet', 'refuelingStation', 'researchBase', 'sector', 'spaceStation', 'system'] :
            ['asteroidBase', 'asteroidBelt', 'deepSpaceStation', 'gasGiantMine', 'moon', 'moonBase', 'orbitalRuin', 'planet', 'refuelingStation', 'researchBase', 'spaceStation'];

        entities.forEach(type => {
            const map = <Map<string, BaseEntity>>sectorData[type];
            consumer(type, map);
        });
    }

    static forEachEntity(sectorData: SectorData, types: 'all' | 'only-basic', consumer: (key: string, entity: BaseEntity, type: keyof SectorData) => void) {
        this.forEachEntityType(sectorData, types, (type, map) => {
            map.entries().forEach(e => {
                consumer(e.key, e.value, type);
            });
        });
    }
}
