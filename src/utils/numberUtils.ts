/**
 * Number utility functions for handling number operations
 */
export class NumberManager {
  /**
   * Round a number to a specified number of decimal places
   */
  static roundout(num: number, places: number = 2): number {
    const x = Math.pow(10, places);
    const formul = (num * x).toFixed(10);
    return (num >= 0 ? Math.ceil(parseFloat(formul)) : Math.floor(parseFloat(formul))) / x;
  }
}
