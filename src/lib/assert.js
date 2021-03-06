/* eslint-disable valid-jsdoc */

/**
 Throw an exception if `test` is not truthy.

 @method assert
 @for Orbit
 @param desc Description of the error thrown
 @param test Value that should be truthy for assertion to pass
 */
export function assert(desc, test) {
  if (!test) { throw new Error('Assertion failed: ' + desc); }
}
