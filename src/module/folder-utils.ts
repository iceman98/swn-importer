import { TreeNode } from './model/tree-node';
import { Utils } from './utils';
import { Options } from './model/options';

export class FolderUtils {
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
