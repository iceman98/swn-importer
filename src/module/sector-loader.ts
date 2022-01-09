import { FolderUtils } from './folder-utils';
import { JournalUtils } from './journal-utils';
import { Options } from './model/options';
import { SectorData } from './model/sector-data';
import { SectorTree } from './model/sector-tree';
import { SceneUtils } from './scene-utils';
import { Utils } from './utils';

export class SectorLoader {
    constructor(private sectorData: SectorData, private options: Options) { }

    /**
     * Imports the sector data into Foundry and return it as a tree
     * @returns The sector tree
     */
    async import(): Promise<SectorTree> {
        const nodeMap = Utils.getDataAsNodeMap(this.sectorData);
        const tagMap = Utils.getTagMap(Utils.getValueList(nodeMap));
        Utils.linkTreeNodes(nodeMap);

        for (const node of nodeMap.values()) {
            if (node.type === 'sector') {
                const tree = { nodeMap, root: node, tagMap };
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
        await this.createTagJournals(sectorTree);
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

    private async createTagJournals(sectorTree: SectorTree) {
        const tagFolder = await Folder.create({
            name: "Tags",
            type: "JournalEntry",
            parent: sectorTree.root.folder
        });
        const journalDataPromises = Utils.getValueList(sectorTree.tagMap).map(node => JournalUtils.getTagJournalData(node, <Folder>tagFolder));
        const journalData = await Promise.all(journalDataPromises);
        const journalEntries = await JournalEntry.create(journalData);
        Utils.getAsList(journalEntries).forEach(e => {
            const tag = sectorTree.tagMap.get(Utils.getIdFlag(e));
            if (tag) {
                tag.journal = e;
            }
        });
    }

    private async createSystemFolders(sectorTree: SectorTree) {
        const folderData: Partial<Folder.Data>[] = [];
        sectorTree.root.children.forEach(node => {
            if (node.type !== 'note') {
                folderData.push(FolderUtils.getFolderData(node, this.options));
            }
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
            if (node.type !== 'note') {
                journalData.push(JournalUtils.getEmptyJournalData(node, this.options));
            }
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
        const journalData: Partial<JournalEntry.Data>[] = [];
        for (const node of sectorTree.nodeMap.values()) {
            if (node.type !== 'note') {
                journalData.push(await JournalUtils.getUpdateJournalData(node, this.options));
            }
        }
        await (<any>JournalEntry).updateDocuments(journalData);
    }

    private async createScene(sectorTree: SectorTree) {
        const scene = await Scene.create(SceneUtils.getSceneData(sectorTree, this.options));
        if (scene) {
            const thumbnail = await scene.createThumbnail({ img: null });
            await scene.update(<any>{ thumb: thumbnail.thumb }, {});
        } else {
            throw new Error("Couldn't create the scene");
        }
    }

}
