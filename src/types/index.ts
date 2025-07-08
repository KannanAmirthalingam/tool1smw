// Type definitions for the application
export interface Employee {
  id: string;
  emp_id: string;
  emp_name: string;
  group: string;
  destination: string;
  created_at: Date;
}

export interface ToolCategory {
  id: string;
  category_name: string;
  description?: string;
  created_at: Date;
}

export interface Tool {
  id: string;
  tool_name: string;
  category_id: string;
  category_name: string;
  total_quantity: number;
  available_quantity: number;
  image_url?: string;
  created_at: Date;
}

export interface ToolPart {
  id: string;
  tool_id: string;
  tool_name: string;
  category_id: string;
  category_name: string;
  unique_id: string; // Auto-generated like ToolIDQ1, ToolIDQ2, etc.
  status: 'available' | 'issued' | 'maintenance';
  image_url?: string;
  created_at: Date;
}

export interface OutwardEntry {
  id: string;
  emp_id: string;
  emp_name: string;
  group: string;
  destination: string;
  tool_id: string;
  tool_name: string;
  tool_part_id: string;
  tool_unique_id: string;
  category_id: string;
  category_name: string;
  issued_date: Date;
  status: 'issued' | 'returned';
  quantity?: number; // Added for multi-quantity support
  remarks?: string;
  created_at: Date;
}

export interface InwardEntry {
  id: string;
  outward_id: string;
  tool_part_id: string;
  returned_date: Date;
  remarks?: string;
  created_at: Date;
}

export interface ToolHistory {
  id: string;
  tool_id: string;
  tool_name: string;
  tool_part_id: string;
  tool_unique_id: string;
  emp_id: string;
  emp_name: string;
  group: string;
  destination: string;
  issued_date: Date;
  returned_date: Date;
  tool_image_url?: string;
  remarks?: string;
  created_at: Date;
}