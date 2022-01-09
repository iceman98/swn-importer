import { TreeNode } from './tree-node';
import { TreeTag } from './tree-tag';

export interface SectorTree {
    nodeMap: Map<string, TreeNode>;
    root: TreeNode;
    tagMap: Map<string, TreeTag>;
}
