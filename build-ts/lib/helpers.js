/**
 * Returns string representation of type of passed object
 * @param {any} object - object to get type
 * @returns {string}
 */
export function getType(object) {
    return object === null ? "null" : typeof (object);
}
