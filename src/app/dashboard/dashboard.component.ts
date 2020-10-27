import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  host: { 'class': 'd-flex' }
})
export class DashboardComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
