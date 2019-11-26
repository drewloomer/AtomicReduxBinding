import "./styles.css";
import { initTopLevelBindings } from "./bindings";
import { bindElement } from "./bindings/element";

// Save the stored calls to run below
const runAll = window.Tapas.runAll;

// Reset global methods with new names
window.Tapas = {
  bindElement
};

// Run the stored calls
runAll();

// Initialize bindings for all of the top-level elements
initTopLevelBindings();
