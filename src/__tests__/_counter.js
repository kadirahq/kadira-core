import Promise from 'bluebird';
import {ERR_ENDRETRY} from '../retry.js';

export default class {
  constructor(n) {
    this.count = n;
  }

  decrease() {
    return new Promise((resolve, reject) => {
      if (--this.count === 0) {
        resolve('result');
      } else if (this.count % 10 === 0) {
        reject(ERR_ENDRETRY);
      } else {
        reject();
      }
    });
  }
}
