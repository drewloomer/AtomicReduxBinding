import { getTopLevelListElementConfigurations } from "../registries/element-registry";
import { initElement } from "./element";

/**
 * Initialize all top-level bindings
 * Ignore the nested bindings because the top-level bindings will
 * take care of initializng their children
 */
export const initTopLevelBindings = () => {
  const confs = getTopLevelListElementConfigurations();
  Object.keys(confs).forEach(id => {
    initElement({
      id,
      ...confs[id]
    });
  });
};
