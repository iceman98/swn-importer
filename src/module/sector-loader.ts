import { FolderUtils } from './folder-utils';
import { JournalUtils } from './journal-utils';
import { Options } from './model/options';
import { SectorData } from './model/sector-data';
import { SectorTree } from './model/sector-tree';
import { Utils } from './utils';

export class SectorLoader {
    constructor(private sectorData: SectorData, private options: Options) { }

    async import(): Promise<SectorTree> {
        const nodeMap = Utils.getDataAsNodeMap(this.sectorData);
        Utils.linkTreeNodes(nodeMap);

        for (const node of nodeMap.values()) {
            if (node.type === 'sector') {
                const tree = { nodeMap, root: node };
                await this.importIntoFoundry(tree);
                return tree;
            }
        }

        throw new Error("The sector data could not be processed");
    }

    private async importIntoFoundry(sectorTree: SectorTree) {
        await this.createSectorFolder(sectorTree);
        await this.createSystemFolders(sectorTree);
        await this.createEntityJournals(sectorTree);
        await this.updateJournalContents(sectorTree);
        await this.createScene(sectorTree);
    }

    private async createSectorFolder(sectorTree: SectorTree) {
        const folder = await Folder.create(FolderUtils.getFolderData(sectorTree.root, this.options));

        if (folder) {
            sectorTree.root.folder = folder;
        } else {
            throw new Error("Could not create a folder for the sector");
        }
    }

    private async createSystemFolders(sectorTree: SectorTree) {
        const folderData: Partial<Folder.Data>[] = [];
        sectorTree.root.children.forEach(node => {
            folderData.push(FolderUtils.getFolderData(node, this.options));
        });

        const folders = Utils.getAsList(await Folder.create(folderData));
        folders.forEach(folder => {
            const entityId = Utils.getIdFlag(folder);
            const node = sectorTree.nodeMap.get(entityId);
            if (node) {
                node.folder = folder;
            }
        });
    }

    private async createEntityJournals(sectorTree: SectorTree) {
        const journalData: Partial<JournalEntry.Data>[] = [];
        sectorTree.nodeMap.forEach(node => {
            journalData.push(JournalUtils.getEmptyJournalData(node, this.options));
        });

        const journals = Utils.getAsList(await JournalEntry.create(journalData));
        journals.forEach(journal => {
            const entityId = Utils.getIdFlag(journal);
            const node = sectorTree.nodeMap.get(entityId);
            if (node) {
                node.journal = journal;
            }
        });
    }

    private async updateJournalContents(sectorTree: SectorTree) {
        sectorTree; //TODO: implement
    }

    private async createScene(sectorTree: SectorTree) {
        sectorTree; //TODO: implement
    }

}
