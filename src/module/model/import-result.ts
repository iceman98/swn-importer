import { SectorData } from './sector-data';

export interface ImportResult {
    sectorData?: SectorData,
    sectorJournalFolder?: Folder | null,
    systemJournalFolders?: Folder[],
    entityJournals?: JournalEntry[],
    scene?: Scene | null
}