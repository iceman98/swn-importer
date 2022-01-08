import { TreeNode } from './tree-node';

export interface SectorTree {
    nodeMap: Map<string, TreeNode>;
    root: TreeNode;
}
