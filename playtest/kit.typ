#set document(title: "Footsteps • Four-seat paper playtest", author: "Footsteps contributors")
#set page(width: 200mm, height: 255mm, margin: (x: 13mm, y: 12mm),
  footer: context align(right, text(size: 8pt)[Footsteps · Paper trial 1 · #counter(page).display() / 3]))
#set text(font: "Libertinus Serif", size: 11pt)
#set par(leading: .48em)
#let faces = (188, 153, 16, 71, 45, 91, 121, 41, 234, 12, 44, 16, 74, 107, 41, 182)
#let edge = .6pt + black
#let size = 32mm
#let heading(body) = text(size: 22pt, weight: "bold", body)
#let subtitle(body) = text(size: 13pt, weight: "bold", body)
// Draw the north edge once. Turning the whole layer keeps the two lanes
// registered on opposite sides of every seam, including after a hand rotation.
#let ports(sends, accepts, d) = place(top + left, rotate(90deg * d,
  box(width: size, height: size, {
    if sends {
      place(top + left, dx: size / 2 - 4mm - 1.1mm,
        rect(width: 2.2mm, height: 4.5mm, fill: black, stroke: none))
    }
    if accepts {
      place(top + left, dx: size / 2 + 4mm - 2.6mm,
        polygon((0mm, 0mm), (5.2mm, 0mm), (2.6mm, 3.8mm), fill: black, stroke: none))
    }
  })
))
#let cell(face, name: none, show-id: true) = block(width: size, height: size, stroke: .45pt + luma(130), inset: 0pt, {
  let pairs = ()
  for d in range(4) {
    let bit = calc.pow(2, d)
    let sends = calc.odd(calc.div-euclid(face, 16 * bit))
    let accepts = calc.odd(calc.div-euclid(face, bit))
    pairs.push(str(int(sends)) + str(int(accepts)))
    ports(sends, accepts, d)
  }
  if name != none {
    place(center + horizon, text(weight: "bold", size: 12pt, name))
  } else if show-id {
    place(top + left, dx: 5.4mm, dy: 5.6mm,
      text(font: "DejaVu Sans", size: 7pt, fill: luma(105), weight: "bold", str(face)))
    place(top + left, dx: 5.4mm, dy: 8.8mm,
      text(font: "DejaVu Sans Mono", size: 6pt, fill: luma(105), pairs.join(" ")))
  }
})
// Show only the touching edges, at the same physical scale as the cut tiles.
#let seam(a, b, caption) = stack(dir: ttb, spacing: 1mm,
  box(width: 30mm, height: 15mm, clip: true,
    place(top + left, dx: 15mm - size, dy: (15mm - size) / 2,
      grid(columns: (size, size), gutter: 0pt, cell(a, show-id: false), cell(b, show-id: false)))),
  align(center, text(font: "DejaVu Sans", size: 8pt, caption)))
#let card(w, h, body) = block(width: w, height: h, stroke: edge, inset: 2mm, align(center + horizon, body))
#let four = range(4)

#[
#set block(spacing: 1.4mm)
#heading[Floor tiles]
#par[Print single-sided at *actual size* on Letter or A4. Check a square measures 32 mm. Use opaque stock or mount on identical opaque backs before cutting.]
#v(1mm)
#align(center, grid(columns: (size,) * 4, gutter: 0pt, ..faces.map(f => cell(f))))
#v(1mm)
#align(center, grid(columns: (size,) * 4, gutter: 0pt,
  cell(255, name: "START"), cell(255, name: "EXIT"),
  card(size, size, circle(radius: 6mm, stroke: edge, inset: 0pt, align(center + horizon, [●]))), card(size, size, [N ↑ \ Table north])))
#v(1mm)
#par[*Bag only the upper sixteen tiles.* Use the round marker or a coin. Keep the north card beside the floor.]
#par[*Follow a complete arrow.* Step from a bar on one tile into a triangle on the next.]
#align(center, grid(columns: (34mm,) * 3, align: center, column-gutter: 4mm,
  seam(45, 107, [Right only]), seam(107, 188, [Both ways]), seam(107, 16, [Blocked])))
#v(1mm)
#par[#text(size: 9pt)[The small ID and four bit pairs record the tile. Read clockwise from printed top, out then in. 1 = open, 0 = closed.]]
]
#pagebreak()

#heading[Seats, roles and ballots]
#par[Cut along the lines. Keep seat signs visible. Shuffle the four role cards face down and deal one privately to each seat. Read yours privately. This kit has one Red player, so no teammate recognition step is needed.]
#align(center, grid(columns: (39mm,) * 4, gutter: 0pt,
  ..four.map(i => card(39mm, 18mm, text(weight: "bold")[SEAT P#i])),
  ..("BLUE", "BLUE", "BLUE", "RED").map(role => card(39mm, 25mm, [Role \ #text(size: 15pt, weight: "bold", role)]))))
#v(4mm)
#align(center, grid(columns: (39mm,) * 4, gutter: 0pt,
  ..("YES", "NO").map(vote => four.map(i => card(39mm, 23mm, [P#i \ #text(size: 15pt, weight: "bold", vote)]))).flatten()))
#v(3mm)
#subtitle[Set up the floor]
#par[Choose P0 before roles are seen. Seat P1–P3 clockwise from P0. Put the marker on START. Put EXIT four tile widths east and two north of START, measuring center to center. Reserve the empty squares in between. Give each player two random floor tiles behind a screen. Keep the other eight in an opaque bag. Books or folded sheets work as screens.]
#subtitle[Commit and reveal a ballot]
#par[Each living player puts one named ballot face down in front of them. Keep the unused ballot concealed. Reveal together once all have committed. Announce each response by seat. If playing with deadlines, record a missed ballot as timed out and count it as no. Retrieve both ballots privately before the next vote.]
#subtitle[Win conditions]
#par[Blue wins immediately on reaching EXIT. Red wins if the bag is empty after movement and the marker has missed EXIT, or the last Blue player is eliminated. Eliminated players share their team’s result. Reveal roles at the end.]
#pagebreak()

#heading[Run and observe the trial]
#par[*Build.* The builder draws two tiles behind their screen. Place one tile from the whole hand with any quarter-turn rotation on an empty square touching START or an ordinary tile along an edge. EXIT alone gives no placement rights. Keep existing tiles fixed. Privately return one other tile to the bag and mix it well. On the last draw, take the single tile, place one from hand and skip the return.]
#par[*Move.* The builder proposes one legal step or staying put. Staying skips the vote. Otherwise reveal ballots together. A majority yes moves the marker. On a tie use the builder’s ballot, which can be no. Check the exit and bag win conditions now.]
#par[*Nominate.* Starting after the builder and ending with the builder, each surviving seat may pass or nominate one other living player. All living players, including the nominee, vote. Only a strict majority yes eliminates. Set that hand aside face down, keep the role hidden, and skip the seat thereafter. If at least one Blue player survives, continue even if every Red player is out. After nominations the next living seat after the builder builds.]
#par[*First trial.* Play untimed. Keep discussion to one trip around the table before a disputed ballot. Everyone hears each remark. Either team may tell the truth, bluff, or stay silent. Check claims using the public record and your own private information.]
#subtitle[Observer notes]
#par[Session / date #box(line(length: 38mm))  End turn #box(line(length: 12mm))  Winning team #box(line(length: 20mm))]
#for prompt in (
  "First disputed edge. Which turn, coordinates and rotation? What did the players read?",
  "First nomination. Which public action did the nominator cite? How far was EXIT?",
  "Any reveal of a private return or early ballot? Where did handling break down?",
  "Which seat sat out, for how many turns? What needed a moderator ruling?",
) [
  #text(size: 10pt, weight: "bold", prompt) \
  #v(3mm)
  #line(length: 100%, stroke: .35pt + gray)
  #v(3mm)
  #line(length: 100%, stroke: .35pt + gray)
]
#par[Record public placements, proposals, revealed ballots and eliminations. A public observer cannot reconstruct private draws and returns. For a full referee record, arrange private notes with all players in advance and collect them after play.]
#text(size: 8pt)[Daniel Klein and Footsteps contributors · Original game materials, CC BY 4.0 · creativecommons.org/licenses/by/4.0/]
