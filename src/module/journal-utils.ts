import { FolderUtils } from './folder-utils';
import { Options } from './model/options';
import { TreeNode } from './model/tree-node';
import { Utils } from './utils';

export class JournalUtils {
    static getEmptyJournalData(node: TreeNode, options: Options): Partial<JournalEntry.Data> {
        const hidden = (options.onlyGMJournals || node.entity.isHidden);
        const permission: Entity.Permission = {
            default: hidden ? CONST.ENTITY_PERMISSIONS.NONE : CONST.ENTITY_PERMISSIONS.OBSERVER
        };

        const name = options.addTypeToEntityJournal ? `[${Utils.getTypeName(node.type)}] ${node.entity.name}` : node.entity.name;
        const folder = FolderUtils.getContainingFolder(node)?.id;

        const journal: Partial<JournalEntry.Data> = {
            type: 'JournalEntry',
            name,
            folder,
            flags: Utils.getNodeFlags(node),
            permission
        };
        
        return journal;
    }
}
