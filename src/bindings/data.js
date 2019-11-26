import { getElement, updateElementData } from "../registries/element-registry";

/**
 * Bind data to an element
 * This is used to bind data from a parent to a list child
 */
export const bindData = ({ el, data }) => {
  const { data: currentData } = getElement(el);
  updateElementData(el, { ...currentData, ...data });
};
