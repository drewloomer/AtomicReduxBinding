import { getElement } from "../registries/element-registry";

/**
 * Run all bindings, accounting for arrays of bindings
 * If deep is `true`, apply bindings for children as well
 */
export const applyBindings = (el, deep = false) => {
  el = getElement(el);
  if (!el) return;
  const { selectors, data, state, parent, bindings, children } = el;
  Object.values(bindings).forEach(binding =>
    applyBinding({ binding, selectors, data, state, parent })
  );
  if (deep) {
    children.forEach(c => applyBindings(c, deep));
  }
  // @todo: this doesn't actually mean the node changed
  // need to determine when the applied bindings are different somehow?
  // triggerLifecycleEvents({ el: el.el, name: "update" });
};

/**
 * Run a binding
 */
export const applyBinding = ({ binding, selectors, data, state, parent }) => {
  const args = {
    selectors,
    data,
    state,
    parent: getElement(parent)
  };
  if (typeof binding === "function") binding(args);
  else if (Array.isArray(binding)) binding.forEach(b => b(args));
};
