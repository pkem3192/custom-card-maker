import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef
} from "react";
import { Box, Stack, Typography } from "@mui/material";
import { Canvas, FabricImage, PencilBrush, Rect, Textbox } from "fabric";
import { LETTER_LANDSCAPE, PANEL_LABELS } from "../../constants/paper";
import type { ActiveObjectStyle, CardSide, CardSideData, EditorTool } from "../../models/card";
import { serializeCanvas } from "../../services/cardExport";

export interface EditorCanvasHandle {
  addText: () => void;
  addShape: () => void;
  addImage: (file: File) => Promise<void>;
  deleteSelection: () => void;
  applyStyle: (style: ActiveObjectStyle) => void;
  setBackgroundColor: (color: string) => void;
  undo: () => void;
  redo: () => void;
  flush: () => void;
  getSerializedSide: () => CardSideData;
}

interface EditorCanvasProps {
  side: CardSide;
  data: CardSideData;
  tool: EditorTool;
  brushStyle: Pick<ActiveObjectStyle, "stroke" | "strokeWidth">;
  onChange: (side: CardSide, data: Partial<CardSideData>) => void;
  onActiveStyleChange: (style: ActiveObjectStyle) => void;
  onHistoryChange: (canUndo: boolean, canRedo: boolean) => void;
}

type FabricObjectWithText = {
  fill?: string;
  fontFamily?: string;
  fontSize?: number;
  stroke?: string;
  strokeWidth?: number;
  set: (style: ActiveObjectStyle) => void;
};

export const EditorCanvas = forwardRef<EditorCanvasHandle, EditorCanvasProps>(
  ({ side, data, tool, brushStyle, onChange, onActiveStyleChange, onHistoryChange }, ref) => {
    const elementRef = useRef<HTMLCanvasElement | null>(null);
    const canvasRef = useRef<Canvas | null>(null);
    const historyRef = useRef<string[]>([]);
    const redoRef = useRef<string[]>([]);
    const isLoadingRef = useRef(false);
    const lastSideRef = useRef<CardSide>(side);
    const sideRef = useRef(side);
    const dataRef = useRef(data);
    const onChangeRef = useRef(onChange);

    useEffect(() => {
      sideRef.current = side;
      dataRef.current = data;
      onChangeRef.current = onChange;
    }, [data, onChange, side]);

    const publishHistoryState = () => {
      onHistoryChange(historyRef.current.length > 1, redoRef.current.length > 0);
    };

    const snapshot = () => {
      const canvas = canvasRef.current;
      if (!canvas) return "";
      return JSON.stringify(serializeCanvas(canvas));
    };

    const persist = (pushHistory = true) => {
      const canvas = canvasRef.current;
      if (!canvas || isLoadingRef.current) return;

      const canvasData = serializeCanvas(canvas);
      onChangeRef.current(sideRef.current, { canvas: canvasData });

      if (pushHistory) {
        const value = JSON.stringify(canvasData);
        const previous = historyRef.current[historyRef.current.length - 1];
        if (value !== previous) {
          historyRef.current.push(value);
          redoRef.current = [];
          publishHistoryState();
        }
      }
    };

    const readActiveStyle = () => {
      const active = canvasRef.current?.getActiveObject() as FabricObjectWithText | undefined;
      if (!active) {
        onActiveStyleChange({});
        return;
      }

      onActiveStyleChange({
        fill: typeof active.fill === "string" ? active.fill : undefined,
        fontFamily: active.fontFamily,
        fontSize: active.fontSize,
        stroke: typeof active.stroke === "string" ? active.stroke : undefined,
        strokeWidth: active.strokeWidth
      });
    };

    const loadSide = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      isLoadingRef.current = true;
      canvas.clear();
      canvas.backgroundColor = data.backgroundColor;

      if (data.canvas) {
        await canvas.loadFromJSON(data.canvas);
      }

      canvas.setDimensions({
        width: LETTER_LANDSCAPE.documentWidth,
        height: LETTER_LANDSCAPE.documentHeight
      });
      canvas.renderAll();
      historyRef.current = [snapshot()];
      redoRef.current = [];
      isLoadingRef.current = false;
      publishHistoryState();
      readActiveStyle();
    };

    useLayoutEffect(() => {
      if (!elementRef.current) return;

      const canvas = new Canvas(elementRef.current, {
        width: LETTER_LANDSCAPE.documentWidth,
        height: LETTER_LANDSCAPE.documentHeight,
        backgroundColor: data.backgroundColor,
        preserveObjectStacking: true,
        selectionColor: "rgba(36, 87, 214, 0.12)",
        selectionBorderColor: "#2457d6",
        selectionLineWidth: 1
      });

      canvasRef.current = canvas;
      canvas.freeDrawingBrush = new PencilBrush(canvas);
      canvas.freeDrawingBrush.color = brushStyle.stroke ?? "#2457d6";
      canvas.freeDrawingBrush.width = brushStyle.strokeWidth ?? 5;

      const record = () => {
        persist(true);
        readActiveStyle();
      };
      const selection = () => readActiveStyle();

      canvas.on("object:added", record);
      canvas.on("object:modified", record);
      canvas.on("object:removed", record);
      canvas.on("path:created", record);
      canvas.on("selection:created", selection);
      canvas.on("selection:updated", selection);
      canvas.on("selection:cleared", selection);

      void loadSide();

      return () => {
        persist(false);
        canvas.dispose();
        canvasRef.current = null;
      };
    }, []);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.isDrawingMode = tool === "draw";
      canvas.selection = tool !== "draw";
      canvas.defaultCursor = tool === "draw" ? "crosshair" : "default";
      canvas.forEachObject((object) => {
        object.selectable = tool !== "draw";
        object.evented = true;
      });
      canvas.renderAll();
    }, [tool]);

    useEffect(() => {
      const brush = canvasRef.current?.freeDrawingBrush;
      if (!brush) return;

      brush.color = brushStyle.stroke ?? "#2457d6";
      brush.width = brushStyle.strokeWidth ?? 5;
    }, [brushStyle.stroke, brushStyle.strokeWidth]);

    useEffect(() => {
      if (lastSideRef.current !== side) {
        lastSideRef.current = side;
        void loadSide();
      }
    }, [side]);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || canvas.backgroundColor === data.backgroundColor) return;
      canvas.backgroundColor = data.backgroundColor;
      canvas.renderAll();
    }, [data.backgroundColor]);

    useEffect(() => {
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key !== "Delete" && event.key !== "Backspace") return;
        const target = event.target as HTMLElement | null;
        if (target?.closest("input, textarea, [contenteditable='true']")) return;
        deleteSelection();
      };

      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    const addText = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const text = new Textbox("Double-click to edit", {
        left: 620,
        top: 310,
        width: 320,
        fontFamily: "Inter",
        fontSize: 42,
        fill: "#182230",
        textAlign: "center",
        padding: 8
      });

      canvas.add(text);
      canvas.setActiveObject(text);
      canvas.renderAll();
      text.enterEditing();
      text.selectAll();
      persist(true);
      readActiveStyle();
    };

    const addShape = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const shape = new Rect({
        left: 160,
        top: 180,
        width: 220,
        height: 150,
        rx: 18,
        ry: 18,
        fill: "#ffe3a6",
        stroke: "#2457d6",
        strokeWidth: 4
      });

      canvas.add(shape);
      canvas.setActiveObject(shape);
      canvas.renderAll();
      persist(true);
      readActiveStyle();
    };

    const addImage = async (file: File) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });

      const image = await FabricImage.fromURL(dataUrl);
      const maxWidth = 360;
      const maxHeight = 300;
      const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
      image.set({
        left: 650,
        top: 220,
        scaleX: scale,
        scaleY: scale,
        cornerStyle: "circle",
        borderColor: "#2457d6",
        cornerColor: "#2457d6"
      });
      canvas.add(image);
      canvas.setActiveObject(image);
      canvas.renderAll();
      persist(true);
      readActiveStyle();
    };

    const deleteSelection = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const activeObjects = canvas.getActiveObjects();
      if (!activeObjects.length) return;
      activeObjects.forEach((object) => canvas.remove(object));
      canvas.discardActiveObject();
      canvas.renderAll();
      persist(true);
      readActiveStyle();
    };

    const applyStyle = (style: ActiveObjectStyle) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const activeObjects = canvas.getActiveObjects() as FabricObjectWithText[];
      if (!activeObjects.length) return;

      activeObjects.forEach((object) => object.set(style));
      canvas.renderAll();
      persist(true);
      readActiveStyle();
    };

    const setBackgroundColor = (color: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.backgroundColor = color;
      canvas.renderAll();
      onChangeRef.current(sideRef.current, {
        backgroundColor: color,
        canvas: serializeCanvas(canvas)
      });
    };

    const restore = async (json: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      isLoadingRef.current = true;
      canvas.clear();
      canvas.backgroundColor = dataRef.current.backgroundColor;
      await canvas.loadFromJSON(JSON.parse(json));
      canvas.renderAll();
      isLoadingRef.current = false;
      onChangeRef.current(sideRef.current, { canvas: serializeCanvas(canvas) });
      publishHistoryState();
      readActiveStyle();
    };

    const undo = () => {
      if (historyRef.current.length <= 1) return;
      const current = historyRef.current.pop();
      if (current) redoRef.current.push(current);
      const previous = historyRef.current[historyRef.current.length - 1];
      void restore(previous);
    };

    const redo = () => {
      const next = redoRef.current.pop();
      if (!next) return;
      historyRef.current.push(next);
      void restore(next);
    };

    const flush = () => persist(false);

    const getSerializedSide = () => {
      const canvas = canvasRef.current;
      const activeObject = canvas?.getActiveObject();
      if (activeObject && "exitEditing" in activeObject) {
        (activeObject as { exitEditing: () => void }).exitEditing();
      }
      canvas?.renderAll();
      return {
        backgroundColor:
          typeof canvas?.backgroundColor === "string"
            ? canvas.backgroundColor
            : dataRef.current.backgroundColor,
        canvas: canvas ? serializeCanvas(canvas) : dataRef.current.canvas
      };
    };

    useImperativeHandle(ref, () => ({
      addText,
      addShape,
      addImage,
      deleteSelection,
      applyStyle,
      setBackgroundColor,
      undo,
      redo,
      flush,
      getSerializedSide
    }));

    const labels = PANEL_LABELS[side];

    return (
      <Box
        sx={{
          minWidth: 0,
          minHeight: 0,
          overflow: "auto",
          p: 4,
          display: "grid",
          placeItems: "center",
          background:
            "linear-gradient(90deg, rgba(24,34,48,0.04) 1px, transparent 1px), linear-gradient(rgba(24,34,48,0.04) 1px, transparent 1px)",
          backgroundSize: "28px 28px"
        }}
      >
        <Box
          sx={{
            position: "relative",
            width: LETTER_LANDSCAPE.documentWidth,
            height: LETTER_LANDSCAPE.documentHeight,
            bgcolor: data.backgroundColor,
            borderRadius: 1,
            boxShadow: "0 20px 50px rgba(16, 24, 40, 0.22)",
            overflow: "hidden"
          }}
        >
          <canvas ref={elementRef} className="fabric-editor-canvas" />

          <Box
            sx={{
              pointerEvents: "none",
              position: "absolute",
              inset: LETTER_LANDSCAPE.safeMargin,
              border: "2px dashed rgba(192, 74, 143, 0.24)",
              borderRadius: 0.5
            }}
          />
          <Box
            sx={{
              pointerEvents: "none",
              position: "absolute",
              top: 0,
              bottom: 0,
              left: LETTER_LANDSCAPE.foldX,
              borderLeft: "3px dashed rgba(36, 87, 214, 0.42)"
            }}
          />
          <Stack
            direction="row"
            sx={{
              pointerEvents: "none",
              position: "absolute",
              inset: 0
            }}
          >
            {[labels.left, labels.right].map((label) => (
              <Box key={label} sx={{ flex: 1, position: "relative" }}>
                <Typography
                  sx={{
                    position: "absolute",
                    top: 20,
                    left: 24,
                    px: 1.25,
                    py: 0.5,
                    borderRadius: 1,
                    bgcolor: "rgba(255,255,255,0.78)",
                    color: "text.secondary",
                    fontSize: 12,
                    fontWeight: 900,
                    letterSpacing: 0
                  }}
                >
                  {label}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      </Box>
    );
  }
);

EditorCanvas.displayName = "EditorCanvas";
