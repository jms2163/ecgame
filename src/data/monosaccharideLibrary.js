/**
 * MONOSACCHARIDES & AMINO SUGARS DATASTORE
 */
export const monosaccharides = {
  // --- C3 Sugars ---
  G3P: { Name: "Glyceraldehyde-3-phosphate", Type: "C3", C: 3, H: 7, O: 6, P: 1, Notes: "Glyceraldehyde-3-phosphate" },
  DHAP: { Name: "Dihydroxyacetone phosphate", Type: "C3", C: 3, H: 7, O: 6, P: 1, Notes: "Dihydroxyacetone phosphate" },

  // --- C4 Sugars ---
  Erythrose: { Name: "Erythrose", Type: "C4", C: 4, H: 8, O: 4 },
  Erythrulose: { Name: "Erythrulose", Type: "C4", C: 4, H: 8, O: 4 },

  // --- C5 Sugars ---
  Ribose: { Name: "Ribose", Type: "C5", C: 5, H: 10, O: 5 },
  Arabinose: { Name: "Arabinose", Type: "C5", C: 5, H: 10, O: 5 },
  Xylose: { Name: "Xylose", Type: "C5", C: 5, H: 10, O: 5 },
  Lyxose: { Name: "Lyxose", Type: "C5", C: 5, H: 10, O: 5 },
  Ribulose: { Name: "Ribulose", Type: "C5", C: 5, H: 10, O: 5 },
  Xylulose: { Name: "Xylulose", Type: "C5", C: 5, H: 10, O: 5 },
  Deoxyribose: { Name: "Deoxyribose", Type: "C5", C: 5, H: 10, O: 4 },

  // --- C6 Sugars ---
  Glucose: {
    Name: "Glucose",
    Type: "C6",
    C: 6,
    H: 12,
    O: 6,
    Charge: 0,
    atoms: [
      { type: "C", position: [2.618839, -0.534535, -0.309234] },
      { type: "C", position: [1.194041, 0.036433, -0.073303] },
      { type: "H", position: [1.284522, 0.973678, 0.48576] },
      { type: "C", position: [0.330023, -0.957196, 0.770603] },
      { type: "H", position: [0.247032, -1.903046, 0.224385] },
      { type: "C", position: [-1.099667, -0.35718, 0.921397] },
      { type: "H", position: [-1.026465, 0.613372, 1.425309] },
      { type: "C", position: [-1.693654, -0.110472, -0.496378] },
      { type: "H", position: [-1.736573, -1.065376, -1.033157] },
      { type: "C", position: [-0.703521, 0.83097, -1.289389] },
      { type: "H", position: [-1.03268, 0.914537, -2.339954] },
      { type: "O", position: [0.58695, 0.249945, -1.342718] },
      { type: "O", position: [-0.700102, 2.091035, -0.644872] },
      { type: "O", position: [-2.98376, 0.446699, -0.310522] },
      { type: "O", position: [-1.87601, -1.27809, 1.671038] },
      { type: "O", position: [0.945245, -1.139489, 2.034105] },
      { type: "O", position: [3.428008, 0.508796, -0.844804] },
      { type: "H", position: [2.995279, -0.897297, 0.656374] },
      { type: "H", position: [2.54294, -1.389663, -0.991558] },
      { type: "H", position: [-0.057911, 2.675728, -1.092075] },
      { type: "H", position: [-3.346082, 0.751231, -1.162597] },
      { type: "H", position: [-2.798212, -0.957425, 1.688285] },
      { type: "H", position: [0.29337, -1.567098, 2.623365] },
      { type: "H", position: [4.321787, 0.159844, -1.019761] }
    ],
    bonds: [
      { a: 0, b: 1 },
      { a: 1, b: 2 },
      { a: 1, b: 3 },
      { a: 3, b: 4 },
      { a: 3, b: 5 },
      { a: 5, b: 6 },
      { a: 5, b: 7 },
      { a: 7, b: 8 },
      { a: 7, b: 9 },
      { a: 9, b: 10 },
      { a: 9, b: 11 },
      { a: 9, b: 12 },
      { a: 7, b: 13 },
      { a: 5, b: 14 },
      { a: 3, b: 15 },
      { a: 1, b: 16 },
      { a: 0, b: 17 },
      { a: 0, b: 18 },
      { a: 12, b: 19 },
      { a: 13, b: 20 },
      { a: 14, b: 21 },
      { a: 15, b: 22 },
      { a: 16, b: 23 }
    ]
  },
  Mannose: { Name: "Mannose", Type: "C6", C: 6, H: 12, O: 6 },
  Galactose: { Name: "Galactose", Type: "C6", C: 6, H: 12, O: 6 },
  Gulose: { Name: "Gulose", Type: "C6", C: 6, H: 12, O: 6 },
  Idose: { Name: "Idose", Type: "C6", C: 6, H: 12, O: 6 },
  Talose: { Name: "Talose", Type: "C6", C: 6, H: 12, O: 6 },
  Allose: { Name: "Allose", Type: "C6", C: 6, H: 12, O: 6 },
  Altrose: { Name: "Altrose", Type: "C6", C: 6, H: 12, O: 6 },
  Fructose: { Name: "Fructose", Type: "C6", C: 6, H: 12, O: 6 },
  Sorbose: { Name: "Sorbose", Type: "C6", C: 6, H: 12, O: 6 },
  Tagatose: { Name: "Tagatose", Type: "C6", C: 6, H: 12, O: 6 },
  Psicose: { Name: "Psicose", Type: "C6", C: 6, H: 12, O: 6 },

  // --- Amino Sugars ---
  Glucosamine: { Name: "Glucosamine", Type: "C6", C: 6, H: 13, N: 1, O: 5 },
  NAcetylglucosamine: { Name: "N-Acetylglucosamine", Type: "C8", C: 8, H: 15, N: 1, O: 6 },
  NAcetylmuramicAcid: { Name: "N-Acetylmuramic Acid", Type: "C11", C: 11, H: 19, N: 1, O: 8 }
};

export default monosaccharides;