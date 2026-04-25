import { dijkstra, getPathCoordinates } from '../dijkstra';

describe('Dijkstra Algorithm', () => {
  const nodes = [
    { id: 'node1', x_pos: 0.1, y_pos: 0.1, is_building_entrance: true },
    { id: 'node2', x_pos: 0.3, y_pos: 0.2, is_building_entrance: false },
    { id: 'node3', x_pos: 0.5, y_pos: 0.3, is_building_entrance: false },
    { id: 'node4', x_pos: 0.7, y_pos: 0.4, is_building_entrance: true },
    { id: 'node5', x_pos: 0.2, y_pos: 0.5, is_building_entrance: false },
  ];

  const edges = [
    { id: 'edge1', node_a: 'node1', node_b: 'node2', weight: 100 },
    { id: 'edge2', node_a: 'node2', node_b: 'node3', weight: 150 },
    { id: 'edge3', node_a: 'node3', node_b: 'node4', weight: 120 },
    { id: 'edge4', node_a: 'node1', node_b: 'node5', weight: 200 },
    { id: 'edge5', node_a: 'node5', node_b: 'node3', weight: 80 },
  ];

  describe('dijkstra function', () => {
    it('should find shortest path between two connected nodes', () => {
      const result = dijkstra('node1', 'node4', nodes, edges);
      
      expect(result).not.toBeNull();
      expect(result?.path).toEqual(['node1', 'node2', 'node3', 'node4']);
      expect(result?.totalDistance).toBe(370); // 100 + 150 + 120
    });

    it('should find direct path when nodes are directly connected', () => {
      const result = dijkstra('node1', 'node2', nodes, edges);
      
      expect(result).not.toBeNull();
      expect(result?.path).toEqual(['node1', 'node2']);
      expect(result?.totalDistance).toBe(100);
    });

    it('should return null when start node does not exist', () => {
      const result = dijkstra('nonexistent', 'node2', nodes, edges);
      
      expect(result).toBeNull();
    });

    it('should return null when end node does not exist', () => {
      const result = dijkstra('node1', 'nonexistent', nodes, edges);
      
      expect(result).toBeNull();
    });

    it('should return path of single node when start equals end', () => {
      const result = dijkstra('node1', 'node1', nodes, edges);
      
      expect(result).not.toBeNull();
      expect(result?.path).toEqual(['node1']);
      expect(result?.totalDistance).toBe(0);
    });

    it('should return null when no path exists', () => {
      const isolatedNode = { id: 'isolated', x_pos: 0.9, y_pos: 0.9, is_building_entrance: false };
      const nodesWithIsolated = [...nodes, isolatedNode];
      
      const result = dijkstra('node1', 'isolated', nodesWithIsolated, edges);
      
      expect(result).toBeNull();
    });

    it('should handle bi-directional edges correctly', () => {
      const result = dijkstra('node4', 'node1', nodes, edges);
      
      expect(result).not.toBeNull();
      expect(result?.path).toEqual(['node4', 'node3', 'node2', 'node1']);
      expect(result?.totalDistance).toBe(370); // 120 + 150 + 100
    });

    it('should handle zero weight edges', () => {
      const nodesWithZero = [
        { id: 'a', x_pos: 0, y_pos: 0 },
        { id: 'b', x_pos: 0.5, y_pos: 0.5 },
        { id: 'c', x_pos: 1, y_pos: 1 },
      ];
      const edgesWithZero = [
        { id: 'e1', node_a: 'a', node_b: 'b', weight: 0 },
        { id: 'e2', node_a: 'b', node_b: 'c', weight: 100 },
      ];
      
      const result = dijkstra('a', 'c', nodesWithZero, edgesWithZero);
      
      expect(result).not.toBeNull();
      expect(result?.path).toEqual(['a', 'b', 'c']);
      expect(result?.totalDistance).toBe(100);
    });

    it('should choose shortest path when multiple paths exist', () => {
      const nodesMultiple = [
        { id: 'start', x_pos: 0, y_pos: 0 },
        { id: 'middle1', x_pos: 0.3, y_pos: 0.3 },
        { id: 'middle2', x_pos: 0.3, y_pos: 0.7 },
        { id: 'end', x_pos: 1, y_pos: 1 },
      ];
      const edgesMultiple = [
        { id: 'e1', node_a: 'start', node_b: 'middle1', weight: 50 },
        { id: 'e2', node_a: 'start', node_b: 'middle2', weight: 100 },
        { id: 'e3', node_a: 'middle1', node_b: 'end', weight: 50 },
        { id: 'e4', node_a: 'middle2', node_b: 'end', weight: 50 },
      ];
      
      const result = dijkstra('start', 'end', nodesMultiple, edgesMultiple);
      
      expect(result).not.toBeNull();
      expect(result?.path).toEqual(['start', 'middle1', 'end']);
      expect(result?.totalDistance).toBe(100); // 50 + 50 (shorter than 100 + 50)
    });
  });

  describe('getPathCoordinates function', () => {
    it('should convert path node IDs to coordinates', () => {
      const path = ['node1', 'node2', 'node3'];
      const coordinates = getPathCoordinates(path, nodes);
      
      expect(coordinates).toHaveLength(3);
      expect(coordinates[0]).toEqual({ x: 0.1, y: 0.1 });
      expect(coordinates[1]).toEqual({ x: 0.3, y: 0.2 });
      expect(coordinates[2]).toEqual({ x: 0.5, y: 0.3 });
    });

    it('should handle empty path', () => {
      const coordinates = getPathCoordinates([], nodes);
      
      expect(coordinates).toEqual([]);
    });

    it('should throw error when node in path does not exist', () => {
      const path = ['node1', 'nonexistent'];
      
      expect(() => getPathCoordinates(path, nodes)).toThrow('Node nonexistent not found');
    });

    it('should convert decimal coordinates to numbers', () => {
      const nodesWithDecimals = [
        { id: 'a', x_pos: 0.123456789, y_pos: 0.987654321 },
      ];
      const path = ['a'];
      const coordinates = getPathCoordinates(path, nodesWithDecimals);
      
      expect(coordinates[0].x).toBe(0.123456789);
      expect(coordinates[0].y).toBe(0.987654321);
    });
  });

  describe('integration tests', () => {
    it('should find path through complex graph', () => {
      const complexNodes = [
        { id: 'A', x_pos: 0, y_pos: 0 },
        { id: 'B', x_pos: 0.2, y_pos: 0.2 },
        { id: 'C', x_pos: 0.4, y_pos: 0.4 },
        { id: 'D', x_pos: 0.6, y_pos: 0.2 },
        { id: 'E', x_pos: 0.8, y_pos: 0.4 },
        { id: 'F', x_pos: 1, y_pos: 0 },
      ];
      const complexEdges = [
        { id: 'e1', node_a: 'A', node_b: 'B', weight: 50 },
        { id: 'e2', node_a: 'B', node_b: 'C', weight: 50 },
        { id: 'e3', node_a: 'C', node_b: 'D', weight: 50 },
        { id: 'e4', node_a: 'D', node_b: 'E', weight: 50 },
        { id: 'e5', node_a: 'E', node_b: 'F', weight: 50 },
        { id: 'e6', node_a: 'A', node_b: 'D', weight: 200 },
        { id: 'e7', node_a: 'B', node_b: 'E', weight: 150 },
      ];
      
      const result = dijkstra('A', 'F', complexNodes, complexEdges);
      
      expect(result).not.toBeNull();
      expect(result?.path).toEqual(['A', 'B', 'E', 'F']);
      expect(result?.totalDistance).toBe(250); // 50 + 150 + 50
    });

    it('should handle building entrance nodes correctly', () => {
      const buildingNodes = [
        { id: 'building1', x_pos: 0.1, y_pos: 0.1, is_building_entrance: true },
        { id: 'building2', x_pos: 0.9, y_pos: 0.9, is_building_entrance: true },
        { id: 'intersection1', x_pos: 0.5, y_pos: 0.5, is_building_entrance: false },
      ];
      const buildingEdges = [
        { id: 'e1', node_a: 'building1', node_b: 'intersection1', weight: 100 },
        { id: 'e2', node_a: 'building2', node_b: 'intersection1', weight: 100 },
      ];
      
      const result = dijkstra('building1', 'building2', buildingNodes, buildingEdges);
      
      expect(result).not.toBeNull();
      expect(result?.path).toEqual(['building1', 'intersection1', 'building2']);
      expect(result?.totalDistance).toBe(200);
    });
  });
});
