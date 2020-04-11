import { Injectable } from '@angular/core';
import { Domino } from '../model/domino';

@Injectable({
  providedIn: 'root'
})
export class DominoSetService {

  constructor() { }

  generateSet(maxDouble: number): Set<Domino> {
    let set = new Set<Domino>();
    for (let indexA = 0; indexA <= maxDouble; indexA++) {
      for (let indexB = indexA; indexB <= maxDouble; indexB++) {
        set.add(new Domino(indexA, indexB));
      }
    }

    return set;
  }

  popDoubleFromSet(doubleVal: number, boneYard: Set<Domino>): Domino {
    let domino = Array.from(boneYard).find(singleDomino => singleDomino.double && singleDomino.sideA === doubleVal);
    if (!domino)
      throw new RangeError("Double not found");

    boneYard.delete(domino);
    return domino;
  }

  popRandom(boneYard: Set<Domino>): Domino {
    let index = Math.round((boneYard.size - 1) * Math.random());
    let random = Array.from(boneYard)[index];
    boneYard.delete(random);
    return random;
  }


  addRandomToHand(count: number, hand: Set<Domino>, boneYard: Set<Domino>): void {
    for (let i = 0; i < count; i++) {
      if (boneYard.size === 0)
        break;

      let random = this.popRandom(boneYard);
      hand.add(random);
    }
  }

}
