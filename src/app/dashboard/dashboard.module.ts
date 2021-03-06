import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { RoomComponent } from './room/room.component';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../material.module';
import { UserService } from '../services/user.service';
import { MeetingComponent } from './meeting/meeting.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { DashboardComponent } from './dashboard.component';


@NgModule({
  declarations: [RoomComponent, MeetingComponent, SidebarComponent, DashboardComponent],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    FormsModule,
    MaterialModule
  ],
  providers: [UserService]
})
export class DashboardModule { }
