// --------------------------------------------------
// MicrobiomeLibrary.js
// Defines environmental archetypes for Pond microbiomes
// --------------------------------------------------

const MicrobiomeLibrary = {

    open_water: {
    id: "open_water",
    name: "Open Water",
    anchorable: false,

    environment: {
        // --- 1. ABIOTIC PHYSICS ---
        physics: {
            light: 0.45,            // Calibrated for March semi-shade (0.0 to 1.0)
            oxygen: 0.90,           // Relative saturation ratio (1.0 = 100%)
            ph: 7.4,                // pH scale
            temperature: 8.0,       // Temperature in °C (March temperate pond)
            flow_rate: 0.2,         // Water turbulence (0 = still, 1 = heavy current)
            salinity: 0.01          // Osmolality / salt concentration (triggers encystment if high)
        },

        // --- 2. BASE INORGANIC NUTRIENTS (Fuels Primary Producers / Bacteria) ---
        nutrients: {
            glucose: 0.0001,        // mM (Kept very low due to fast bacterial uptake)
            nitrates: 0.015,        // mM (Spring runoff level)
            phosphates: 0.0003,     // mM (Realistic P-limited level)
            silica: 0.002,          // mM (Fuels diatoms/micro-algae)
            doc: 0.05               // Dissolved Organic Carbon (Peptides/Proteins from dead cells)
        },

        // --- 3. SIGNALING & CHEMOATTRACTANTS (What Amoebas "Smell") ---
        signals: {
            folate: 0.02,           // Active bacterial growth signal (+)
            n_formyl_peptides: 0.01,// Prokaryote presence signal (+)
            scfa: 0.005,            // Short-chain fatty acids / fermentation (+)
            camp: 0.0,              // Extracellular cAMP / stress signal
            cyanotoxins: 0.0,       // Toxic bloom warning signal (-)
            ammonia: 0.001          // Metabolic waste product (-)
        },

        // --- 4. BIOLOGICAL POPULATIONS & HAZARDS ---
        populations: {
            // Friendly / Neutral Prey
            green_algae: 120,       // Chlorella/Diatom density
            heterotrophic_bacteria: 850, // Standard non-toxic bacterial prey

            // Offensive / Defensive Bacteria
            toxic_bacteria: 0,      // Chromobacterium (Violacein spitters)
            capsular_bacteria: 25,  // Slippery Klebsiella (hard to engulf)
            filamentous_bacteria: 10,// Too long to fit in vacuole

            // Predators & Pathogens
            giant_viruses: 2,       // Mimivirus / Pithovirus particles (Trojans)
            predatory_bacteria: 0,  // Myxobacteria / Bdellovibrio

            // Macro-Hazards & Vectors
            rotifers: 1,            // Vortex turrets
            daphnia: 0              // Screen-clearing sweepers / fast-travel vectors
        }
    }
},


    algae_patch: {
    id: "algae_patch",
    name: "Algae Patch (Phototrophic Bloom Zone)",
    anchorable: true, // Amoebas can anchor to algal filaments

    environment: {
        // --- 1. ABIOTIC PHYSICS ---
        physics: {
            light: 0.85,            // High (Photosynthetic canopy near surface)
            oxygen: 1.40,           // Supersaturated (>100%) during daytime photosynthesis
            ph: 8.8,                // High/Alkaline (Photosynthesis strips CO2 from water)
            temperature: 10.5,      // Slightly warmer than open water due to solar absorption
            flow_rate: 0.05,        // Very slow/sheltered inside the dense algal mat
            salinity: 0.01          // Baseline freshwater
        },

        // --- 2. BASE INORGANIC & ORGANIC NUTRIENTS ---
        nutrients: {
            glucose: 0.002,         // Elevated relative to open water (algal exudates), but kept in µM range by rapid bacterial consumption
            nitrates: 0.002,        // Severely depleted (algae consume N rapidly to grow)
            phosphates: 0.0001,     // Exhausted (P-limitation triggers algal sugar excretion)
            silica: 0.0005,         // Low (consumed if diatoms are present)
            doc: 0.18               // Very high Dissolved Organic Carbon (excreted glycolate, glycerol, and sugars)
        },

        // --- 3. SIGNALING & CHEMOATTRACTANTS (Amoeba Sensory Radar) ---
        signals: {
            folate: 0.08,           // Massive signal! Bacterial biofilm feeding on algal sugars emits heavy folate
            n_formyl_peptides: 0.04,// High bacterial density
            scfa: 0.015,            // Fermentation products in tight algal clumps
            camp: 0.001,            // Low cellular stress signal
            cyanotoxins: 0.005,     // Faint background trace (assuming non-toxic green algae dominance)
            ammonia: 0.002          // Low metabolic waste
        },

        // --- 4. BIOLOGICAL POPULATIONS & HAZARDS ---
        populations: {
            // Primary Producers & Friendly Prey
            green_algae: 2400,      // Dense population (Chlorella, Spirogyra)
            heterotrophic_bacteria: 3200, // Massive bacterial biofilm feeding on algal exudates

            // Enemy Archetypes
            toxic_bacteria: 10,     // Low trace
            capsular_bacteria: 150,  // Slippery bacteria living in algal mucilage
            filamentous_bacteria: 80,// Thread-like species woven into algae

            // Predators & Pathogens
            giant_viruses: 12,      // High risk! (Viruses thrive in dense host patches)
            predatory_bacteria: 5,   // Acid-spitters patrolling the biofilm

            // Macro-Hazards
            rotifers: 4,            // Anchored on algal strands, spinning vortexes
            daphnia: 2              // Attracted to algal patches to graze
        }
    }
},

leaf_surface: {
    id: "leaf_surface",
    name: "Leaf Surface (Submerged Detrital Biofilm)",
    anchorable: true, // Amoebas easily crawl on leaf surfaces

    environment: {
        // --- 1. ABIOTIC PHYSICS ---
        physics: {
            light: 0.25,            // Low/Shaded (Sunk under overhangs/debris)
            oxygen: 0.65,           // Sub-saturated (Bacterial decay consumes oxygen)
            ph: 6.8,                // Slightly acidic (Organic tannic/humic acids leaching from leaf)
            temperature: 7.5,       // Slightly cooler, sheltered bottom water
            flow_rate: 0.02,        // Stagnant boundary layer right on the leaf surface
            salinity: 0.012         // Faintly elevated due to leaching minerals
        },

        // --- 2. BASE INORGANIC & ORGANIC NUTRIENTS ---
        nutrients: {
            glucose: 0.0005,        // Moderate (leached from decaying tissue, rapidly eaten)
            nitrates: 0.025,        // High (accumulates from organic decomposition)
            phosphates: 0.004,      // High (released as leaf cell walls break down)
            silica: 0.003,          // Moderate
            doc: 0.35               // Maximum Dissolved Organic Carbon (leaching tannins, humic substances, and proteins)
        },

        // --- 3. SIGNALING & CHEMOATTRACTANTS (Amoeba Sensory Radar) ---
        signals: {
            folate: 0.05,           // High (Decomposer bacteria actively growing)
            n_formyl_peptides: 0.06,// High (Decomposer bacterial proteins)
            scfa: 0.035,            // High! Anaerobic fermentation underneath the leaf
            camp: 0.01,             // Moderate cell stress/death signals from decaying tissue
            cyanotoxins: 0.0,       // None (Too shaded for cyanobacteria)
            ammonia: 0.012          // Elevated (Breakdown of plant proteins)
        },

        // --- 4. BIOLOGICAL POPULATIONS & HAZARDS ---
        populations: {
            // Primary Producers & Friendly Prey
            green_algae: 40,        // Very low (light-limited)
            heterotrophic_bacteria: 4100, // Massive decomposer population (The "Peanut Butter")

            // Enemy Archetypes
            toxic_bacteria: 45,     // Higher (Serratia / Chromobacterium thrive on decaying detritus)
            capsular_bacteria: 310,  // Heavy capsule formation to attach to leaf fibers
            filamentous_bacteria: 220,// Fungal-like actinobacteria breaking down cellulose

            // Predators & Pathogens
            giant_viruses: 3,       // Low/Moderate
            predatory_bacteria: 25,  // High! (Myxobacteria wolfpacks hunt on leaf surfaces)

            // Macro-Hazards
            rotifers: 6,            // Anchored firmly to leaf veins
            daphnia: 0              // Rare (Daphnia prefer open water, avoid thick detritus)
        }
    }
},

sediment_grain: {
    id: "sediment_grain",
    name: "Sediment Grain (Benthic Mud Zone)",
    anchorable: true, // Amoebas easily crawl across mineral grains

    environment: {
        // --- 1. ABIOTIC PHYSICS ---
        physics: {
            light: 0.02,            // Near pitch-black (Sunk beneath top sediment layers)
            oxygen: 0.15,           // Hypoxic / Near-anoxic (Decomposition strips oxygen)
            ph: 6.6,                // Acidic (Hydrogen sulfide and carbonic acid accumulation)
            temperature: 4.5,       // Thermal bunker layer! (Stable 4°C freshwater bottom in early spring)
            flow_rate: 0.0,         // Zero current (Stagnant pore-water between grains)
            salinity: 0.035         // Highest salinity (Leached minerals and heavy ions settle at the bottom)
        },

        // --- 2. BASE INORGANIC & ORGANIC NUTRIENTS ---
        nutrients: {
            glucose: 0.0001,        // Extrinsic sugars are zero; quickly consumed by anaerobic microbes
            nitrates: 0.005,        // Depleted (Anaerobic bacteria reduce nitrate to nitrogen gas via denitrification)
            phosphates: 0.015,      // Extremely high! (Iron/mineral complexes trap and concentrate phosphates at the bottom)
            silica: 0.025,          // High (Silt, quartz dissolution, and sinking dead diatom shells)
            doc: 0.45               // Maximum Dissolved Organic Carbon (Heavy layer of decaying organic sludge)
        },

        // --- 3. SIGNALING & CHEMOATTRACTANTS (Amoeba Sensory Radar) ---
        signals: {
            folate: 0.01,           // Low (Bacterial growth is slow due to cold & lack of oxygen)
            n_formyl_peptides: 0.02,// Moderate (Background bacterial biomass)
            scfa: 0.08,             // Massive signal! High fermentation & anaerobic metabolic waste (butyrate, acetate)
            camp: 0.04,             // High (Dead organic cell-lysis leakage)
            cyanotoxins: 0.0,       // None (No light for cyanobacteria to grow)
            ammonia: 0.035          // High metabolic waste / toxicity haze from anaerobic reduction
        },

        // --- 4. BIOLOGICAL POPULATIONS & HAZARDS ---
        populations: {
            // Primary Producers & Friendly Prey
            green_algae: 0,         // Zero (Cannot survive without light)
            heterotrophic_bacteria: 1200, // Moderate, slow-growing anaerobic bacteria

            // Enemy Archetypes
            toxic_bacteria: 120,    // High! Sulfate-reducing and gas-producing anaerobic bacteria
            capsular_bacteria: 80,   // Moderate
            filamentous_bacteria: 300,// High (Actinobacteria and spore-forming Bacillus spp.)

            // Dormant States & Vectors (Unique to Sediment!)
            amoeba_cysts: 450,      // Massive reservoir of overwintering dormant amoebas!

            // Predators & Pathogens
            giant_viruses: 1,       // Very low viral activity in cold mud
            predatory_bacteria: 60,  // High! Obligate predatory bacteria hunting dormant cells

            // Macro-Hazards
            rotifers: 0,            // None (Need oxygen and water movement)
            daphnia: 0              // None (Cannot penetrate thick bottom mud)
        }
    }
},

biofilm_mat: {
    id: "biofilm_mat",
    name: "Biofilm Mat (Extracellular Slime Matrix)",
    anchorable: false, // Amoebas easily crawl across and through the sticky EPS matrix

    environment: {
        // --- 1. ABIOTIC PHYSICS ---
        physics: {
            light: 0.35,            // Moderate/Low (Shadowed under the top slime/diatom layer)
            oxygen: 0.40,           // Steep gradient! Outer edge is oxygenated, deep core is near-anoxic
            ph: 7.2,                // Micro-environments range from neutral to slightly acidic in deeper layers
            temperature: 9.0,       // Ambient pond temperature
            flow_rate: 0.01,        // Very low (The thick EPS gel shields the interior from water currents)
            salinity: 0.02          // Slightly elevated due to trapped ionic polymers in the matrix
        },

        // --- 2. BASE INORGANIC & ORGANIC NUTRIENTS ---
        nutrients: {
            glucose: 0.0015,        // Trapped in the slime matrix; constantly recycled by matrix microbes
            nitrates: 0.020,        // Moderate (Trapped from passing water column)
            phosphates: 0.008,      // High (Concentrated inside the organic matrix)
            silica: 0.008,          // Moderate (Used by embedded surface diatoms)
            doc: 0.50               // MAXIMUM! The slime matrix itself is pure organic carbon (polysaccharides/proteins)
        },

        // --- 3. SIGNALING & CHEMOATTRACTANTS (Amoeba Sensory Radar) ---
        signals: {
            folate: 0.12,           // MAXIMUM SIGNAL! Densely packed, actively dividing bacteria flood the radar
            n_formyl_peptides: 0.10,// Maximum bacterial protein density
            scfa: 0.05,             // High (Fermentation occurring in the deeper anaerobic micro-pockets)
            camp: 0.02,             // Moderate (Constant cell turnover/death within the crowded mat)
            cyanotoxins: 0.002,     // Faint trace (If cyanobacteria are embedded in the upper mat)
            ammonia: 0.018          // Elevated metabolic waste trapped in stagnant gel pores
        },

        // --- 4. BIOLOGICAL POPULATIONS & HAZARDS ---
        populations: {
            // Primary Producers & Friendly Prey
            green_algae: 350,       // Diatoms and micro-algae trapped in the outer layer
            heterotrophic_bacteria: 5500, // DENSEST POPULATION! A complete all-you-can-eat prey buffet

            // Enemy Archetypes (High-Density Defenses!)
            toxic_bacteria: 110,    // High! Pseudomonas / Chromobacterium using matrix shelter to spit toxins
            capsular_bacteria: 850,  // EXTREME! Bacteria producing the slime matrix are heavily coated & slippery
            filamentous_bacteria: 450,// High! Actinobacteria forming structural scaffolding for the mat

            // Predators & Pathogens
            giant_viruses: 25,      // MAXIMUM RISK! Giant viruses thrive in high-density bacterial/amoebic hubs
            predatory_bacteria: 80,  // HIGH RISK! Myxobacteria wolfpacks use the matrix surface as a highway

            // Macro-Hazards & Vectors
            rotifers: 8,            // High! Anchored to the firm slime surface, setting up vortex traps
            daphnia: 0              // Zero (Too thick and sticky for water fleas to swim through)
        }
    }
},

detritus_cloud: {
    id: "detritus_cloud",
    name: "Detritus Cloud (Suspended Organic Plume)",
    anchorable: false, // Particles are drifting in mid-water; no solid fixed floor

    environment: {
        // --- 1. ABIOTIC PHYSICS ---
        physics: {
            light: 0.20,            // Low (High turbidity / suspended silt & debris block sunlight)
            oxygen: 0.30,           // Low (Rapid bacterial respiration on decaying flakes strips oxygen)
            ph: 6.9,                // Slightly acidic (Carbon dioxide & organic acids from decomposition)
            temperature: 8.5,       // Ambient spring water temperature
            flow_rate: 0.35,        // High local movement (Turbulence/currents keeping debris suspended)
            salinity: 0.018         // Slightly elevated (Leaching ions from disintegrating cell walls)
        },

        // --- 2. BASE INORGANIC & ORGANIC NUTRIENTS ---
        nutrients: {
            glucose: 0.0012,        // High local leaching from decaying tissue, but actively consumed by bacteria
            nitrates: 0.035,        // High (Organic nitrogen breaking down from dead cellular material)
            phosphates: 0.012,      // High (Phosphate release from lysed plant/animal cell membranes)
            silica: 0.005,          // Moderate (Crushed diatom frustules floating in the debris)
            doc: 0.42               // EXTREMELY HIGH! Mass of dissolved proteins, amino acids, and cellulose fragments
        },

        // --- 3. SIGNALING & CHEMOATTRACTANTS (Amoeba Sensory Radar) ---
        signals: {
            folate: 0.09,           // High! Dense bacterial clusters feeding on organic flakes emit strong folate
            n_formyl_peptides: 0.08,// High! Protein breakdown and bacterial swarm signals
            scfa: 0.04,             // Moderate/High (Micro-pockets of fermentation inside dense debris clumps)
            camp: 0.035,            // HIGH! Massive cellular lysis / dead cell stress signals floating in the water
            cyanotoxins: 0.001,     // Faint trace (If decaying matter includes dead cyanobacteria)
            ammonia: 0.025          // Elevated metabolic waste from protein decomposition
        },

        // --- 4. BIOLOGICAL POPULATIONS & HAZARDS ---
        populations: {
            // Primary Producers & Friendly Prey
            green_algae: 80,        // Low (Light is too blocked by cloud turbidity for active algae)
            heterotrophic_bacteria: 4200, // HIGH PREY DENSITY! Decomposer bacteria colonizing the debris flakes

            // Enemy Archetypes (Decomposer & Structural Defenses)
            toxic_bacteria: 70,     // Moderate/High (Serratia / necrotrophic bacteria feeding on dead matter)
            capsular_bacteria: 300,  // High (Bacteria secreting sticky coatings to adhere to drifting debris)
            filamentous_bacteria: 520,// MAXIMUM! Long, thread-like bacteria breaking down cellulose (hard to engulf)

            // Predators & Pathogens
            giant_viruses: 8,       // Moderate (Drifting particles carry viral fragments)
            predatory_bacteria: 45,  // High! Acid-spitting necrotrophs feeding on spilling organic matter

            // Macro-Hazards & Vectors
            rotifers: 2,            // Low (Free-swimming species filtering the debris edges)
            daphnia: 5              // HIGH! Daphnia actively swim into detritus clouds to filter-feed!
        }
    }
},

bacterial_bloom: {
    id: "bacterial_bloom",
    name: "Bacterial Bloom (Exponential Growth Zone)",
    anchorable: false, // Planktonic bloom suspended in open water

    environment: {
        // --- 1. ABIOTIC PHYSICS ---
        physics: {
            light: 0.35,            // Low/Cloudy (Extreme bacterial cell turbidity scatters sunlight)
            oxygen: 0.15,           // CRASHED! (Massive bacterial respiration strips oxygen out of the water)
            ph: 6.9,                // Slightly acidic (High CO2 production & organic acid excretions)
            temperature: 9.5,       // Slightly elevated (High metabolic activity in warm surface pockets)
            flow_rate: 0.08,        // Slow/Stagnant (Allows bloom density to accumulate)
            salinity: 0.015         // Elevated (Metabolic waste and ion leakage from dense cell turnover)
        },

        // --- 2. BASE INORGANIC & ORGANIC NUTRIENTS ---
        nutrients: {
            glucose: 0.004,         // Micromolar spike (Rapidly consumed by exponential bacterial growth)
            nitrates: 0.003,        // Severely depleted (Locked up inside bacterial biomass/proteins)
            phosphates: 0.0008,     // Exhausted (Locked up in bacterial ATP, RNA, and cell walls)
            silica: 0.001,          // Low
            doc: 0.75               // MAXIMUM! Dissolved Organic Carbon fuels the exponential explosion
        },

        // --- 3. SIGNALING & CHEMOATTRACTANTS (Amoeba Sensory Radar) ---
        signals: {
            folate: 0.20,           // ABSOLUTE MAXIMUM! Rapidly dividing bacteria emit huge folate pulses
            n_formyl_peptides: 0.15,// ABSOLUTE MAXIMUM! Peak prokaryotic protein synthesis
            scfa: 0.06,             // High (Micro-anaerobic pockets form as oxygen drops)
            camp: 0.05,             // HIGH! Cell-to-cell signaling, quorum sensing, and rapid division/lysis
            cyanotoxins: 0.001,     // Trace background
            ammonia: 0.045          // EXTREMELY HIGH! Massive nitrogenous waste buildup from the dense population
        },

        // --- 4. BIOLOGICAL POPULATIONS & HAZARDS ---
        populations: {
            // Primary Producers & Friendly Prey
            green_algae: 15,         // Shaded out and outcompeted for nutrients
            heterotrophic_bacteria: 9500, // MAXIMUM PREY DENSITY! An exponential all-you-can-eat buffet

            // Enemy Archetypes (Quorum-Sensing Defenses!)
            toxic_bacteria: 320,    // HIGH! Quorum sensing triggers mass toxin secretion at high density
            capsular_bacteria: 650,  // High (Sticky protective coatings)
            filamentous_bacteria: 180,// Moderate

            // Predators & Pathogens (Epidemic Conditions!)
            giant_viruses: 45,      // MAXIMUM HAZARD! Dense host population causes viral transmission rates to spike
            predatory_bacteria: 110, // HIGH! Bdellovibrio & Myxobacteria swarming the massive prey pool

            // Macro-Hazards
            rotifers: 0,            // Zero (Suffocate or flee due to severe hypoxia)
            daphnia: 0              // Zero (Cannot survive in crashed oxygen zones)
        }
    }
},

anaerobic_pocket: {
    id: "anaerobic_pocket",
    name: "Anaerobic Pocket (Anoxic Fermentation Zone)",
    anchorable: false, // Amoebas will not anchor to this in our model.
    environment: {
        // --- 1. ABIOTIC PHYSICS ---
        physics: {
            light: 0.00,            // ABSOLUTE ZERO (Sealed inside crevices/sub-surface layers)
            oxygen: 0.00,           // 100% ANOXIC! (Zero dissolved oxygen available)
            ph: 6.3,                // Acidic (Heavy buildup of organic fermentative acids & hydrogen sulfide)
            temperature: 6.5,       // Cold, stagnant micro-pocket
            flow_rate: 0.00,        // Completely stagnant (No water exchange with open water)
            salinity: 0.042         // High (Trapped mineral ions, iron sulfides, and heavy salts)
        },

        // --- 2. BASE INORGANIC & ORGANIC NUTRIENTS ---
        nutrients: {
            glucose: 0.0002,        // Micromolar trace (Fermented almost instantaneously by anaerobic pathways)
            nitrates: 0.001,        // Exhausted (Completely converted to N2 gas by denitrifying bacteria)
            phosphates: 0.012,      // High (Trapped insoluble/solubilized inorganic phosphorus)
            silica: 0.010,          // Moderate (Trapped mineral dissolution)
            doc: 0.58               // EXTREMELY HIGH! Mass of partially fermented organic molecules & acids
        },

        // --- 3. SIGNALING & CHEMOATTRACTANTS (Amoeba Sensory Radar) ---
        signals: {
            folate: 0.005,          // Near zero (Aerobic bacterial division is nonexistent)
            n_formyl_peptides: 0.015,// Faint background prokaryotic protein signal
            scfa: 0.12,             // ABSOLUTE MAXIMUM! Saturated with Short-Chain Fatty Acids (butyrate, acetate)
            camp: 0.03,             // High (Organic cell decay and stress signals)
            cyanotoxins: 0.00,      // Zero (Cyanobacteria cannot survive without light)
            ammonia: 0.060          // ABSOLUTE MAXIMUM! Severe toxicity haze (ammonia + H2S stink)
        },

        // --- 4. BIOLOGICAL POPULATIONS & HAZARDS ---
        populations: {
            // Primary Producers & Friendly Prey
            green_algae: 0,         // Zero (Cannot survive in pitch darkness)
            heterotrophic_bacteria: 750, // Moderate, specialized obligate anaerobic fermenters

            // Enemy Archetypes (Acid/Gas Spitters & Extremophiles)
            toxic_bacteria: 280,    // EXTREMELY HIGH! Sulfate-reducers producing hydrogen sulfide (H2S) gas
            capsular_bacteria: 90,   // Low
            filamentous_bacteria: 320,// High (Methanogenic and iron-reducing bacterial chains)

            // Dormant States (The Cyst Bunker)
            amoeba_cysts: 620,      // DENSE CYST RESERVOIR! Amoebas forced into stasis accumulate here

            // Predators & Pathogens
            giant_viruses: 0,       // Zero (Giant eukaryotic viruses cannot replicate in dormant cells)
            predatory_bacteria: 15,  // Very low (Most predatory bacteria require oxygen to hunt)

            // Macro-Hazards
            rotifers: 0,            // Zero (Suffocate instantly)
            daphnia: 0              // Zero (Cannot enter oxygen-free sealed pockets)
        }
    }
}

};

export default MicrobiomeLibrary;