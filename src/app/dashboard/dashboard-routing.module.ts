import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RoomComponent } from './room/room.component';
import { MeetingComponent } from './meeting/meeting.component';
import { DashboardComponent } from './dashboard.component';


const routes: Routes = [{
  path: '',
  children: [{
    path: 'room',
    component: RoomComponent
  }, {
    path: 'room/:roomid',
    component: RoomComponent
  }, {
    path: 'meeting/:roomid',
    component: MeetingComponent
  }],
  component: DashboardComponent
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
