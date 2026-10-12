import type { SetFactory } from "./types";
import { campfire } from "./campfire";
import { galilee } from "./galilee";

export const SETS: Record<string, SetFactory> = { campfire, galilee };
