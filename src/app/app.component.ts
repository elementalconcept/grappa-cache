import { Component } from '@angular/core';

import { CacheReplayService } from '@elemental-concept/grappa-cache';

import { AppService } from './app.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.scss' ]
})
export class AppComponent {
  constructor(private readonly appService: AppService,
              private readonly cacheReplayService: CacheReplayService) {
  }

  makeTestGetCall() {
    this.appService.test().subscribe(
      r => console.log(r),
      e => console.log(e));
  }

  makeTestPostCall() {
    this.appService.testWithParams('abc', { data: 'something' }).subscribe(
      r => console.log(r),
      e => console.log(e));
  }

  replayCache() {
    this.cacheReplayService
      .replay()
      .subscribe(console.log);
  }
}
