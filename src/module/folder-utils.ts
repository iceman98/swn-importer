import { TreeNode } from './model/tree-node';
import { Utils } from './utils';
import { Options } from './model/options';

export class FolderUtils {
    /**
     * Gets a Foundry Folder Data object to generate a folder for an entity
     * @param node The tree node to generate a folder for
     * @param options The options object
     * @returns The Foundry Folder Data
     */
    static getFolderData(node: TreeNode, options: Options): Partial<Folder.Data> {
        let name: string;
        const parent: Folder | undefined = FolderUtils.getContainingFolder(node);

        switch (node.type) {
            case 'system':
            case 'blackHole':
                name = options.prefixSystemFoldersWithCoordinates ? `[${node.coordinates}] ${node.entity.name}` : node.entity.name;
                break;
            default:
                name = node.entity.name;
                break;
        }

        return {
            name,
            type: "JournalEntry",
            parent,
            flags: Utils.getNodeFlags(node),
        }
    }

    /**
     * Get the containing folder of an entity, going up the hierarchy if necessary
     * @param node The node to find the folder for
     * @returns The Foundry folder or undefined if not found
     */
    static getContainingFolder(node: TreeNode): Folder | undefined {
        if (node.folder) {
            return node.folder;
        } else {
            if (node.parent) {
                return FolderUtils.getContainingFolder(node.parent);
            } else {
                return undefined;
            }
        }
    }
}
