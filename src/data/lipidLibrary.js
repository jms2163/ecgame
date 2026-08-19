export const lipidLibrary =  Object.freeze({
  Saturated_Fatty_Acids: {
    C16_0: { Name: "Palmitic acid", C: 16, H: 32, O: 2 },
    C18_0: { Name: "Stearic acid", C: 18, H: 36, O: 2 },
    C20_0: { Name: "Arachidic acid", C: 20, H: 40, O: 2 },
    C22_0: { Name: "Behenic acid", C: 22, H: 44, O: 2 },
    C24_0: { Name: "Lignoceric acid", C: 24, H: 48, O: 2 }
  },

  Monounsaturated_Fatty_Acids: {
    C16_1: { Name: "Palmitoleic acid", C: 16, H: 30, O: 2 },
    C18_1: { Name: "Oleic acid", C: 18, H: 34, O: 2 },
    C20_1: { Name: "Gondoic acid", C: 20, H: 38, O: 2 },
    C22_1: { Name: "Erucic acid", C: 22, H: 42, O: 2 }
  },

  Polyunsaturated_Fatty_Acids: {
    Omega_6: {
      C18_2: { Name: "Linoleic acid", C: 18, H: 32, O: 2 },
      C18_3n6: { Name: "Gamma-linolenic acid", C: 18, H: 30, O: 2 },
      C20_3n6: { Name: "Dihomo-gamma-linolenic acid", C: 20, H: 34, O: 2 },
      C20_4: { Name: "Arachidonic acid", C: 20, H: 32, O: 2 }
    },
    Omega_3: {
      C18_3n3: { Name: "Alpha-linolenic acid", C: 18, H: 30, O: 2 },
      C20_5: { Name: "EPA (Eicosapentaenoic acid)", C: 20, H: 30, O: 2 },
      C22_6: { Name: "DHA (Docosahexaenoic acid)", C: 22, H: 32, O: 2 }
    }
  },

  Steroids_and_Sterols: {
    Cholesterol: { Name: "Cholesterol", C: 27, H: 46, O: 1 },
    Estradiol: { Name: "Estrogen (Estradiol)", C: 18, H: 24, O: 2 },
    Testosterone: { Name: "Testosterone", C: 19, H: 28, O: 2 },
    Progesterone: { Name: "Progesterone", C: 21, H: 30, O: 2 },
    Aldosterone: { Name: "Aldosterone", C: 21, H: 28, O: 5 },
    Cortisol: { Name: "Cortisol", C: 21, H: 30, O: 5 }
  },

  Prostaglandins_and_Lipid_Signals: {
    PGE2: { Name: "Prostaglandin E2", C: 20, H: 32, O: 5 },
    PGD2: { Name: "Prostaglandin D2", C: 20, H: 32, O: 5 },
    PGF2a: { Name: "Prostaglandin F2α", C: 20, H: 34, O: 5 },
    PGI2: { Name: "Prostacyclin", C: 20, H: 32, O: 5 },
    TXA2: { Name: "Thromboxane A2", C: 20, H: 32, O: 4 }
  }
});
