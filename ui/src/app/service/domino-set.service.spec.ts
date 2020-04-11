import { TestBed } from '@angular/core/testing';

import { DominoSetService } from './domino-set.service';

describe('DominoSetService', () => {
  let service: DominoSetService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DominoSetService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('domino set correct', () => {
    let set = service.generateSet(2);
    let keySet = new Set<string>();
    set.forEach(domino => keySet.add(domino.key));

    expect(keySet.size).toEqual(6);
  });
});
