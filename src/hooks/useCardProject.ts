import { useMemo, useState } from "react";
import type { CardProject, CardSide, CardSideData } from "../models/card";

const blankSide = (backgroundColor = "#ffffff"): CardSideData => ({
  backgroundColor,
  canvas: null
});

export function createBlankProject(): CardProject {
  return {
    id: crypto.randomUUID(),
    name: "Untitled folded card",
    outside: blankSide("#fffaf2"),
    inside: blankSide("#ffffff")
  };
}

export function useCardProject() {
  const [project, setProject] = useState<CardProject>(() => createBlankProject());
  const [activeSide, setActiveSide] = useState<CardSide>("outside");

  const activeSideData = useMemo(() => project[activeSide], [activeSide, project]);

  function updateSide(side: CardSide, data: Partial<CardSideData>) {
    setProject((current) => ({
      ...current,
      [side]: {
        ...current[side],
        ...data
      }
    }));
  }

  function renameProject(name: string) {
    setProject((current) => ({ ...current, name }));
  }

  return {
    project,
    activeSide,
    activeSideData,
    setActiveSide,
    updateSide,
    renameProject
  };
}
