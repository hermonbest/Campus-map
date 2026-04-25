interface Node {
  id: string;
  x_pos: number;
  y_pos: number;
}

interface Edge {
  id: string;
  node_a: string;
  node_b: string;
  weight: number;
}

interface DijkstraResult {
  path: string[];
  totalDistance: number;
}

/**
 * Dijkstra's algorithm for finding the shortest path between two nodes
 * @param startNodeId - The ID of the starting node
 * @param endNodeId - The ID of the destination node
 * @param nodes - Array of all nodes
 * @param edges - Array of all edges (bi-directional)
 * @returns Object containing the path (array of node IDs) and total distance, or null if no path exists
 */
export function dijkstra(
  startNodeId: string,
  endNodeId: string,
  nodes: Node[],
  edges: Edge[]
): DijkstraResult | null {
  console.log('[DIJKSTRA] Starting path calculation');
  console.log('[DIJKSTRA] Start node:', startNodeId);
  console.log('[DIJKSTRA] End node:', endNodeId);
  console.log('[DIJKSTRA] Total nodes:', nodes.length);
  console.log('[DIJKSTRA] Total edges:', edges.length);

  // Check if start and end nodes exist
  const startNode = nodes.find(n => n.id === startNodeId);
  const endNode = nodes.find(n => n.id === endNodeId);
  
  if (!startNode) {
    console.error('[DIJKSTRA] Start node not found:', startNodeId);
    return null;
  }
  if (!endNode) {
    console.error('[DIJKSTRA] End node not found:', endNodeId);
    return null;
  }

  console.log('[DIJKSTRA] Start node coordinates:', { x: startNode.x_pos, y: startNode.y_pos });
  console.log('[DIJKSTRA] End node coordinates:', { x: endNode.x_pos, y: endNode.y_pos });

  // Create adjacency list from edges (bi-directional)
  const adjacencyList = new Map<string, Array<{ nodeId: string; weight: number }>>();
  
  // Initialize adjacency list
  nodes.forEach(node => {
    adjacencyList.set(node.id, []);
  });
  
  // Add edges (bi-directional)
  edges.forEach(edge => {
    const neighborsA = adjacencyList.get(edge.node_a) || [];
    const neighborsB = adjacencyList.get(edge.node_b) || [];
    
    neighborsA.push({ nodeId: edge.node_b, weight: Number(edge.weight) });
    neighborsB.push({ nodeId: edge.node_a, weight: Number(edge.weight) });
    
    adjacencyList.set(edge.node_a, neighborsA);
    adjacencyList.set(edge.node_b, neighborsB);
  });

  console.log('[DIJKSTRA] Adjacency list built');
  console.log('[DIJKSTRA] Start node neighbors:', adjacencyList.get(startNodeId));
  console.log('[DIJKSTRA] End node neighbors:', adjacencyList.get(endNodeId));
  
  // Initialize distances and previous nodes
  const distances = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const unvisited = new Set<string>();
  
  nodes.forEach(node => {
    distances.set(node.id, Infinity);
    previous.set(node.id, null);
    unvisited.add(node.id);
  });
  
  // Set distance to start node as 0
  distances.set(startNodeId, 0);
  
  console.log('[DIJKSTRA] Starting Dijkstra algorithm');
  let iterations = 0;
  
  while (unvisited.size > 0) {
    iterations++;
    // Find unvisited node with smallest distance
    let currentNode: string | null = null;
    let smallestDistance = Infinity;
    
    for (const nodeId of unvisited) {
      const distance = distances.get(nodeId) || Infinity;
      if (distance < smallestDistance) {
        smallestDistance = distance;
        currentNode = nodeId;
      }
    }
    
    // If no more reachable nodes or we reached the destination
    if (currentNode === null || smallestDistance === Infinity) {
      console.log('[DIJKSTRA] No more reachable nodes. Stopping.');
      console.log('[DIJKSTRA] Unvisited nodes:', Array.from(unvisited));
      break;
    }
    
    if (currentNode === endNodeId) {
      console.log('[DIJKSTRA] Reached destination node');
      break;
    }
    
    console.log(`[DIJKSTRA] Iteration ${iterations}: Visiting node ${currentNode} (distance: ${smallestDistance.toFixed(2)})`);
    
    // Remove current node from unvisited
    unvisited.delete(currentNode);
    
    // Check neighbors
    const neighbors = adjacencyList.get(currentNode) || [];
    console.log(`[DIJKSTRA] Node ${currentNode} has ${neighbors.length} neighbors`);
    
    for (const neighbor of neighbors) {
      if (unvisited.has(neighbor.nodeId)) {
        const currentDistance = distances.get(currentNode) || Infinity;
        const newDistance = currentDistance + neighbor.weight;
        const existingDistance = distances.get(neighbor.nodeId) || Infinity;
        
        if (newDistance < existingDistance) {
          distances.set(neighbor.nodeId, newDistance);
          previous.set(neighbor.nodeId, currentNode);
          console.log(`[DIJKSTRA] Updated distance to ${neighbor.nodeId}: ${newDistance.toFixed(2)}`);
        }
      }
    }
  }
  
  console.log(`[DIJKSTRA] Algorithm completed after ${iterations} iterations`);
  
  // Reconstruct path from end to start
  const path: string[] = [];
  let currentNode: string | null = endNodeId;
  
  while (currentNode !== null) {
    path.unshift(currentNode);
    currentNode = previous.get(currentNode) || null;
  }
  
  console.log('[DIJKSTRA] Reconstructed path:', path);
  
  // Check if path starts from start node
  if (path[0] !== startNodeId || path.length === 0) {
    console.error('[DIJKSTRA] No path exists - path does not start from start node');
    console.error('[DIJKSTRA] Path start:', path[0]);
    console.error('[DIJKSTRA] Expected start:', startNodeId);
    return null; // No path exists
  }
  
  const totalDistance = distances.get(endNodeId) || 0;
  console.log('[DIJKSTRA] Path found! Total distance:', totalDistance.toFixed(2));
  
  return {
    path,
    totalDistance,
  };
}

/**
 * Get node coordinates for rendering the path
 * @param path - Array of node IDs in the path
 * @param nodes - Array of all nodes
 * @returns Array of coordinates in the order of the path
 */
export function getPathCoordinates(path: string[], nodes: Node[]): Array<{ x: number; y: number }> {
  const nodeMap = new Map<string, Node>();
  nodes.forEach(node => {
    nodeMap.set(node.id, node);
  });
  
  return path.map(nodeId => {
    const node = nodeMap.get(nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }
    return {
      x: Number(node.x_pos),
      y: Number(node.y_pos),
    };
  });
}
