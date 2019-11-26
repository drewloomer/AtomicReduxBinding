import {
  registerElement,
  updateElementState,
  registerListElementConfiguration,
  getElement,
  unregisterElement,
  getNestedListElementConfiguration,
  updateElementBindings,
  getListElementConfiguration
} from "../registries/element-registry";
import { bindSelectors, unbindSelectors } from "./selectors";
import { bindText } from "./text";
import { bindHtml } from "./html";
import { bindAttributes } from "./attributes";
import { bindClasses } from "./classes";
import { bindEvents, unbindEvents } from "./events";
import { applyBindings } from "./apply";
import { triggerLifecycleEvents } from "./lifecycle";
import { createValueFn, createMemoizedValueFn } from "./value-parsing";
import { bindData } from "./data";

/**
 * Find an element by ID
 */
export const findElement = (id, sourceNode = document) =>
  sourceNode.querySelector(`[data-tapas-id="${id}"]`);

/**
 * Find a parent element with a `data-tapas-id`
 */
export const findParentElement = el =>
  el.parentElement
    ? el.parentElement.hasAttribute("data-tapas-id")
      ? el.parentElement
      : findParentElement(el.parentElement)
    : null;

/**
 * Initializes an element in the DOM with data
 * Selectors are an array of strings that map to redux selectors and the name that data should be exposed as to bindings
 * Defaults to looking up an element in the `document`, but can be made to query
 * inside an arbitrary source node
 * ex.
 * ```js
 * initElement({
 *   id: '1234',
 *   selectors: [{
 *     selector: 'selectItemList',
 *     name: '$itemList',
 *     selectorArgs?: 'path.to.store.data' // When using the "custom" selector, use this to pass a path to data in the store
 *   }],
 *   text: [{
 *     value: '$itemList.length === 0 ? "Nothing" : "Something"',
 *     transform?: 'optionalTransformFunctionName',
 *     target?: '.optional-css-selector'
 *   }],
 *   html: [{
 *     value: '$itemList.length === 0 ? "Nothing" : "Something"',
 *     target?: '.optional-css-selector'
 *   }],
 *   attributes: [{
 *     name: "disabled",
 *     value: '$itemList.length === 0',
 *     transform?: 'optionalTransformFunctionName',
 *     target?: '.optional-css-selector'
 *   }],
 *   classes: [{
 *     name: "css-class-name",
 *     value: '$itemList.length === 0',
 *     target?: '.optional-css-selector'
 *   }],
 *   events: [{
 *     name: "click", // DOM event name
 *     value?: "$event.target.value", // value to pass to the action
 *     callback?: "setState({someKey: $event.target.value});", // arbitrary JS to run when the event fires; the return value will be passed to the action (if given)
 *     action?: "optionalReduxAction", // action to dispatch with the above value
 *     target?: ".optional-css-selector"
 *   }],
 *   list: {
 *     value: "$items",
 *     itemName?: "$item",
 *     itemKey?: "id",
 *     templateTarget?: '.optional-css-selector', // default: ':not(script)'
 *   },
 *   defaultState: {} // default values to populate into the $state available to each value and callback function
 * })
 * ```
 */
export const initElement = (
  {
    id,
    selectors,
    text,
    html,
    attributes,
    classes,
    events,
    list,
    defaultState = {}
  },
  sourceNode = document
) => {
  // Register the element by finding it in the DOM or as a child of the source node
  const { el } = registerElement(findElement(id, sourceNode));

  // Set the default state of the element
  updateElementState(el, defaultState);

  // Create all bindings
  bindSelectors({ el, selectors });
  bindText({ el, text });
  bindHtml({ el, html });
  bindAttributes({ el, attributes });
  bindClasses({ el, classes });
  bindEvents({ el, events });
  bindList({ el, list });

  // Apply all the bindings
  applyBindings(el);

  // Run the init hook on the next frame
  // @todo: this causes an infinite loop if done on the same frame; why?
  setTimeout(() => triggerLifecycleEvents({ el, name: "init" }), 0);
};

/**
 * Stores the configuration for an element for later retrieval
 * Finds a parent binding by walking up the DOM
 * IMPORTANT: parents must be defined before children for their
 * relationship to work
 */
export const bindElement = ({ id, ...rest }) => {
  const el = findElement(id);
  const parent = findParentElement(el);
  rest.parent = parent
    ? getListElementConfiguration(parent.getAttribute("data-tapas-id"))
    : null;
  registerListElementConfiguration({ id, config: rest });
};

/**
 * Stop listening for changes to the store for an element's selectors
 * Remove an element from the element registry
 * Remove an element from the DOM
 */
export const unbindElement = ({ el }) => {
  const { children } = getElement(el);
  if (children) children.forEach(c => unbindElement({ el: c }));
  unbindSelectors({ el });
  unbindEvents({ el });
  triggerLifecycleEvents({ el, name: "remove" });
  unregisterElement(el);
  el.parentNode.removeChild(el);
};

/**
 * Create a template element for a list item.
 */
export const createListItemTemplate = ({
  el,
  templateTarget = ":not(script)"
}) => {
  // Find the element to use as the template, defaulting to the first script tag
  const templateEl = el.querySelector(templateTarget);

  // Remove the element from its parent since it will be readded multiple times
  templateEl.parentNode.removeChild(templateEl);
  return;

  // Remove all scripts so they aren't re-inserted into the DOM
  templateEl
    .querySelectorAll("script")
    .forEach(s => s.parentNode.removeChild(s));

  // Unhide the template element
  // @todo: probably a better way to do this
  templateEl.style.display = "";

  // Get the ID of the original template
  // This value will be empty the first time around, so fall back to the current ID
  const templateElId =
    templateEl.getAttribute("data-tapas-template-id") ||
    templateEl.getAttribute("data-tapas-id");

  return {
    /**
     * Deep clone the template element
     */
    clone: () => templateEl.cloneNode(true),
    /**
     * Bind all the child elements
     */
    bindElements: (el, id, newId) => {
      // Get the configuration for this element and its direct children
      // This will be used for binding each new element to the configuration
      // of the original template
      const nestedConfigs = getNestedListElementConfiguration(templateElId);

      // Wrap the element in a container so it can itself
      // be included in the query to find an element that matches
      // the given ID
      const container = document.createElement("div");
      container.appendChild(el);

      // Bind each element, replacing the config ID with one
      // that corresponds to this instance of the child
      const idRegex = new RegExp(`^${id}`);
      Object.keys(nestedConfigs).forEach(k => {
        initElement(
          {
            id: k.replace(idRegex, newId),
            ...nestedConfigs[k]
          },
          container
        );
      });
    }
  };
};

/**
 * Update a child element with the appropriate attributes
 */
export const updateListChildAttributes = (child, index) => {
  // Get the current id and template id
  const childId = child.getAttribute("data-tapas-id");
  const childTemplateId = child.getAttribute("data-tapas-template-id");

  // Increment the last digit of the current ID
  const newChildId = getIncrementedId(childId, index);

  // Used for matching and replacing the original
  const idRegex = new RegExp(`(^${childId})`, "g");

  // Find all children that have an ID that starts with the child id and replace them
  // If there is no template ID set, store it for later use so we can marry
  // configuration in the element registry up to these child elements
  child.querySelectorAll(`[data-tapas-id^="${childId}"]`).forEach(c => {
    const id = c.getAttribute("data-tapas-id");
    const tid = c.getAttribute("data-tapas-template-id");
    c.setAttribute("data-tapas-template-id", tid || id);
    c.setAttribute("data-tapas-id", id.replace(idRegex, `${newChildId}`));
  });

  // If there is no template ID set, store it for later use so we can marry
  // configuration in the element registry up to this elements
  child.setAttribute("data-tapas-template-id", childTemplateId || childId);
  child.setAttribute("data-tapas-id", newChildId);

  return {
    childId: childTemplateId || childId,
    newChildId
  };
};

/**
 * Take a dot-delimited string and replace the last number with
 * the provided number
 */
export const getIncrementedId = (id, num) => {
  const pieces = id.split(".");
  pieces.splice(-1, 1, num);
  return pieces.join(".");
};

/**
 * Create a list binding
 */
export const bindList = ({ el, list }) => {
  if (!list) return;
  const template = createListItemTemplate({ el, ...list });
  const fn = createValueFn(list.value);
  const { itemName = "$item", itemKey } = list;
  let children = [];
  const listFn = createMemoizedValueFn(fn, value => {
    // Blow up if the data isn't an array
    if (!Array.isArray(value)) {
      throw new Error(`Only arrays are valid list values.`);
    }

    // Remove existing children when their key does not match the key at that index previously
    let hasUnboundElement = false;
    children.forEach((c, i) => {
      const { data } = getElement(c);
      if (
        !itemKey ||
        hasUnboundElement ||
        !value[i] ||
        data[itemName][itemKey] !== value[i][itemKey]
      ) {
        unbindElement({ el: c });
        hasUnboundElement = true;
      }
    });

    // Create new child nodes when their key does not match the key at that index previously
    // children = value.map((c, i) => {
    //   // Is there an existing child at this index?
    //   const existingChild = children[i] && getElement(children[i]);

    //   // Does the existing child at this index have a key and does it match the new data at this index?
    //   const shouldCreate =
    //     !itemKey ||
    //     !existingChild ||
    //     existingChild.data[itemName][itemKey] !== c[itemKey];

    //   // Create or reuse a node
    //   const child = shouldCreate ? template.clone() : children[i];

    //   if (shouldCreate) {
    //     const { childId, newChildId } = updateListChildAttributes(child, i + 1);

    //     // Add the element to the registry
    //     registerElement(child, getElement(el).el);

    //     // Store data from the parent on the child in the registry since
    //     // it will not be getting its data via a selector
    //     bindData({
    //       el: child,
    //       data: {
    //         [itemName]: c
    //       }
    //     });

    //     // Create data bindings for each child
    //     template.bindElements(child, childId, newChildId);

    //     // Add the child to the DOM
    //     el.appendChild(child);
    //   } else {
    //     // Update the data stored on the child because it does not get
    //     // its data via a selector
    //     bindData({
    //       el: child,
    //       data: {
    //         [itemName]: c
    //       }
    //     });
    //     // Rerun the bindings for this child and its descendents
    //     applyBindings(child, true);
    //   }

    //   return child;
    // });
  });
  const { bindings } = getElement(el);
  updateElementBindings(el, { ...bindings, list: listFn });
};
