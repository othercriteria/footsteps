# Four-seat paper trial 1

Print [the three-page kit](kit.pdf) at actual size on Letter or A4. The PDF has a 200 × 255 mm page and a 32 mm calibration square. Bring scissors, an opaque bag, and screens for four hands. The PDF includes cut pieces, a turn reference and an observer form. [Full rules](../docs/rules.md)

Use the base-1 rules with three Blue seats and one Red seat. Deal two tiles to each player from a supply of sixteen, leaving eight turns for EXIT six steps away at (0, 0), with START at (−4, −2). The trial gives the group two movement opportunities beyond the shortest path. This is a starting point for observing handling and deduction. Its balance at a social table is unmeasured.

Mark the origin on the observer sheet before the first turn so spoken coordinates and written observations agree.

**Read the seam first.** A black bar on the departing tile meets a black triangle on the receiving tile to form an arrow. Follow its point. Two complete arrows give two possible steps. An isolated bar or triangle leaves its direction closed. To teach it with the cut pieces, put 45 to the left of 107, then 188 to their right, with the IDs upright. The first seam allows only a step right. The second allows either direction. Replace 188 with 16 and the second seam is blocked both ways.

The small gray key records the face ID in decimal and binary. Read the **OUT** row left to right, then the **IN** row, to get all eight binary digits. Read down a column for one printed edge’s permissions. The columns are **W S E N** with the ID upright, and 1 means open. Face 16 shows `0001` over `0000`, so it permits departure only through its printed north edge. Face 12 shows `0000` over `1100`, so it accepts entry from its printed west and south edges. The key turns with the tile. [Face encoding](../docs/rules.md#reading-a-floor-tile)

The sixteen ordinary faces in print order are **188, 153, 16, 71, 45, 91, 121, 41, 234, 12, 44, 16, 74, 107, 41, 182**. This is the pilot generator's seed 0 with independent edge probability 0.55. Shuffle the physical pieces before dealing each session. Face 16 has a bar on its north edge and no entrance. Face 12 has entrances from south and west and no exit. Leave them in the bag mix for the first trial so the table encounters the possibility of one-way traps.

The procedural instructions and tile art are game materials under CC BY 4.0. The Typst source can regenerate the PDF with `typst compile --creation-timestamp 0 playtest/kit.typ playtest/kit.pdf` from the repository root. The PDF was built with Typst 0.15.1, Libertinus Serif, DejaVu Sans and DejaVu Sans Mono.

Record what the players misunderstood, where hidden information became visible, and when they first considered a nomination. Share observations under [the paper trial](https://github.com/othercriteria/footsteps/issues/8). The [virtual tabletop comparison](https://github.com/othercriteria/footsteps/issues/7) uses the same questions for evaluating human play.
