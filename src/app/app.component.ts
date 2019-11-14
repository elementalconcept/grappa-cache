import { Component, OnInit } from '@angular/core';
import { AppService } from './app.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.scss' ]
})
export class AppComponent implements OnInit {
  title = 'grappa-cache';

  constructor(private readonly appService: AppService) {
  }

  ngOnInit() {
    // this.appService.test().subscribe(console.log);
    this.appService.testWithParams('grappa', { payload: 'library' }).subscribe(console.log);
  }
}
