ECGame – Design Rules
Document Version: 1.0.0 Status: Draft Last Updated: August 7, 2026

Purpose
This document defines the design principles that govern every future change to ECGame.
It is intended for both human developers and AI assistants.
Whenever multiple design choices are possible, these rules establish the order in which decisions should be made.
The purpose of these rules is to preserve the educational integrity of the project as it grows.

The Decision Hierarchy
When two design goals conflict, resolve them in the following order.
1. Educational Value
Education always comes first.
A feature exists only if it improves learning.
Gameplay should reinforce scientific understanding rather than distract from it.
If a technically elegant solution weakens the educational experience, the educational solution should be chosen.

2. Student Experience
Students should always understand:
what they are doing,
why they are doing it,
how it connects to previous knowledge, and
how it prepares them for future laboratories.
The interface should reduce cognitive load rather than increase it.
Consistency is preferred over novelty.

3. Scientific Accuracy
Scientific models should remain faithful to accepted biological and chemical principles whenever practical.
Educational simplifications are acceptable when they improve learning, but scientific misconceptions should never be intentionally introduced.
When realism and gameplay conflict, choose the simplest scientifically defensible model.

4. Software Architecture
Architecture exists to support education.
It is not an end in itself.
Modules should remain cohesive, understandable, and expandable.
Folder organization should reflect stable scientific concepts rather than temporary implementation details.

5. Code Quality
Readable code is preferred over clever code.
Maintainability is preferred over optimization.
Optimization should occur only when a measurable performance problem exists.

Educational Design Rules
Every laboratory should answer four questions for the student:
What am I observing?
What scientific principle explains it?
How does it connect to previous laboratories?
Why does it matter biologically?
If a mechanic cannot answer these questions, it should be reconsidered.

Biological Organization
The game is organized according to biological scale.
Every new laboratory should reinforce the hierarchy:
Particles → Atoms → Molecules → Macromolecules → Organelles → Cells → Ecosystems
New content should always reference earlier levels of organization.
Students should continually recognize that larger systems emerge from smaller ones.

Learning Through Discovery
Students should discover scientific ideas whenever possible.
Avoid presenting information before students have an opportunity to investigate it.
Observation should precede explanation.
Construction should precede memorization.
Experimentation should precede assessment.

Progressive Complexity
Complexity should increase gradually.
Every laboratory should introduce only a small number of new ideas.
Existing concepts should be reused repeatedly in increasingly sophisticated contexts.
Learning should accumulate rather than restart.

Consistent Laboratory Experience
Every workstation should feel like part of the same scientific facility.
Regardless of the laboratory, students should recognize familiar elements such as:
Primary Workspace
Analysis Console
Scientific Indicators
Player Profile
Research Progress
Interaction mechanics may differ, but the overall structure should remain consistent.

User Interface Rules
Visual design should communicate scientific purpose.
Avoid decorative elements that do not support learning.
Every interface element should answer one of three questions:
What can I do?
What is happening?
Why is it happening?
If an element answers none of these questions, it should be removed or redesigned.

Simulation Rules
Scientific simulations should remain deterministic whenever practical.
Students should be able to identify cause-and-effect relationships.
Randomness should introduce variety rather than confusion.
Every simulation should provide observable feedback explaining the consequences of the player’s actions.

Software Design Rules
Each module should have one primary responsibility.
Examples include:
Environmental Model
Resource Model
Cell Metrics Model
Inventory
Save System
Quest System
Modules should not simultaneously:
perform simulation,
update user interfaces,
manipulate the DOM, and
manage persistence.
Separate responsibilities improve clarity and testing.

Refactoring Rules
Refactoring should improve organization without changing gameplay.
Before creating a new module, ask:
Does this represent a stable scientific concept?
Does it reduce coupling?
Will multiple systems benefit from it?
Will another developer immediately understand its purpose?
Avoid abstraction for its own sake.

Folder Organization
Folders should remain intentionally simple.
Do not create folders for anticipated future needs.
New folders should appear only when multiple related files naturally justify their existence.
A small, understandable project is preferable to a perfectly categorized project.

Save Compatibility
Student progress is permanent.
New laboratories should never invalidate previous work.
Save files must remain compatible across versions through migration.
Game updates should expand the student’s scientific career rather than replace it.

Artificial Intelligence Guidelines
AI assistants should treat these Design Rules as higher priority than implementation preferences.
AI-generated code should:
preserve educational intent,
maintain scientific consistency,
minimize unnecessary architectural changes,
avoid speculative abstractions,
produce modular and readable code,
preserve backward compatibility, and
explain the reasoning behind significant refactoring decisions.
AI should optimize for long-term maintainability rather than short-term convenience.

Classroom Considerations
ECGame is designed for introductory college biology students, including dual-enrollment high school learners.
Mechanics should remain approachable while encouraging scientific reasoning.
The goal is not to make biology easier.
The goal is to make biology more intuitive through interaction.
Every activity should encourage curiosity rather than passive completion.

Long-Term Philosophy
ECGame is not simply educational software.
It is a scientific learning environment.
Students should leave the course with more than factual knowledge.
They should develop a mental model of biology as an interconnected system governed by recurring principles of organization, information, energy, interaction, and adaptation.
Every feature, every laboratory, every simulation, and every line of code should contribute toward that educational objective.
Whenever uncertainty arises, ask one question:
“Will this change help students understand biology more deeply?”
If the answer is yes, it is probably the right direction.
If the answer is no, reconsider the design.
