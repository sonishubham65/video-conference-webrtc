import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from 'src/app/services/user.service';
import { Router, ActivatedRoute } from '@angular/router';
import * as firebase from 'firebase';
@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.css']
})
export class RoomComponent implements OnInit {

  Process = { create: false, join: false };
  roomid: string;
  constructor(private titleService: Title, private snackBar: MatSnackBar, private userService: UserService, private router: Router, private route: ActivatedRoute) {
    titleService.setTitle("Create a room | webRTC by Shubham Soni, Nagarro Jaipur");
    if (this.route.params['value'].roomid) {
      this.roomid = this.route.params['value'].roomid;
    }
  }
  ngOnInit() {
    console.log("this.route.params", this.route.params['value'].roomid)
  }
  generateRoom() {
    this.Process.create = true;
    const _ref = firebase.firestore().collection("rooms").doc();
    const key = _ref.id;

    firebase.firestore().collection("rooms").doc(key).set({
      created_by: this.userService.user.uid,
      users: [this.userService.user.uid]
    }).then(res => {
      this.roomid = key;
      this.snackBar.open("A new room is created..", "close", {
        duration: 3000,
      })
    }).catch(e => {
      console.log(e.message);
    }).finally(() => {
      this.Process.create = false;
    })
  }

}
