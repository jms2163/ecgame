// --------------------------------------------------
// Bootstrap.js
// Initializes ECGame in dependency order
// --------------------------------------------------

import TimeManager from "./TimeManager.js";
import GameStateManager from "./GameStateManager.js";
import DataLoader from "./DataLoader.js";
import SaveManager from "./SaveManager.js";
import ZoneManager from "./ZoneManager.js";
import NavigationUI from "./NavigationUI.js";
import ZoneCatalog from "./ZoneCatalog.js";
import DevConsole from "./DevConsole.js";
import ResourceManager from "./ResourceManager.js";
import SynthesisPointManager
    from "./SynthesisPointManager.js";
import ATPManager from "./ATPManager.js";
import QuestManager from "./QuestManager.js";
import QuestDrawerUI from "./QuestDrawerUI.js";
import QuantumAutoCollectorManager from "./QuantumAutoCollectorManager.js";
import AtomizerManager from "./AtomizerManager.js";
import AtomizerUI from "./AtomizerUI.js";
import MoleculeLabManager from "./MoleculeLabManager.js";
import MacromolecularizerManager
    from "./MacromolecularizerManager.js";
import PolymerizerManager
    from "./PolymerizerManager.js";
import SignalingManager
    from "./SignalingManager.js";
import PlayerProfileManager from "./PlayerProfileManager.js";
import PlayerBadgeDrawer from "./PlayerBadgeDrawer.js";
import PondDiscoveryManager
    from "./PondDiscoveryManager.js";
import PondCurrentManager
    from "./PondCurrentManager.js";
import PondAnchoringManager
    from "./PondAnchoringManager.js";


const Bootstrap = {

    async initialize() {

        DevConsole.initialize();

        await DataLoader.loadAll();

        GameStateManager.initialize();

        SaveManager.initialize();
        SaveManager.load();
        PlayerProfileManager.initialize();
        // Legacy saves may predate Pond exploration records.
        // Normalize them before quests evaluate saved discoveries.
        PondDiscoveryManager.initialize();
        // Timed Pond drift reconciles a loaded, unanchored field
        // once, then begins a fresh online timer session.
        PondCurrentManager.initialize();

        ResourceManager.initialize();
        SynthesisPointManager.initialize();
        // ATP production subscribes before the central
        // game loop begins emitting game-tick events.
        ATPManager.initialize();
        // Anchoring subscribes after ATP production so each tick applies
        // earned ATP before charging the continuous attachment demand.
        PondAnchoringManager.initialize();
        // Global initialization keeps enabled Quantum
        // autocollectors running in every zone while the
        // game is open.
        QuantumAutoCollectorManager.initialize();
        TimeManager.start();
        QuestManager.initialize();

        ZoneManager.initialize();
        NavigationUI.initialize();
        QuestDrawerUI.initialize();
        PlayerBadgeDrawer.initialize();
        AtomizerManager.initialize();
        AtomizerUI.initialize();
        // Domain initialization is global so timestamp-based
        // synthesis can reconcile even before the zone is opened.
        MoleculeLabManager.initialize();
        // Normalize the future Macromolecularizer state
        // after the local save has been loaded.
        MacromolecularizerManager.initialize();
        // Reconcile persisted Polymerizer jobs globally so a completed
        // A motif-scaled assembly finalizes even when another zone is open.
        PolymerizerManager.initialize();
        // Legacy saves predate the Signaling zone. Create only its generic
        // empty envelope after loading so console authorization and future
        // encounter unlocks can address the zone safely.
        SignalingManager.initialize();

        const requestedZoneId =
            GameStateManager.getCurrentZoneId();

        const initialResult =
            ZoneManager.enterZone(
                requestedZoneId
            );

        if (!initialResult.entered) {
            const fallbackZoneId =
                ZoneCatalog.getDefaultZoneId();

            const fallbackResult =
                ZoneManager.enterZone(
                    fallbackZoneId
                );

            if (!fallbackResult.entered) {
                throw new Error(
                    "ECGame could not activate its default zone"
                );
            }
        }

        NavigationUI.refresh();

        console.log(
            "ECGame bootstrap complete."
        );

        return true;

    }

};

export default Bootstrap;
