import { Component } from '@angular/core';

import { AppService } from './app.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.scss' ]
})
export class AppComponent {
  constructor(private readonly appService: AppService) {
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
}
