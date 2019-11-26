import {
  getElement,
  updateElementBindings
} from "../registries/element-registry";
import { getTransform } from "../registries/transform-registry";
import { createValueFn, createMemoizedValueFn } from "./value-parsing";

/**
 * Create an attribute binding
 * Interprets the value string and creates a memoized function to return
 * a value when the selectors on this element change
 */
export const bindAttributes = ({ el, attributes }) => {
  if (!attributes) return;
  const { bindings } = getElement(el);

  // Replace existing attribute bindings
  updateElementBindings(el, {
    ...bindings,
    attributes: attributes.map(({ name, value, target, transform }) => {
      // Allow for a text transformation to be applied; fall back to a pass-through
      const transformFn = transform ? getTransform(transform) : v => v;

      // Allow for a sub-element to be the target of the binding
      const targetEl = target ? el.querySelector(target) : el;

      // Create memoized funtion that accepts the current value and applies it to the element
      const fn = createValueFn(value);
      const updateFn = createMemoizedValueFn(fn, value => {
        // Update the element directly or the HTML attribute representation
        // @todo: is this the best way to do this? Should we just set both?
        if (targetEl.hasAttribute(name)) targetEl[name] = transformFn(value);
        else targetEl.setAttribute(name, transformFn(value));
      });

      return updateFn;
    })
  });
};
