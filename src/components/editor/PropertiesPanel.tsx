import {
  Box,
  Button,
  Divider,
  MenuItem,
  Slider,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DrawRoundedIcon from "@mui/icons-material/DrawRounded";
import FormatColorTextRoundedIcon from "@mui/icons-material/FormatColorTextRounded";
import SquareRoundedIcon from "@mui/icons-material/SquareRounded";
import type { ActiveObjectStyle, EditorTool } from "../../models/card";

interface PropertiesPanelProps {
  backgroundColor: string;
  activeStyle: ActiveObjectStyle;
  brushStyle: Pick<ActiveObjectStyle, "stroke" | "strokeWidth">;
  tool: EditorTool;
  onBackgroundColorChange: (color: string) => void;
  onObjectStyleChange: (style: ActiveObjectStyle) => void;
  onAddText: () => void;
  onAddShape: () => void;
}

const fontFamilies = ["Inter", "Georgia", "Times New Roman", "Trebuchet MS", "Verdana"];

export function PropertiesPanel({
  backgroundColor,
  activeStyle,
  brushStyle,
  tool,
  onBackgroundColorChange,
  onObjectStyleChange,
  onAddText,
  onAddShape
}: PropertiesPanelProps) {
  const isDrawing = tool === "draw";
  const visibleStyle = isDrawing ? brushStyle : activeStyle;

  return (
    <Box
      component="aside"
      sx={{
        minHeight: 0,
        p: 2,
        bgcolor: "#ffffff",
        borderLeft: "1px solid #d9dee8",
        overflow: "auto"
      }}
    >
      <Stack spacing={2.25}>
        <Box>
          <Typography variant="overline" sx={{ color: "text.secondary", fontWeight: 800 }}>
            Quick Add
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Button fullWidth variant="outlined" startIcon={<AddRoundedIcon />} onClick={onAddText}>
              Text
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<SquareRoundedIcon />}
              onClick={onAddShape}
            >
              Shape
            </Button>
          </Stack>
        </Box>

        <Divider />

        <Box>
          <Typography variant="overline" sx={{ color: "text.secondary", fontWeight: 800 }}>
            Page
          </Typography>
          <TextField
            fullWidth
            type="color"
            label="Background"
            value={backgroundColor}
            onChange={(event) => onBackgroundColorChange(event.target.value)}
            sx={{ mt: 1 }}
          />
        </Box>

        <Divider />

        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            {isDrawing ? (
              <DrawRoundedIcon color="primary" fontSize="small" />
            ) : (
              <FormatColorTextRoundedIcon color="primary" fontSize="small" />
            )}
            <Typography variant="overline" sx={{ color: "text.secondary", fontWeight: 800 }}>
              {isDrawing ? "Brush" : "Selection"}
            </Typography>
          </Stack>

          <Stack spacing={1.5} sx={{ mt: 1.5 }}>
            {!isDrawing && (
              <>
                <TextField
                  select
                  fullWidth
                  label="Font"
                  value={activeStyle.fontFamily ?? "Inter"}
                  onChange={(event) => onObjectStyleChange({ fontFamily: event.target.value })}
                >
                  {fontFamilies.map((font) => (
                    <MenuItem key={font} value={font}>
                      {font}
                    </MenuItem>
                  ))}
                </TextField>

                <Box>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                    Font size
                  </Typography>
                  <Slider
                    min={12}
                    max={96}
                    value={activeStyle.fontSize ?? 36}
                    onChange={(_, value) => onObjectStyleChange({ fontSize: value as number })}
                  />
                </Box>

                <TextField
                  fullWidth
                  type="color"
                  label="Fill"
                  value={activeStyle.fill ?? "#182230"}
                  onChange={(event) => onObjectStyleChange({ fill: event.target.value })}
                />
              </>
            )}

            <TextField
              fullWidth
              type="color"
              label={isDrawing ? "Brush color" : "Stroke"}
              value={visibleStyle.stroke ?? "#2457d6"}
              onChange={(event) => onObjectStyleChange({ stroke: event.target.value })}
            />

            <Box>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                {isDrawing ? "Brush width" : "Stroke width"}
              </Typography>
              <Slider
                min={isDrawing ? 1 : 0}
                max={isDrawing ? 40 : 20}
                value={visibleStyle.strokeWidth ?? (isDrawing ? 5 : 0)}
                onChange={(_, value) => onObjectStyleChange({ strokeWidth: value as number })}
              />
            </Box>
          </Stack>
        </Box>

        <Divider />

        <Box
          sx={{
            p: 1.5,
            bgcolor: "#f6f8fb",
            border: "1px solid #d9dee8",
            borderRadius: 1
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            Print guide
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            Export creates two clean 3300 x 2550 printable sides without fold or margin overlays.
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}
