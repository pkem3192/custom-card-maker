import { useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Divider,
  IconButton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography
} from "@mui/material";
import AddPhotoAlternateRoundedIcon from "@mui/icons-material/AddPhotoAlternateRounded";
import AutoFixHighRoundedIcon from "@mui/icons-material/AutoFixHighRounded";
import ColorLensRoundedIcon from "@mui/icons-material/ColorLensRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import DrawRoundedIcon from "@mui/icons-material/DrawRounded";
import FormatColorFillRoundedIcon from "@mui/icons-material/FormatColorFillRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import RedoRoundedIcon from "@mui/icons-material/RedoRounded";
import SquareRoundedIcon from "@mui/icons-material/SquareRounded";
import TextFieldsRoundedIcon from "@mui/icons-material/TextFieldsRounded";
import TouchAppRoundedIcon from "@mui/icons-material/TouchAppRounded";
import UndoRoundedIcon from "@mui/icons-material/UndoRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import type { ActiveObjectStyle, CardSide, EditorTool } from "../../models/card";
import { downloadBothSides, openPrintFlow } from "../../services/cardExport";
import { useCardProject } from "../../hooks/useCardProject";
import { EditorCanvas, type EditorCanvasHandle } from "./EditorCanvas";
import { PropertiesPanel } from "./PropertiesPanel";

const tools: Array<{ id: EditorTool; label: string; icon: React.ReactNode }> = [
  { id: "select", label: "Select", icon: <TouchAppRoundedIcon /> },
  { id: "text", label: "Text", icon: <TextFieldsRoundedIcon /> },
  { id: "draw", label: "Draw", icon: <DrawRoundedIcon /> },
  { id: "photos", label: "Photos", icon: <AddPhotoAlternateRoundedIcon /> },
  { id: "shapes", label: "Shapes", icon: <SquareRoundedIcon /> },
  { id: "delete", label: "Delete", icon: <DeleteRoundedIcon /> }
];

export function CardEditor() {
  const {
    project,
    activeSide,
    activeSideData,
    setActiveSide,
    updateSide,
    renameProject
  } = useCardProject();
  const canvasRef = useRef<EditorCanvasHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tool, setTool] = useState<EditorTool>("select");
  const [activeStyle, setActiveStyle] = useState<ActiveObjectStyle>({});
  const [brushStyle, setBrushStyle] = useState<Pick<ActiveObjectStyle, "stroke" | "strokeWidth">>({
    stroke: "#2457d6",
    strokeWidth: 5
  });
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const activeSideLabel = useMemo(
    () => (activeSide === "outside" ? "Outside" : "Inside"),
    [activeSide]
  );

  function handleToolClick(nextTool: EditorTool) {
    if (nextTool === "photos") {
      fileInputRef.current?.click();
      setTool("select");
      return;
    }

    if (nextTool === "delete") {
      canvasRef.current?.deleteSelection();
      setTool("select");
      return;
    }

    if (nextTool === "text") {
      canvasRef.current?.addText();
      setTool("select");
      return;
    }

    if (nextTool === "shapes") {
      canvasRef.current?.addShape();
      setTool("select");
      return;
    }

    setTool(nextTool);
  }

  async function handlePhotoUpload(file?: File) {
    if (!file) return;
    await canvasRef.current?.addImage(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleSideChange(_: React.MouseEvent<HTMLElement>, value: CardSide | null) {
    if (!value || value === activeSide) return;
    const currentSideData = canvasRef.current?.getSerializedSide();
    if (currentSideData) {
      updateSide(activeSide, currentSideData);
    }
    setActiveSide(value);
  }

  async function handlePrint() {
    canvasRef.current?.flush();
    const currentSideData = canvasRef.current?.getSerializedSide();
    await openPrintFlow({
      ...project,
      [activeSide]: currentSideData ?? project[activeSide]
    });
  }

  async function handleExport() {
    canvasRef.current?.flush();
    const currentSideData = canvasRef.current?.getSerializedSide();
    await downloadBothSides({
      ...project,
      [activeSide]: currentSideData ?? project[activeSide]
    });
  }

  function handleStyleChange(style: ActiveObjectStyle) {
    if (style.stroke !== undefined || style.strokeWidth !== undefined) {
      setBrushStyle((current) => ({
        ...current,
        ...(style.stroke !== undefined ? { stroke: style.stroke } : {}),
        ...(style.strokeWidth !== undefined ? { strokeWidth: style.strokeWidth } : {})
      }));
    }

    canvasRef.current?.applyStyle(style);
  }

  return (
    <Box
      sx={{
        height: "100%",
        display: "grid",
        gridTemplateRows: "64px minmax(0, 1fr)",
        bgcolor: "background.default"
      }}
    >
      <Box
        component="header"
        sx={{
          px: 2,
          display: "grid",
          gridTemplateColumns: "320px 1fr auto",
          alignItems: "center",
          gap: 2,
          bgcolor: "#ffffff",
          borderBottom: "1px solid #d9dee8"
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center">
          <AutoFixHighRoundedIcon color="primary" />
          <TextField
            variant="standard"
            value={project.name}
            onChange={(event) => renameProject(event.target.value)}
            InputProps={{ disableUnderline: true }}
            sx={{
              "& input": {
                fontWeight: 800,
                fontSize: 18,
                color: "text.primary"
              }
            }}
          />
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
          <Tooltip title="Undo">
            <span>
              <IconButton disabled={!canUndo} onClick={() => canvasRef.current?.undo()}>
                <UndoRoundedIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Redo">
            <span>
              <IconButton disabled={!canRedo} onClick={() => canvasRef.current?.redo()}>
                <RedoRoundedIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Divider flexItem orientation="vertical" sx={{ mx: 0.75 }} />
          <Button
            variant="outlined"
            startIcon={<VisibilityRoundedIcon />}
            sx={{ bgcolor: "#f9fafb" }}
          >
            Folded Preview
          </Button>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<DownloadRoundedIcon />} onClick={handleExport}>
            Export
          </Button>
          <Button variant="contained" startIcon={<PrintRoundedIcon />} onClick={handlePrint}>
            Print
          </Button>
        </Stack>
      </Box>

      <Box
        sx={{
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: "88px minmax(0, 1fr) 304px"
        }}
      >
        <Box
          component="nav"
          sx={{
            p: 1.25,
            bgcolor: "#fbfcfe",
            borderRight: "1px solid #d9dee8"
          }}
        >
          <Stack spacing={1}>
            {tools.map((item) => (
              <Tooltip key={item.id} title={item.label} placement="right">
                <Button
                  variant={tool === item.id ? "contained" : "text"}
                  color={item.id === "delete" ? "error" : "primary"}
                  onClick={() => handleToolClick(item.id)}
                  sx={{
                    minWidth: 0,
                    height: 58,
                    flexDirection: "column",
                    gap: 0.25,
                    color: tool === item.id ? "#ffffff" : "text.secondary",
                    "& .MuiButton-startIcon": { m: 0 }
                  }}
                  startIcon={item.icon}
                >
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    {item.label}
                  </Typography>
                </Button>
              </Tooltip>
            ))}
          </Stack>
          <input
            ref={fileInputRef}
            hidden
            type="file"
            accept="image/*"
            onChange={(event) => void handlePhotoUpload(event.target.files?.[0])}
          />
        </Box>

        <Box
          component="main"
          sx={{
            minWidth: 0,
            minHeight: 0,
            display: "grid",
            gridTemplateRows: "72px minmax(0, 1fr)"
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ px: 3, borderBottom: "1px solid #d9dee8", bgcolor: "#f8fafc" }}
          >
            <Box>
              <Typography variant="overline" sx={{ color: "text.secondary", fontWeight: 800 }}>
                Editing
              </Typography>
              <Typography variant="h6">{activeSideLabel} side</Typography>
            </Box>
            <ToggleButtonGroup
              exclusive
              value={activeSide}
              onChange={handleSideChange}
              sx={{
                bgcolor: "#ffffff",
                p: 0.5,
                border: "1px solid #d9dee8",
                "& .MuiToggleButton-root": {
                  px: 3,
                  border: 0,
                  borderRadius: "6px !important",
                  fontWeight: 800
                }
              }}
            >
              <ToggleButton value="outside">Outside</ToggleButton>
              <ToggleButton value="inside">Inside</ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          <EditorCanvas
            ref={canvasRef}
            side={activeSide}
            data={activeSideData}
            tool={tool}
            brushStyle={brushStyle}
            onChange={(side, data) => updateSide(side, data)}
            onActiveStyleChange={setActiveStyle}
            onHistoryChange={(undo, redo) => {
              setCanUndo(undo);
              setCanRedo(redo);
            }}
          />
        </Box>

        <PropertiesPanel
          backgroundColor={activeSideData.backgroundColor}
          activeStyle={activeStyle}
          brushStyle={brushStyle}
          tool={tool}
          onBackgroundColorChange={(backgroundColor) => {
            updateSide(activeSide, { backgroundColor });
            canvasRef.current?.setBackgroundColor(backgroundColor);
          }}
          onObjectStyleChange={handleStyleChange}
          onAddText={() => canvasRef.current?.addText()}
          onAddShape={() => canvasRef.current?.addShape()}
        />
      </Box>
    </Box>
  );
}
