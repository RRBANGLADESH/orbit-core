/* eslint-disable valid-jsdoc */

/**
 Wraps a function that expects parameters with another that can accept the parameters as an array

 @method spread
 @for Orbit
 @param {Object} func
 @returns {function}
 */
export function spread(func) {
  return function(args) {
    func.apply(null, args);
  };
}
