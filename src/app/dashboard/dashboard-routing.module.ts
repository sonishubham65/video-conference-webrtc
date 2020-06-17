import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RoomComponent } from './room/room.component';
import { MeetingComponent } from './meeting/meeting.component';


const routes: Routes = [{
  path: 'room',
  component: RoomComponent
}, {
  path: 'room/:roomid',
  component: RoomComponent
}, {
  path: 'meeting/:roomid',
  component: MeetingComponent
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
