import { BaseEntity } from './base-entity';
import { SectorData } from './sector-data';

export interface ImporterSystem {
    system: BaseEntity;
    entities: { type: keyof SectorData, entity: BaseEntity }[];
}
