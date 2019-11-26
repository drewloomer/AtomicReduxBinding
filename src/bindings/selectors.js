import {
  updateElement,
  getElement,
  updateElementSelectors
} from "../registries/element-registry";
import { createValueFn } from "./value-parsing";
import { getSelector } from "../registries/selector-registry";
import { store } from "../store";
import { applyBindings } from "./apply";

/**
 * Bind a list of selectors to an element
 */
export const bindSelectors = ({ el, selectors }) => {
  if (!selectors) return;
  updateElement(el, {
    selectors: selectors.map(s => bindSelector({ el, ...s }))
  });
};

/**
 * Bind a selector to an element
 * Sets the value now and subscribes to changes in the store
 */
export const bindSelector = ({ el, selector, selectorArgs, name }) => {
  // If there are arguments, create functions from them to make sure they can contain dynamic values
  selectorArgs = selectorArgs && selectorArgs.map(createValueFn);

  // Get the selector from the registry
  const sel = getSelector(selector);

  const fn = () => {
    const state = store.getState();
    if (!selectorArgs) return sel(state);
    const { ...args } = getElement(el);
    args.parent = getElement(args.parent);
    return sel(state)(...selectorArgs.map(a => a(args)));
  };

  // Listen for changes to the store and reapply bindings for an element
  // Keep a reference to the subscription to use when cleaning up
  const unsubscribe = store.subscribe(() => {
    const { selectors } = getElement(el);
    updateElementSelectors(
      el,
      selectors.map(s => {
        if (s.name !== name) return s;
        return {
          ...s,
          value: fn()
        };
      })
    );
    applyBindings(el);
  });

  return {
    selector,
    name,
    unsubscribe,
    value: fn()
  };
};

/**
 * Unbind a list of selectors from a given element by unsubscribing to store changes
 */
export const unbindSelectors = ({ el }) => {
  const { selectors } = getElement(el);
  selectors.forEach(({ unsubscribe }) => unsubscribe());
};
