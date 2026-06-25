import type { WorkspaceTreeNode } from "@shared/contracts";

export function countSkillsInTree(nodes: WorkspaceTreeNode[]): number {
  let count = 0;
  for (const node of nodes) {
    if (node.kind === "skill") {
      count++;
    }
    if (node.children && node.children.length > 0) {
      count += countSkillsInTree(node.children);
    }
  }
  return count;
}
