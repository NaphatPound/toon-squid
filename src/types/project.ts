export interface Project {
  id: string;
  name: string;
  width: number;
  height: number;
  createdAt: number;
  updatedAt: number;
}

export type ToolType =
  | 'select'
  | 'pen'
  | 'ink'
  | 'pencil'
  | 'marker'
  | 'eraser'
  | 'bone'
  | 'ik'
  | 'pan'
  | 'zoom';

export type AppMode = 'draw' | 'rig' | 'animate';
