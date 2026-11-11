import { Canvas } from "fabric";
import { LETTER_LANDSCAPE } from "../constants/paper";
import type { CardProject, CardSide, CardSideData } from "../models/card";

export async function renderSideToDataUrl(side: CardSideData): Promise<string> {
  const canvas = new Canvas(undefined, {
    width: LETTER_LANDSCAPE.documentWidth,
    height: LETTER_LANDSCAPE.documentHeight,
    backgroundColor: side.backgroundColor,
    renderOnAddRemove: false
  });

  if (side.canvas) {
    await canvas.loadFromJSON(side.canvas);
  }

  canvas.backgroundColor = side.backgroundColor;
  canvas.renderAll();

  const dataUrl = canvas.toDataURL({
    format: "png",
    multiplier: LETTER_LANDSCAPE.exportMultiplier,
    quality: 1
  });

  canvas.dispose();
  return dataUrl;
}

export function serializeCanvas(canvas: Canvas): Record<string, unknown> {
  return canvas.toJSON() as Record<string, unknown>;
}

export async function downloadSide(project: CardProject, side: CardSide) {
  const dataUrl = await renderSideToDataUrl(project[side]);
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = `${project.name}-${side}-3300x2550.png`;
  anchor.click();
}

export async function downloadBothSides(project: CardProject) {
  await downloadSide(project, "outside");
  window.setTimeout(() => {
    void downloadSide(project, "inside");
  }, 250);
}

export async function openPrintFlow(project: CardProject) {
  const [outside, inside] = await Promise.all([
    renderSideToDataUrl(project.outside),
    renderSideToDataUrl(project.inside)
  ]);

  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=1200,height=900");
  if (!printWindow) {
    await downloadBothSides(project);
    return;
  }

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${project.name} print sheets</title>
        <style>
          @page { size: 11in 8.5in; margin: 0; }
          html, body { margin: 0; background: #eef1f6; color: #182230; font-family: Arial, sans-serif; }
          .instructions { padding: 24px; max-width: 920px; line-height: 1.45; }
          .instructions h1 { margin: 0 0 10px; font-size: 24px; }
          .instructions ol { margin: 12px 0 0 20px; padding: 0; }
          .actions { margin-top: 18px; display: flex; gap: 10px; }
          button { border: 0; border-radius: 8px; background: #2457d6; color: white; padding: 10px 14px; font-weight: 700; cursor: pointer; }
          a { color: #2457d6; font-weight: 700; text-decoration: none; }
          .sheet { width: 11in; height: 8.5in; page-break-after: always; background: white; }
          .sheet img { width: 11in; height: 8.5in; display: block; object-fit: contain; }
          @media print {
            body { background: white; }
            .instructions { display: none; }
            .sheet { break-after: page; page-break-after: always; }
          }
        </style>
      </head>
      <body>
        <section class="instructions">
          <h1>${project.name}</h1>
          <p>Print on US Letter paper in landscape orientation. Print the outside first, then flip the sheet according to your printer's duplex direction and print the inside on the reverse. Fold vertically down the middle after both sides are printed.</p>
          <ol>
            <li>Use actual size / 100% scale.</li>
            <li>Choose landscape orientation.</li>
            <li>For manual duplex, print page 1, reload the sheet, then print page 2.</li>
          </ol>
          <div class="actions">
            <button onclick="window.print()">Print outside and inside</button>
            <a download="${project.name}-outside-3300x2550.png" href="${outside}">Download outside</a>
            <a download="${project.name}-inside-3300x2550.png" href="${inside}">Download inside</a>
          </div>
        </section>
        <section class="sheet"><img alt="Outside printable side" src="${outside}" /></section>
        <section class="sheet"><img alt="Inside printable side" src="${inside}" /></section>
      </body>
    </html>
  `);
  printWindow.document.close();
}
