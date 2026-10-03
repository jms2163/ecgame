ECGame Atom Lab Harmonium and completion update
Source: jms2163/ecgame main at 9e417600653f6578a0505fcc3c10d59e3d31ac9f

From your existing ecgame directory in the VS Code terminal:
  unzip -o "$HOME/Downloads/ECGame-AtomLab-Harmonium-v2.zip" -d "$HOME/Downloads/ECGame-AtomLab-Harmonium-v2"
  cp -R "$HOME/Downloads/ECGame-AtomLab-Harmonium/ecgame/." .
  node --test tests/atom-lab-completion.test.mjs tests/periodic-group-quests.test.mjs tests/atomizer-hydrogen.test.mjs

This patch retains existing saves. The Atom Lab counter still uses /118 as requested; a full 120-element collection displays 120/118. Element 119 is Harmonium (Hr). Legacy Uue discoveries transfer to Hr. A recorded isotope can restore a missing atom discovery. A 120-element save marks Atom Lab Completed. If a save still displays 119/118, inspect its missing element; no unrecorded synthesis is inferred.

Revision 2: Consolidates duplicate legacy 119/120 isotope IDs into E119/E120 and records those stable IDs for future syntheses. A profile with 53 distinct elements and two old spellings of 119 changes from 54 to 53 isotopes.
