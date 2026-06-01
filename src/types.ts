export interface ThingSpeakField {
  id: number;
  name: string;
  value: number;
}

export interface ThingSpeakFeedItem {
  created_at: string;
  entry_id: number;
  [key: string]: string | number; // field1, field2, etc.
}

export interface ThingSpeakChannel {
  id: number;
  name: string;
  description: string;
  latitude?: string;
  longitude?: string;
  created_at: string;
  updated_at: string;
  last_entry_id: number;
  field1?: string;
  field2?: string;
  field3?: string;
  field4?: string;
  field5?: string;
  field6?: string;
  field7?: string;
  field8?: string;
}

export interface ThingSpeakResponse {
  channel: ThingSpeakChannel;
  feeds: ThingSpeakFeedItem[];
}

export interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  delay: number;       // Latency in ms (minimize)
  bandwidth: number;   // Bandwidth in Mbps (maximize)
  cost: number;        // Cost metric (minimize)
}

export interface AlgorithmStep {
  visited: string[];
  currentNode: string | null;
  distances: Record<string, number>;
  bandwidths: Record<string, number>;
  predecessors: Record<string, string | null>;
  explanation: string;
  activeEdge?: string; // id of edge being examined
}

export type QoSAlgorithm = 'dijkstra' | 'widest-path' | 'multi-constrained' | 'mst';
