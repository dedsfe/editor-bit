// Confere se toda skin tem grids do tamanho certo, cores na paleta e boca/olhos dentro do rosto.
import { SKINS } from "../src/skins";
let bad = 0;
for (const s of Object.values(SKINS)) {
  const parts = [...s.parts, ...Object.values(s.variants ?? {}).flat()];
  for (const p of parts)
    p.grid.forEach((row, y) => {
      if (p.at[0] + row.length > s.w) { console.log(`${s.id}/${p.name} linha ${y}: largura ${row.length}`); bad++; }
      for (const c of row) if (c !== "." && !s.palette[c]) { console.log(`${s.id}/${p.name}: cor "${c}" fora da paleta`); bad++; }
    });
  for (const g of Object.values(s.feet)) if (g.some((r) => r.length !== s.w)) { console.log(`${s.id}: pés com largura errada`); bad++; }
}
console.log(bad ? `${bad} problema(s)` : `ok: ${Object.keys(SKINS).join(", ")}`);
process.exit(bad ? 1 : 0);
