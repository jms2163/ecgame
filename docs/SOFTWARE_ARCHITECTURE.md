ECGame – Software Architecture

Document Version: 1.0.0  
Status: Draft  
Last Updated: August 7, 2026

---

Purpose

The software architecture of ECGame is designed to mirror the educational architecture of the game.

The organization of the source code should reflect the organization of biological knowledge.

This is an intentional design decision.

Rather than organizing the project primarily around technical concepts such as "managers," "systems," or "utilities," ECGame is organized around the scientific experience presented to the player.

The architecture exists to support learning.

---

Architectural Philosophy

The player experiences ECGame as one unified scientific laboratory.

The software should reflect that experience.

Every architectural component should answer one question:

What scientific responsibility does this component represent?

If a component cannot be explained in terms of the player's scientific experience, it probably belongs inside another component rather than becoming its own system.

Educational concepts determine module boundaries.

Implementation details remain secondary.

---

Core Architectural Principles

The following principles guide all future development.

1. Educational Concepts Drive Architecture

The project is organized around biology and chemistry rather than implementation techniques.

Folders should represent stable scientific concepts rather than temporary technical solutions.

---

2. One Scientific Responsibility Per Module

Each module should have one clearly defined responsibility.

Examples include:

- Environmental Model
- Resource Model
- Cell Metrics Model
- Atom Construction
- Molecular Assembly

Modules should not simultaneously simulate science, render graphics, and update user interface elements.

---

3. Progressive Expansion

The architecture should grow naturally.

New laboratories should extend the existing system without requiring previous laboratories to be rewritten.

Adding content should be additive rather than disruptive.

---

4. Consistency Over Novelty

Although every laboratory introduces different gameplay mechanics, the player should always recognize familiar scientific equipment.

Every workstation should maintain a common visual language.

---

5. Modularity

Each laboratory should remain as independent as practical.

A new laboratory should require minimal changes to existing laboratories.

Shared functionality should exist only when multiple laboratories genuinely require it.

Premature abstraction should be avoided.

---

The Laboratory Model

The player experiences one scientific facility.

ECGame → Scientific Facility → Laboratory Zone → Workstation → Workspace → Analysis Console → Scientific Models

Each layer has a distinct responsibility.

---

Laboratory Zones

Laboratory Zones represent the major scales of biological organization.

Each zone introduces one primary scientific concept while reinforcing previous knowledge.

Current zones include:

- Pond
- Quantum
- Atom Laboratory
- Atomizer
- Molecularizer
- Macromolecular Laboratory
- Polymerizer

Future laboratories should follow the same architectural model.

Zones should communicate through shared game state rather than direct dependencies.

---

Workstations

Each laboratory contains one or more workstations.

A workstation is the player's immediate scientific environment.

Examples include:

- Ecosystem Grid
- Particle Collector
- Atom Builder
- Molecular Assembly Table
- Polymer Construction Puzzle

Every workstation contains:

- Primary Workspace
- Analysis Console
- Laboratory Status
- Scientific Instruments

The interaction mechanics may differ.

The overall layout should remain familiar.

---

Scientific Models

Scientific Models describe the rules governing the simulated world.

Models should contain scientific knowledge rather than user interface logic.

Examples include:

- Environmental Model
- Resource Model
- Cell Metrics Model
- Chemical Species
- Biome Definitions

Models should be reusable by multiple laboratories whenever appropriate.

---

User Interface

The interface exists to communicate scientific understanding.

It should never become the primary source of scientific logic.

Reusable interface components include:

- Analysis Consoles
- Player Profile
- Status Cards
- Scientific Indicators
- Dialogs
- Buttons
- Progress Displays

Visual consistency reduces cognitive load and allows students to focus on learning.

---

Shared Systems

Some systems naturally span every laboratory.

Examples include:

- Save and Load
- Player Progress
- Inventory
- Scientific Discoveries
- Quests
- Achievements
- Settings

These systems provide continuity across the entire scientific facility.

They should remain independent of any individual laboratory.

---

Game State

The Game State represents the complete scientific career of the player.

It should be treated as a long-lived data model.

Every laboratory contributes to the Game State.

No laboratory owns it.

New features should extend the Game State without breaking existing save files.

Save compatibility is a permanent architectural requirement.

Versioned save migrations should be used whenever the Game State evolves.

---

Folder Organization

The folder structure should remain intentionally simple.

The recommended high-level organization is:

src/

    app/

    models/

    shared/

    ui/

    zones/

        pond/

        quantum/

        atomlab/

        atomizer/

        molecularizer/

        macromolecularizer/

        polymerizer/


New folders should only be introduced when multiple related files naturally justify them.

Folders should never be created in anticipation of future code.

---

Refactoring Guidelines

Refactoring should improve clarity without changing gameplay.

Before introducing a new module, ask:

- Does this represent a distinct scientific responsibility?
- Will this module likely remain stable over time?
- Does this reduce coupling?
- Does this improve readability?
- Would another developer intuitively know where this belongs?

If the answer is "no," the new module should probably not exist.

---

Architectural Growth

ECGame is expected to grow over multiple semesters.

Growth should occur through expansion rather than replacement.

New laboratories should integrate with:

- existing save files
- player discoveries
- educational progression
- laboratory certifications
- scientific registry

Older content should remain fully functional.

Students should never lose progress because the laboratory expanded.

---

Architectural Success

The architecture is successful when:

- students experience one unified scientific laboratory;
- new laboratories can be added without rewriting existing ones;
- save files remain compatible across versions;
- modules remain understandable and maintainable;
- educational concepts determine software organization; and
- developers can quickly identify where new features belong.

Ultimately, the architecture exists to support one goal:

Helping students understand that increasingly complex biological systems emerge from simpler physical, chemical, and informational principles.

Every architectural decision should reinforce that objective.
