import type { SetFactory } from "./types";
import { campfire } from "./campfire";
import { galilee } from "./galilee";
import { jericho } from "./jericho";
import { casaZaqueu } from "./casa-zaqueu";

export const SETS: Record<string, SetFactory> = { campfire, galilee, jericho, "casa-zaqueu": casaZaqueu };
