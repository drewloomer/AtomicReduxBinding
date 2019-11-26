import { merge } from "lodash";

/**
 * A registry of all elements indexed by the elements themselves.
 */
const registry = new WeakMap();

// Walk up the tree to find a parent element
export const findRegisteredParent = el => {
  return (
    el &&
    (getElement(el.parentElement) || findRegisteredParent(el.parentElement))
  );
};

/**
 * Register an element by finding it in the DOM
 */
export const registerElement = (el, parent = null) => {
  const existingConfig = registry.get(el) || {};
  console.log(existingConfig, el);
  parent =
    parent || existingConfig.parent || (findRegisteredParent(el) || {}).el;
  registry.set(
    el,
    merge(existingConfig, {
      el,
      parent,
      children: [],
      bindings: {},
      events: [],
      selectors: [],
      data: {},
      state: {}
    })
  );
  if (parent) {
    addElementChild(parent, el);
  }
  return registry.get(el);
};

/**
 * Remove an element from the registry
 * Also remove any reference to it from its parent
 */
export const unregisterElement = el => {
  const { parent } = getElement(el);
  if (parent) {
    removeElementChild(parent, el);
  }
  registry.delete(el);
};

export const addElementChild = (el, child) => {
  const { children } = registry.get(el);
  return updateElement(el, {
    children: [...children, child]
  });
};

export const removeElementChild = (el, child) => {
  const { children } = registry.get(el);
  return updateElement(el, {
    children: children.filter(c => c !== child)
  });
};

/**
 * Get an element entry from the registry
 */
export const getElement = el => {
  return registry.get(el);
};

/**
 * Update an element in the registry
 */
export const updateElement = (el, props) => {
  registry.set(el, { ...registry.get(el), ...props });
  return registry.get(el);
};

/**
 * Update just the selectors of an element in the registry
 */
export const updateElementSelectors = (el, selectors) => {
  updateElement(el, {
    selectors
  });
};

/**
 * Update just the data of an element in the registry
 */
export const updateElementData = (el, data) => {
  updateElement(el, {
    data
  });
};

/**
 * Update just the state of an element in the registry
 */
export const updateElementState = (el, state) => {
  updateElement(el, {
    state
  });
};

/**
 * Update just the bindings of an element in the registry
 */
export const updateElementBindings = (el, bindings) => {
  updateElement(el, {
    bindings
  });
};

/**
 * Update just the events of an element in the registry
 */
export const updateElementEvents = (el, events) => {
  updateElement(el, {
    events
  });
};

/**
 * Register a list element configuration to retrieve later
 */
let listElementConfigurationRegistry = {};
export const registerListElementConfiguration = ({ id, config }) => {
  listElementConfigurationRegistry = {
    ...listElementConfigurationRegistry,
    [id]: config
  };
};

/**
 * Get the configuration for a list element by ID
 */
export const getListElementConfiguration = id => {
  return listElementConfigurationRegistry[id];
};

/**
 * Get all top-level confirugrations
 */
export const getTopLevelListElementConfigurations = () => {
  return Object.keys(listElementConfigurationRegistry).reduce((acc, k) => {
    const conf = listElementConfigurationRegistry[k];
    if (!conf.parent) acc[k] = conf;
    return acc;
  }, {});
};

/**
 * Get the configuration for a list element and its children
 * Stops when it hits a nested list
 */
export const getNestedListElementConfiguration = id => {
  const skipped = [];
  const config = getListElementConfiguration(id);
  return Object.keys(listElementConfigurationRegistry).reduce(
    (acc, k) => {
      // Passed ID is not a match or an ancestor, skip it.
      if (k.indexOf(id) !== 0) return acc;

      // Get the config for this key
      const conf = getListElementConfiguration(k);

      // Consider the parent to be the passed ID with it's last dot an number removed
      const parentKey = k
        .split(".")
        .slice(0, -1)
        .join(".");
      const parent = parentKey && getListElementConfiguration(parentKey);

      // If a parent of this was skipped, don't bother
      // Only add if there is either no parent or the parent doesn't have a list
      if (
        !skipped.find(s => parentKey.indexOf(s) === 0) &&
        (!parent || !parent.list)
      ) {
        acc[k] = conf;
      }

      // If this has a list, skip its children
      if (conf.list) {
        skipped.push(k);
      }

      return acc;
    },
    config ? { [id]: config } : {}
  );
};
