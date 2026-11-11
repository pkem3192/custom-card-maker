export type CardSide = "outside" | "inside";
export type EditorTool = "select" | "text" | "draw" | "photos" | "shapes" | "delete";

export type SerializedCanvas = Record<string, unknown>;

export interface CardSideData {
  backgroundColor: string;
  canvas: SerializedCanvas | null;
}

export interface CardProject {
  id: string;
  name: string;
  outside: CardSideData;
  inside: CardSideData;
}

export interface ActiveObjectStyle {
  fill?: string;
  fontFamily?: string;
  fontSize?: number;
  stroke?: string;
  strokeWidth?: number;
}
