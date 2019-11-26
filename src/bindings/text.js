import {
  getElement,
  updateElementBindings
} from "../registries/element-registry";
import { getTransform } from "../registries/transform-registry";
import { createValueFn, createMemoizedValueFn } from "./value-parsing";

/**
 * Create a text binding
 * Interprets the value string and creates a memoized function to return
 * a value when the selectors on this element change
 */
export const bindText = ({ el, text }) => {
  if (!text) return;

  // Text can be passed as a single item or an array
  text = Array.isArray(text) ? text : [text];

  const { bindings } = getElement(el);

  // Replace existing text bindings
  updateElementBindings(el, {
    ...bindings,
    text: text.map(({ value, target, transform }) => {
      // Allow for a text transformation to be applied; fall back to a pass-through
      const transformFn = transform ? getTransform(transform) : v => v;

      // Allow for a sub-element to be the target of the binding
      const targetEl = target ? el.querySelector(target) : el;

      // Create memoized funtion that accepts the current value and applies it to the element
      const fn = createValueFn(value);
      const updateFn = createMemoizedValueFn(
        fn,
        value => (targetEl.innerText = transformFn(value))
      );

      return updateFn;
    })
  });
};
