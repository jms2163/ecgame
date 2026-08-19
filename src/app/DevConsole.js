// --------------------------------------------------
// DevConsole.js
// Development-only console access to game systems
// --------------------------------------------------

import GameStateManager
    from "./GameStateManager.js";
import ZoneManager from "./ZoneManager.js";
import NavigationUI from "./NavigationUI.js";
import ZoneCatalog from "./ZoneCatalog.js";
import ZoneStatusResolver
    from "./ZoneStatusResolver.js";
import SaveManager from "./SaveManager.js";
import VersionManager
    from "./VersionManager.js";
import PondWorld from "./PondWorld.js";
import PondController from "./PondController.js";
import PondPerception from "./PondPerception.js";
import PondWorldGenerator
    from "./PondWorldGenerator.js";
import SeededRandom from "./SeededRandom.js";
import PondWorldConfig
    from "./PondWorldConfig.js";
import ResourceManager
    from "./ResourceManager.js";
import XPManager from "./XPManager.js";
import ParticleInventoryManager
    from "./ParticleInventoryManager.js";
import GameStars from "./GameStars.js";
import SubatomicAssemblyManager
    from "./SubatomicAssemblyManager.js";
import SubatomicAssemblyUI
    from "./SubatomicAssemblyUI.js";
import QuantumZone from "./QuantumZone.js";
import QuantumField from "./QuantumField.js";
import QuantumAudioManager
    from "./QuantumAudioManager.js";
import QuantumSpawnTimingManager
    from "./QuantumSpawnTimingManager.js";
import QuantumAutoCollectorManager
    from "./QuantumAutoCollectorManager.js";
import QuestCatalog from "./QuestCatalog.js";
import QuestManager from "./QuestManager.js";
import ObjectiveRegistry
    from "./ObjectiveRegistry.js";
import RewardRegistry
    from "./RewardRegistry.js";
import QuestDrawerUI
    from "./QuestDrawerUI.js";
import QuestStatusResolver
    from "./QuestStatusResolver.js";
import ResearchManager
    from "./ResearchManager.js";
import CellSystemManager
    from "./CellSystemManager.js";
import OrganelleView
    from "./OrganelleView.js";
import OrganelleExperimentStage
    from "./OrganelleExperimentStage.js";
import OrganelleExperimentSubmissionManager
    from "./OrganelleExperimentSubmissionManager.js";
import ExperimentPlacementEvaluator
    from "./ExperimentPlacementEvaluator.js";
import OrganelleExperimentLibrary
    from "./OrganelleExperimentLibrary.js";
import AtomLabUI
    from "./AtomLabUI.js";
import AtomLabManager
    from "./AtomLabManager.js";
import DiscoveryManager
    from "./DiscoveryManager.js";
import AtomCraftUI
    from "./AtomCraftUI.js";
import TimeManager from "./TimeManager.js";
import AtomizerManager from "./AtomizerManager.js";
import GameStateObserver from "./GameStateObserver.js";
import AtomizerUI from "./AtomizerUI.js";
import SPManager from "./SPManager.js";
import MolecularLabManager from "./MolecularLabManager.js";
import MolecularLab from "./MolecularLab.js";
import MolecularLabUI from "./MolecularLabUI.js";

const DevConsole = {

    initialize() {

        window.ECGame = {
            GameStateManager,
            ZoneManager,
            NavigationUI,
            ZoneCatalog,
            ZoneStatusResolver,
            SaveManager,
            VersionManager,
            PondWorld,
            PondController,
            PondPerception,
            PondWorldGenerator,
            SeededRandom,
            PondWorldConfig,
            ResourceManager,
            XPManager,
            ParticleInventoryManager,
            GameStars,
            SubatomicAssemblyManager,
            SubatomicAssemblyUI,
            QuantumZone,
            QuantumField,
            QuantumAudioManager,
            QuantumSpawnTimingManager,
            QuantumAutoCollectorManager,
            QuestCatalog,
            QuestManager,
            ObjectiveRegistry,
            RewardRegistry,
            QuestDrawerUI,
            QuestStatusResolver,
            ResearchManager,
            CellSystemManager,
            OrganelleView,
            OrganelleExperimentStage,
            OrganelleExperimentSubmissionManager,
            ExperimentPlacementEvaluator,
            OrganelleExperimentLibrary,
            AtomLabUI,
            AtomLabManager,
            DiscoveryManager,
            AtomCraftUI,
            AtomizerManager,
            TimeManager,
            GameStateObserver,
            AtomizerUI,
            SPManager,
            MolecularLabManager,
            MolecularLab,
            MolecularLabUI,
            
        };

        console.log(
            "DevConsole initialized. Use window.ECGame to access development tools."
        );

    }

};

export default DevConsole;
