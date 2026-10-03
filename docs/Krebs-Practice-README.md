# Krebs Cycle: complete guided practice and circular replay

Install this update from the project root:

```bash
cd "$HOME/Documents/DCC/BIO 101/ecgame"
unzip -o "$HOME/Downloads/ECGame-Krebs-Practice-2026-10-01.zip" -d .
node --test tests/krebs-*.test.mjs tests/calvin-*.test.mjs tests/metabolism-*.test.mjs
```

Unzip writes directly into the project; no cp is needed. Hard-refresh the browser, open Metabolism, select **Krebs Cycle (TCA)** on the Systems Map or Available Maps, and use **Pathway Detail**. The circle appears immediately. The Metabolism zone still uses its existing Glucose Transporter unlock.

Click any of the eight dots or enzyme practice cards to begin; they are permanently available inside the unlocked Metabolism zone. Enzyme inspection dialogs also have a **Practice enzyme** button, including for unsynthesized proteins. During practice the Available Maps and reconstruction area collapse so the cycle and reaction have room. **Exit practice** restores them. No enzyme synthesis, normal pathway activation, or pyruvate-oxidation completion is required for educational exploration.

## What students do

1. Drag or click the enzyme card into its dock.
2. Drag or click each required substrate/cofactor card into its matching dock. Supplied tokens do not use real inventory.
3. Click the reaction button. Carbon circles glide, selected functional groups and bonds change together, and carrier transfers are animated. No reaction commits until its animation finishes.
4. For a two-part reaction, the intermediate and released products remain visible until **Continue**. Products never jump immediately to another reaction.
5. Click **Store products in output tray** after the enzyme is finished. The collected molecule and carriers stay visible beside the quiz.
6. Answer three Bio 101 questions. After every answer, an explanation stays visible until **Next question**. Wrong answers advance and count against the score; replay is needed for a perfect score.
7. **View practice result** records a green P only after a complete reaction and 100% on all three questions. Choose the next enzyme, replay, or exit. Any enzyme can be explored first.

There are eight independent practices and 24 questions. Aconitase, isocitrate dehydrogenase, and succinate dehydrogenase each contain two visible parts. The alpha-ketoglutarate dehydrogenase complex is one grouped net reaction. Existing enzyme images are used if present in the visual catalog; other enzymes use labeled enzyme badges. This patch requires no new PNG protein series.

## Overall Automate mode

**Automate** unlocks only after all eight Krebs enzyme IDs have saved perfect-practice markers. Calvin markers and normal reconstruction do not substitute. The center button then animates an entire turn with carbon spheres, moving inputs, and released products. Double bonds are shown in fumarate and cis-aconitate. CO2 appears as O-C-O. NAD+ enters the oxidative reactions; NADH leaves. The simulated tray counts the products after each enzyme finishes.

One turn per acetyl-CoA produces 2 CO2, 3 NADH, one electron pair captured through enzyme-bound FAD and delivered to Q as QH2, and 1 ATP in this ADP-based model. Oxaloacetate returns to start another turn. Two turns per glucose double those yields. The default is a single turn; enable **Repeat automatic turns** for continuous replay. **Stop animation**, navigation, zone exit, and game-load cleanup cancel moving tokens. Reduced-motion preferences shorten animations.

The replay does not award additional P markers, spend or generate real ATP/metabolites, synthesize proteins, complete a reconstruction, unlock another pathway/zone, or award discoveries/achievements. The only persisted learning result is the existing `metabolism.state.practiceMastery` marker for a perfectly completed practice. No save migration is added. Failed saves roll back new mastery and offer a retry. A lower-scoring replay never removes an existing P.

## Biological scope and safeguards

- Skeleton circles count substrate carbons only. CoA contains its own atoms, which are not part of the 2-carbon acetyl or 4-carbon succinyl count.
- Functional-group labels show –OH, =O, C–C/C=C, phosphate P, and –S–CoA. End carbons carry schematic carboxyl oxygen labels; these are not extra carbon atoms. Unshown hydrogens and full stereochemistry are omitted.
- The citrate skeleton is branched; aconitase moves –OH to a neighboring carbon through cis-aconitate. Water is removed and added back, for net zero water use in this enzyme.
- Isocitrate dehydrogenase uses NAD+, not NADPH, in this respiratory model. Its transient oxalosuccinate is shown to separate oxidation from CO2 release.
- The alpha-ketoglutarate dehydrogenase complex includes multiple catalytic components and bound cofactors; only its net reaction is modeled.
- Succinyl-CoA synthetase uses the ATP-forming ADP + Pi route already chosen by the game. GDP/GTP isoforms also exist. It does not consume ATP to make its forward product in this exercise. Phosphate intermediates are omitted.
- Succinate dehydrogenase is membrane-associated Complex II. FAD/FADH2 stays bound, not in the free-product tray. Electrons pass to Q, which takes up protons from solution to form QH2. The animation shows electron travel, not a direct hydride transfer from FADH2 to Q; detailed proton exchanges are omitted. One FADH2-equivalent is an accounting label for this capture event, not an extra product in addition to QH2.
- Fumarase hydrates a double bond without cleaving the carbon skeleton. Malate dehydrogenase oxidizes –OH to =O and regenerates oxaloacetate.
- CO2 released in the first turn derives from the starting oxaloacetate, not the newly added acetyl carbons. This prototype follows molecular skeleton counts, not isotope-resolved atom tracing. All carbon circles use the same color to avoid assigning a false origin.
- Pyruvate oxidation is outside the cycle and is not newly implemented here. Oxygen is not a direct reagent in any of these eight steps; the ETC uses it later and regenerates electron acceptors.
- This one-way teaching animation does not simulate reaction equilibria or cellular regulation.

Scientific references checked while building:

- RCSB PDB-101, Citric Acid Cycle: https://pdb101.rcsb.org/motm/154
- Reactome, Citric Acid Cycle: https://reactome.org/content/detail/R-HSA-71403
- Reactome pathway summary, including ATP/GTP alternatives: https://pubchem.ncbi.nlm.nih.gov/pathway/Reactome%3AR-HSA-71403

## Instructor reaction and question checklist

For each enzyme: run all parts, pause to read products, collect, answer the questions, verify the P and Next/Replay/Exit controls. Try one wrong answer and confirm no new P; then replay perfectly. Also verify leaving during an animation does not finish it.

### 1. Citrate Synthase

**Net reaction:** Oxaloacetate + acetyl-CoA + H₂O → citrate + CoA–SH

Join a four-carbon acceptor to a two-carbon acetyl group. CoA is a reusable carrier; its own carbons are not counted in the acetyl group. Water is used in thioester hydrolysis; intermediates are omitted.

**Reaction parts:**

1. **Join the acetyl group to oxaloacetate.** 4 C + 2 C form a 6 C product. The acetyl group leaves CoA; CoA–SH is released.

**Questions and answer key:**

1. How many carbons are in citrate?
   - Options: Two / Four / Six
   - Correct: **Six**
   - Explanation: Four from oxaloacetate plus two in the acetyl group make six.
2. What enters this cycle from acetyl-CoA?
   - Options: A two-carbon acetyl group / A six-carbon glucose / A phosphate group
   - Correct: **A two-carbon acetyl group**
   - Explanation: Acetyl-CoA delivers a two-carbon acetyl group.
3. Is CoA used up permanently here?
   - Options: Yes, its atoms vanish / No, it is released and can be reused / Yes, it becomes CO₂
   - Correct: **No, it is released and can be reused**
   - Explanation: CoA is released as CoA–SH and can carry another acyl group.

### 2. Aconitase

**Net reaction:** Citrate ⇌ isocitrate (water removed, then added back; net water use = 0)

Move the hydroxyl group to a neighboring carbon without changing the number of carbons. The released water is available to add back; no NAD⁺ or NADH participates.

**Reaction parts:**

1. **Remove water and form a double bond.** The –OH disappears as the neighboring C–C bond becomes C=C. The six-carbon intermediate is cis-aconitate.
2. **Add the water back in the new position.** The C=C becomes C–C and –OH appears on the neighboring carbon. This is an isomerization, not an oxidation.

**Questions and answer key:**

1. What changed from citrate to isocitrate?
   - Options: The number of carbons / The position of the –OH group / NADH became NAD⁺
   - Correct: **The position of the –OH group**
   - Explanation: The hydroxyl group changes position while all six carbons remain.
2. How many carbons are in isocitrate?
   - Options: Four / Five / Six
   - Correct: **Six**
   - Explanation: Aconitase rearranges the six-carbon molecule; no CO₂ is released.
3. What is the net water use across both parts?
   - Options: Zero: removed then added back / Two waters are used / One water is made as net output
   - Correct: **Zero: removed then added back**
   - Explanation: One water is removed and one is added back, so net use is zero.

### 3. Isocitrate Dehydrogenase

**Net reaction:** Isocitrate + NAD⁺ → α-ketoglutarate + CO₂ + NADH + H⁺

Use the NAD⁺-dependent respiratory enzyme. First oxidize an alcohol to a carbonyl; then release one carbon as CO₂. The short-lived intermediate is shown only to make these two changes visible.

**Reaction parts:**

1. **Oxidize –OH to =O and reduce NAD⁺.** The substrate is oxidized: –OH becomes =O. NAD⁺ accepts a hydrogen with two electrons and becomes NADH.
2. **Release one carbon as CO₂.** Six carbons become five plus one CO₂. The NADH made in the first part stays in the local products.

**Questions and answer key:**

1. Where did the missing carbon go?
   - Options: Into ATP / Into CO₂ / It disappeared
   - Correct: **Into CO₂**
   - Explanation: One carbon leaves the six-carbon substrate as CO₂.
2. What happens to NAD⁺?
   - Options: It accepts electrons and becomes NADH / It donates electrons and becomes NADPH / It becomes ATP
   - Correct: **It accepts electrons and becomes NADH**
   - Explanation: NAD⁺ is reduced to NADH as the substrate is oxidized.
3. How many carbons remain in α-ketoglutarate?
   - Options: Four / Six / Five
   - Correct: **Five**
   - Explanation: The six-carbon substrate loses one carbon as CO₂, leaving five.

### 4. α-Ketoglutarate Dehydrogenase Complex

**Net reaction:** α-Ketoglutarate + CoA–SH + NAD⁺ → succinyl-CoA + CO₂ + NADH + H⁺

This card represents a multienzyme complex. It couples oxidation and CO₂ release to attachment of CoA. Its enzyme-bound cofactors and detailed intermediates are omitted.

**Reaction parts:**

1. **Release CO₂, capture electrons, and attach CoA.** Five substrate carbons become four plus CO₂. NADH stores electrons; CoA carries the four-carbon succinyl group.

**Questions and answer key:**

1. How many substrate carbons remain in the succinyl group?
   - Options: Four / Five / Six
   - Correct: **Four**
   - Explanation: A five-carbon substrate releases one carbon as CO₂, leaving four in the succinyl group.
2. Which carrier attaches to the remaining carbon skeleton?
   - Options: ATP / CoA / NADH
   - Correct: **CoA**
   - Explanation: CoA becomes attached to the four-carbon succinyl group.
3. What else is produced along with CO₂?
   - Options: NADPH / Oxygen / NADH
   - Correct: **NADH**
   - Explanation: NAD⁺ accepts electrons during oxidation and becomes NADH.

### 5. Succinyl-CoA Synthetase

**Net reaction:** Succinyl-CoA + ADP + Pᵢ → succinate + CoA–SH + ATP

This practice uses the ATP-forming version, matching the game catalog. Other isoforms use GDP and form GTP instead. Energy from the succinyl-CoA thioester drives substrate-level phosphorylation; phosphate intermediates are omitted.

**Reaction parts:**

1. **Use thioester energy to form ATP.** CoA is released. A phosphate joins ADP to make ATP; all four substrate carbons remain.

**Questions and answer key:**

1. What directly makes ATP in this reaction?
   - Options: A proton gradient through ATP synthase / Substrate-level phosphorylation / Light absorbed by chlorophyll
   - Correct: **Substrate-level phosphorylation**
   - Explanation: Energy from the substrate drives phosphate addition to ADP.
2. Where does ATP’s added phosphate come from?
   - Options: Inorganic phosphate, Pᵢ / A carbon atom / NADH
   - Correct: **Inorganic phosphate, Pᵢ**
   - Explanation: Inorganic phosphate joins ADP; phosphate intermediates are omitted in the animation.
3. What is released from succinyl-CoA?
   - Options: CO₂ / NADPH / CoA–SH
   - Correct: **CoA–SH**
   - Explanation: CoA–SH is released while the four-carbon succinate remains.

### 6. Succinate Dehydrogenase · Complex II

**Net reaction:** Succinate + Q → fumarate + QH₂ (through enzyme-bound FAD/FADH₂)

Complex II sits in the inner mitochondrial membrane. FAD stays bound inside it. The familiar “one FADH₂ per turn” describes this electron-capture event, not a free FADH₂ molecule sent to an output tray. QH₂ carries the electrons onward.

**Reaction parts:**

1. **Remove hydrogen and reduce bound FAD.** The central C–C becomes C=C. Two H and two electrons go to the enzyme’s FAD, forming bound FADH₂.
2. **Pass those electrons to Q.** Two electrons move through Complex II to Q, which also takes up two H⁺ from solution. Bound FAD is regenerated; QH₂ leaves toward the ETC. Detailed proton exchanges are omitted.

**Questions and answer key:**

1. What happens to the central carbon–carbon bond?
   - Options: It breaks into two molecules / It becomes a double bond / It gains phosphate
   - Correct: **It becomes a double bond**
   - Explanation: Removing hydrogen produces a C=C double bond in fumarate.
2. Does FADH₂ leave this enzyme as a free carrier?
   - Options: Yes, it travels like NADH / Yes, it becomes ATP / No, FAD stays enzyme-bound
   - Correct: **No, FAD stays enzyme-bound**
   - Explanation: FAD/FADH₂ stays in Complex II and transfers its electrons onward.
3. Which carrier leaves with those electrons?
   - Options: QH₂ / NADPH / CO₂
   - Correct: **QH₂**
   - Explanation: Q accepts the electrons and becomes QH₂, which carries them onward in the membrane.

### 7. Fumarase

**Net reaction:** Fumarate + H₂O → malate

Hydrate a carbon–carbon double bond. Water adds –OH to one carbon and H to the neighboring carbon. This does not split the molecule and does not require NAD⁺.

**Reaction parts:**

1. **Add water across the double bond.** The C=C becomes C–C; –OH appears on one carbon and H is added to its neighbor. Four carbons remain connected.

**Questions and answer key:**

1. What does fumarase add?
   - Options: Carbon dioxide / A phosphate group / Water
   - Correct: **Water**
   - Explanation: Water adds across the carbon–carbon double bond.
2. Does this reaction split the carbon skeleton?
   - Options: No, all four carbons remain connected / Yes, into two two-carbon molecules / Yes, one carbon leaves as CO₂
   - Correct: **No, all four carbons remain connected**
   - Explanation: Hydration changes the bond and functional groups, not the carbon count.
3. What happens to the C=C bond?
   - Options: It becomes a triple bond / It becomes a single bond / It disappears along with both carbons
   - Correct: **It becomes a single bond**
   - Explanation: The double bond becomes a single bond as H and –OH are added.

### 8. Malate Dehydrogenase

**Net reaction:** Malate + NAD⁺ → oxaloacetate + NADH + H⁺

Oxidize –OH to =O to regenerate the four-carbon acceptor. NADH can later donate electrons to the ETC. Most respiratory ATP is made later, not in this reaction.

**Reaction parts:**

1. **Oxidize malate and regenerate oxaloacetate.** –OH becomes =O. NAD⁺ becomes NADH; oxaloacetate can accept another acetyl group.

**Questions and answer key:**

1. Which molecule is regenerated to start another turn?
   - Options: Glucose / Oxaloacetate / Pyruvate
   - Correct: **Oxaloacetate**
   - Explanation: The four-carbon oxaloacetate acceptor is regenerated.
2. Which functional-group change is shown?
   - Options: –OH becomes =O / =O becomes –OH / A phosphate becomes CO₂
   - Correct: **–OH becomes =O**
   - Explanation: Malate’s alcohol is oxidized to a carbonyl.
3. What is the yield of one full turn per acetyl-CoA?
   - Options: Six NADH and no CO₂ / Only one ATP / Two CO₂, three NADH, one FADH₂-equivalent, and one ATP or GTP
   - Correct: **Two CO₂, three NADH, one FADH₂-equivalent, and one ATP or GTP**
   - Explanation: A turn yields two CO₂, three NADH, one electron pair captured through bound FAD, and one ATP or GTP. Oxaloacetate is regenerated.

## Verification

Node checks cover all eight reaction sessions, mandatory inputs, enzyme docking, two-part intermediate gates, collection gates, carbon conservation at every stage, quiz scores, perfect-P gates, save rollback/retry, replay preservation, zero benefit events, and one-/two-turn yields. Existing Calvin and metabolism tests also pass.

A real Chromium walkthrough completed every reaction, every quiz, and all eight green P markers. It ran a complete automatic turn and compared game state before/after. It also checked the actual Metabolism shell, navigation back to Calvin, early exit during animation, automatic Stop cleanup, and a 1024-pixel laptop layout without horizontal overflow. No page errors were observed.

## Commit after preview

```bash
git add src/app/KrebsActivitiesView.js src/app/KrebsPracticeModel.js \
  src/app/KrebsPracticeManager.js src/app/KrebsPracticeVisuals.js \
  src/app/MetabolismUI.js public/css/metabolism.css \
  tests/krebs-practice.test.mjs docs/Krebs-Practice-README.md
git commit -m "Add eight Krebs Cycle practices and mastered circular replay"
git push
```
