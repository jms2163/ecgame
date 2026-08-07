/**
 * MOTIF LIBRARY DATASTORE
 * Direct ES Module export — frozen against accidental runtime mutations.
 */
export const motifLibrary = Object.freeze({
  H_helix: Object.freeze({
    name: "Alpha Helix Motif",
    category: "motifs",
    aa_count: 20,
    atp_cost: 80,
    costs: Object.freeze({ L: 4, I: 4, V: 4, A: 4, F: 2, M: 2 }),
    description: "A right-handed coil stabilized by hydrogen bonds; primary membrane-spanning structure.",
    info: "The alpha helix, a <b>secondary structure</b>, is a tightly wound, right-handed coil formed by regular <b>hydrogen bonding</b> between backbone atoms. Its compact, cylindrical shape provides stability and is frequently used in membrane-spanning regions. As a structural component, the alpha helix helps define the protein’s overall three-dimensional form, contributing directly to its tertiary structure and therefore function."
  }),

  L_loop: Object.freeze({
    name: "Loop Motif",
    category: "motifs",
    aa_count: 8,
    atp_cost: 32,
    costs: Object.freeze({ G: 1, S: 1, T: 1, D: 1, E: 1, K: 1, R: 1, N: 1 }),
    description: "Flexible connector regions often found on the protein surface.",
    info: "Loops are flexible, irregular segments that connect more rigid secondary structures such as helices and sheets. Their mobility allows proteins to adopt precise shapes and often positions functional residues on the surface. By linking structural elements and enabling conformational adjustments, loops play a crucial role in shaping the protein’s overall three-dimensional tertiary structure and therefore function."
  }),

  B_sheet: Object.freeze({
    name: "Beta Sheet Motif",
    category: "motifs",
    aa_count: 7,
    atp_cost: 28,
    costs: Object.freeze({ V: 2, I: 1, L: 1, F: 1, Y: 1, T: 1 }),
    description: "Parallel or anti-parallel strands providing structural rigidity.",
    info: "Beta sheets are formed by extended strands aligned side-by-side, stabilized by hydrogen bonds between backbone atoms. Their planar, sheet-like arrangement provides rigidity and strength to protein cores. As a major <b>secondary structural</b> element, the beta sheet contributes significantly to the protein’s overall three-dimensional tertiary structure, helping define its stability and shape and therefore function."
  }),

  C_coil: Object.freeze({
    name: "Coiled-Coil Domain",
    category: "motifs",
    aa_count: 28,
    atp_cost: 112,
    costs: Object.freeze({ L: 4, I: 4, V: 4, M: 4, E: 3, K: 3, Q: 3, A: 3 }),
    description: "Highly stable structural motif formed by the interleaving of helices.",
    info: "The coiled-coil domain consists of two or more alpha helices wrapped around each other, stabilized by hydrophobic interactions and specific residue patterns. This interleaving creates a strong, rope-like structure frequently used in protein dimerization and mechanical support. As a robust architectural element, the coiled-coil domain helps shape the protein’s overall three-dimensional tertiary structure and therefore function."
  })
});