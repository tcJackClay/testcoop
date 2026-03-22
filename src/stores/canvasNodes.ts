// Canvas Nodes - 节点相关操作
import type { StateCreator } from 'zustand';
import type { CanvasState, CanvasNode, NodeType } from './canvasTypes';
import { nodeDefaults, generateNodeId } from './canvasNodeDefaults';

export interface CanvasNodesSlice {
  addNode: (type: NodeType, position: { x: number; y: number }, initialData?: Partial<CanvasNode>) => string;
  updateNode: (id: string, data: Partial<CanvasNode>) => void;
  deleteNode: (id: string) => void;
  deleteSelectedNodes: () => void;
  moveNode: (id: string, position: { x: number; y: number }) => void;
  moveSelectedNodes: (deltaX: number, deltaY: number) => void;
  selectNode: (id: string, multi?: boolean) => void;
  clearSelection: () => void;
  selectNodesInBox: (box: { x: number; y: number; width: number; height: number }) => void;
  selectAll: () => void;
  copyNodes: () => void;
  pasteNodes: (offset?: { x: number; y: number }) => void;
}

export const createCanvasNodesSlice: StateCreator<CanvasState, [], [], CanvasNodesSlice> = (set, get) => ({
  // Add new node
  addNode: (type, position, initialData) => {
    const defaults = nodeDefaults[type] || { type, data: { label: type } };
    const newNode: CanvasNode = {
      id: generateNodeId(),
      ...defaults,
      position,
      data: { ...defaults.data, ...(initialData?.data || {}) },
    } as CanvasNode;
    get().saveToUndoStack();
    set((state) => ({ nodes: [...state.nodes, newNode] }));
    return newNode.id;
  },

  // Update node data
  updateNode: (id, data) => {
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, ...data } : n)),
    }));
  },

  // Delete single node
  deleteNode: (id) => {
    get().saveToUndoStack();
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      connections: state.connections.filter((c) => c.sourceId !== id && c.targetId !== id),
      selectedNodeIds: state.selectedNodeIds.filter((nid) => nid !== id),
    }));
  },

  // Delete all selected nodes
  deleteSelectedNodes: () => {
    const { selectedNodeIds } = get();
    if (selectedNodeIds.length === 0) return;
    get().saveToUndoStack();
    set((state) => ({
      nodes: state.nodes.filter((n) => !selectedNodeIds.includes(n.id)),
      connections: state.connections.filter(
        (c) => !selectedNodeIds.includes(c.sourceId) && !selectedNodeIds.includes(c.targetId)
      ),
      selectedNodeIds: [],
    }));
  },

  // Move node to new position
  moveNode: (id, position) => {
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, position } : n)),
    }));
  },

  // Move all selected nodes by delta
  moveSelectedNodes: (deltaX, deltaY) => {
    const { selectedNodeIds, nodes } = get();
    if (selectedNodeIds.length === 0) return;
    
    set((state) => ({
      nodes: state.nodes.map((n) => {
        if (selectedNodeIds.includes(n.id)) {
          return {
            ...n,
            position: {
              x: n.position.x + deltaX,
              y: n.position.y + deltaY,
            },
          };
        }
        return n;
      }),
    }));
  },

  // Select a node (single or multi-select with Shift)
  selectNode: (id, multi = false) => {
    set((state) => {
      if (multi) {
        const isSelected = state.selectedNodeIds.includes(id);
        return {
          selectedNodeIds: isSelected
            ? state.selectedNodeIds.filter((nid) => nid !== id)
            : [...state.selectedNodeIds, id],
        };
      }
      return { selectedNodeIds: [id] };
    });
  },

  // Clear all selections
  clearSelection: () => {
    set({ selectedNodeIds: [] });
  },

  // Select nodes within a rectangular box
  selectNodesInBox: (box) => {
    const { nodes, viewPort } = get();
    const selectedIds = nodes
      .filter((node) => {
        const nodeX = node.position.x * viewPort.zoom + viewPort.x;
        const nodeY = node.position.y * viewPort.zoom + viewPort.y;
        const nodeWidth = (node.width || 200) * viewPort.zoom;
        const nodeHeight = (node.height || 100) * viewPort.zoom;
        return (
          nodeX < box.x + box.width &&
          nodeX + nodeWidth > box.x &&
          nodeY < box.y + box.height &&
          nodeY + nodeHeight > box.y
        );
      })
      .map((node) => node.id);
    set({ selectedNodeIds: selectedIds });
  },

  // Select all nodes
  selectAll: () => {
    const { nodes } = get();
    set({ selectedNodeIds: nodes.map((node) => node.id) });
  },

  // Copy selected nodes to clipboard
  copyNodes: () => {
    const { nodes, selectedNodeIds } = get();
    const nodesToCopy = nodes.filter((n) => selectedNodeIds.includes(n.id));
    set({ clipboardNodes: JSON.parse(JSON.stringify(nodesToCopy)) });
  },

  // Paste nodes from clipboard
  pasteNodes: (offset = { x: 50, y: 50 }) => {
    const { clipboardNodes, nodes, addNode } = get();
    if (clipboardNodes.length === 0) return;
    get().saveToUndoStack();
    const maxX = Math.max(...nodes.map((n) => n.position.x), 0);
    const maxY = Math.max(...nodes.map((n) => n.position.y), 0);
    const pasteX = maxX + offset.x;
    const pasteY = maxY + offset.y;
    const newNodes = clipboardNodes.map((node) => ({
      ...node,
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      position: { x: node.position.x + pasteX, y: node.position.y + pasteY },
    }));
    newNodes.forEach((node) => {
      addNode(node.type, node.position);
    });
    set({ selectedNodeIds: newNodes.map((n) => n.id) });
  },
});
