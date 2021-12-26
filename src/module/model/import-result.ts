import { BaseEntity } from './base-entity';
import { SectorData } from './sector-data';

export interface ImportResult {
    sectorData?: SectorData,
    groupedEntities?: Map<string, BaseEntity[]>,
    sectorJournalFolder?: Folder | null,
    systemJournalFolders?: Folder[],
    entityJournals?: JournalEntry[],
    scene?: Scene | null
}