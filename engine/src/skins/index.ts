// Registro de skins. Personagem novo = arquivo novo aqui + uma linha no mapa.
import type { Skin } from "./types";
import { jesus } from "./jesus";
import { pedro } from "./pedro";
import { andre } from "./andre";
import { zaqueu } from "./zaqueu";
import { morador } from "./morador";
import { fariseu } from "./fariseu";
import { figurantes } from "./figurantes";

export const SKINS: Record<string, Skin> = { jesus, pedro, andre, zaqueu, morador, fariseu, ...figurantes };

export function getSkin(id: string): Skin {
  const s = SKINS[id];
  if (!s) throw new Error(`skin "${id}" não existe (tem: ${Object.keys(SKINS).join(", ")})`);
  return s;
}
