import {
  getElement,
  updateElementBindings
} from "../registries/element-registry";
import { createValueFn, createMemoizedValueFn } from "./value-parsing";

/**
 * Create a classname binding
 * Interprets the value string and creates a memoized function to return
 * a value when the selectors on this element change
 */
export const bindClasses = ({ el, classes }) => {
  if (!classes) return;
  const { bindings } = getElement(el);

  // Replace existing attribute bindings
  updateElementBindings(el, {
    ...bindings,
    classes: classes.map(({ name, value, target }) => {
      // Allow for a sub-element to be the target of the binding
      const targetEl = target ? el.querySelector(target) : el;

      // Create memoized funtion that accepts the current value and applies it to the element
      const fn = createValueFn(value);
      const updateFn = createMemoizedValueFn(fn, value => {
        targetEl.classList.toggle(name, !!value);
      });

      return updateFn;
    })
  });
};
