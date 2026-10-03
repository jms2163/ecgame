Tungsten Atom Lab patch based on GitHub main 8dd1d59.

Fixes representative view: W uses W184 (74p,110n,74e) when no isotope is saved. If W180 was genuinely synthesized, viewing uses its saved isotope (74p,106n,74e). Viewing synchronizes the active isotope. A stale previous-element isotope cannot be used to validate or label W synthesis.

Retroactive: a saved W isotope or a legacy W discovery restores a missing discoveries.atoms.W entry on Atom Lab initialization. A selected W target or workspace alone does not prove synthesis. No save version change.

Tests: node --test tests/atom-lab-*.test.mjs tests/periodic-group-quests.test.mjs tests/atomizer-hydrogen.test.mjs
