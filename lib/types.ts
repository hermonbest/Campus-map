export interface Building {
  id: string;
  name: string;
  description: string | null;
  image_url?: string | null;
  phone?: string | null;
  email?: string | null;
  hours?: string | null;
  x_pos: number;
  y_pos: number;
  color: string;
  icon_type: string;
  entrance_node_id: string | null;
  is_frequent?: boolean;
  offices?: Office[];
}

export interface Office {
  id: string;
  building_id: string;
  room_number: string;
  staff_name: string;
  floor: number | null;
  is_frequent?: boolean;
}

export interface Node {
  id: string;
  x_pos: number;
  y_pos: number;
  is_building_entrance: boolean;
  building_id: string | null;
}

export interface Edge {
  id: string;
  node_a: string;
  node_b: string;
  weight: number;
}
