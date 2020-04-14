import { TestBed } from '@angular/core/testing';
import { SetUtils } from '../../../../common/src/util/domino-set-utils';

describe('DominoSetService', () => {

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('domino set correct', () => {
    let set = SetUtils.generateSet(2);
    let keySet = new Set<string>();
    set.forEach(domino => keySet.add(domino.key));

    expect(keySet.size).toEqual(6);
  });
});
