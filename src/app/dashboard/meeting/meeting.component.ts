import { Component, OnInit, ViewChild, ViewEncapsulation, OnDestroy, ɵCompiler_compileModuleSync__POST_R3__, Inject } from '@angular/core';
import { Title, DomSanitizer } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from 'src/app/services/user.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ScreenService } from '../services/screen.service';
import { CameraService } from '../services/camera.service';
import { FirebaseService } from '../services/firebase.service';
import { RtcService } from '../services/rtc.service';
import { AudioService } from '../services/audio.service';

@Component({
  selector: 'app-meeting',
  templateUrl: './meeting.component.html',
  styleUrls: ['./meeting.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class MeetingComponent implements OnInit, OnDestroy {
  roomid;
  shareurl;
  remoteVideos = {};
  mic: boolean = false;
  video: boolean = false;
  constructor(
    private titleService: Title,
    private snackBar: MatSnackBar,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private cameraService: CameraService,
    public screenService: ScreenService,
    public audioService: AudioService,
    private firebaseService: FirebaseService,
    private rtcService: RtcService) {

    titleService.setTitle("Join the Meeting | webRTC by Shubham Soni, Nagarro Jaipur");
    this.roomid = this.route.params['value'].roomid
    console.log(router)
    this.shareurl = window.location.href;
  }

  @ViewChild('videos', { static: false }) videoElement: any;

  hasJoined: boolean;

  subscriptions = { offer: null, answer: null, candidate: null, user: null };
  stream;
  async ngOnInit() {

  }
  async Join() {
    try {
      let now = await this.firebaseService.now();
      this.hasJoined = true;

      this.video = await this.cameraService.start(this.video);
      this.mic = await this.audioService.start(this.mic)

      try {
        console.log(this.cameraService.track, this.audioService.track)
        this.stream = new MediaStream([this.cameraService.track, this.audioService.track])
      } catch (e) {
        console.log(e)
      }


      //Create HTML
      let element = this.cameraService.element(this.userService.user.uid, this.stream);
      this.videoElement.nativeElement.appendChild(element);


      // Join the room with roomid.
      this.firebaseService.join(this.roomid, now).then((data) => {
        this.snackBar.open("You have joined the meeting successfully.", "close", {
          verticalPosition: 'top',
          duration: 600
        });
      });

      this.subscriptions.user = this.firebaseService.user(this.roomid, now).subscribe(async snapshot => {
        // Create a new Peer for respective Stream

        let userid = snapshot['id'];
        if (userid != this.userService.user.uid) {
          console.log(`Offer is Subscribed.`);
          let peerid = await this.rtcService.create(userid, 'camera');

          // Add tracks
          this.rtcService.addTrack(peerid, this.cameraService.track);
          this.rtcService.addTrack(peerid, this.audioService.track);


          this.rtcService.onicecandidate(peerid).subscribe(event => {
            this.onicecandidate(event, peerid);
          });

          let offer = await this.rtcService.createOffer(peerid);

          //Send offer to connected remote peers
          this.firebaseService.share.offer({
            created: await this.firebaseService.now(),
            roomid: this.roomid,
            peerid: peerid,
            userid: userid,
            offer: offer,
            //streamid: this.stream.id
          });
        }
      })

      // Starts the listeners for offer
      this.subscriptions.offer = this.firebaseService.offer(this.roomid, now).subscribe(async snapshot => {
        console.log(`Offer is Subscribed.`);
        let peerid = snapshot['peerid'];
        let userid = snapshot['from'];


        // Create a new RTC Peer connection;
        this.rtcService.create(userid, snapshot['streamType'], peerid);

        // Set the listeners
        this.rtcService.onicecandidate(peerid).subscribe(event => {
          this.onicecandidate(event, peerid);
        });
        this.rtcService.oniceconnectionstatechange(peerid).subscribe(event => {
          this.oniceconnectionstatechange(event, peerid, snapshot['streamid']);
        });
        this.rtcService.ontrack(peerid).subscribe(track => {
          this.ontrack(track, peerid, userid);
        });


        // Add track
        this.rtcService.addTrack(peerid, this.screenService.track || this.cameraService.track);
        this.rtcService.addTrack(peerid, this.audioService.track);




        //create an answer
        let answer = await this.rtcService.createAnswer(peerid, JSON.parse(snapshot['description']));

        //send answer to user who offered.
        this.firebaseService.share.answer({
          created: await this.firebaseService.now(),
          roomid: this.roomid,
          peerid: peerid,
          userid: snapshot['from'],
          answer: answer,
          streamid: this.stream.id
        });
      })

      // Starts the listeners for answer
      this.subscriptions.answer = this.firebaseService.answer(this.roomid, now).subscribe(async snapshot => {
        console.log(`Answer is Subscribed..`);

        let peerid = snapshot['peerid'];
        let streamid = snapshot['streamid'];

        //attach listners
        this.rtcService.oniceconnectionstatechange(peerid).subscribe(event => {
          this.oniceconnectionstatechange(event, peerid, streamid);
        });
        this.rtcService.ontrack(peerid).subscribe(event => {
          this.ontrack(event, peerid, snapshot['from']);
        });


        //set remote description
        this.rtcService.setRemoteDescription(peerid, JSON.parse(snapshot['description']));

        //Share candidates
        console.log('candidates lenght', this.rtcService.Candidates[peerid].length)
        this.firebaseService.share.candidate({
          roomid: this.roomid,
          peerid: peerid,
          created: await this.firebaseService.now(),
          userid: snapshot['from'],
          candidates: this.rtcService.Candidates[peerid] ? this.rtcService.Candidates[peerid] : null,
          first: true
        });
      })

      // Starts the listeners for candidate
      this.subscriptions.candidate = this.firebaseService.candidate(this.roomid, now).subscribe(async snapshot => {
        console.log(`Candidate is Subscribed..`);

        let peerid = snapshot['peerid'];

        this.rtcService.addIceCandidate(peerid, JSON.parse(snapshot['candidates']));

        console.log('candidates lenght', this.rtcService.Candidates[peerid].length)
        if (snapshot['first']) {
          this.firebaseService.share.candidate({
            roomid: this.roomid,
            created: await this.firebaseService.now(),
            peerid: peerid,
            userid: snapshot['from'],
            candidates: this.rtcService.Candidates[peerid] ? this.rtcService.Candidates[peerid] : null,
            first: false
          });
        }
      })
    } catch (e) {
      console.log(e)
    }
  }

  async Share() {
    try {
      await this.screenService.start();
      let videoTrack = this.stream.getVideoTracks()[0];

      //this.stream = new MediaStream([videoTrack, this.stream.getAudioTracks()[0]])

      Object.keys(this.rtcService.Peers).forEach(peerid => {
        this.rtcService.replaceTrack(peerid, videoTrack)
      });
      videoTrack.onended = () => {
        this.Stop_share()
      }
    } catch (e) {

    }




  }

  async Stop_share() {
    await this.screenService.stop();
    let cameraTrack = this.cameraService.track.getVideoTracks()[0];
    this.stream = new MediaStream([cameraTrack, this.stream.getAudioTracks()[0]])
    Object.keys(this.rtcService.Peers).forEach(peerid => {
      this.rtcService.replaceTrack(peerid, cameraTrack)
    });
  }

  async Stop() {
    console.log('Stop calling');
    this.hasJoined = false;

    //unsubscribe all the subscription for offer, answer and candidate.
    Object.keys(this.subscriptions).forEach(key => {
      if (this.subscriptions[key])
        this.subscriptions[key].unsubscribe();
    })

    //unsubscribe all the listeners for offer, answer and candidate.
    this.firebaseService.disconnect();

    //remove camera video Element
    this.videoElement.nativeElement.querySelectorAll('div').forEach(ele => {
      ele.remove();
    })

    //Stop camera stream
    this.cameraService.stop();


    //Stop screen stream
    this.screenService.stop();

    this.rtcService.close();
  }

  async ngOnDestroy() {
    this.Stop();
  }

  detectPhone = {
    Android: function () {
      return navigator.userAgent.match(/Android/i);
    },
    BlackBerry: function () {
      return navigator.userAgent.match(/BlackBerry/i);
    },
    iOS: function () {
      return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
    Opera: function () {
      return navigator.userAgent.match(/Opera Mini/i);
    },
    Windows: function () {
      return navigator.userAgent.match(/IEMobile/i) || navigator.userAgent.match(/WPDesktop/i);
    },
    any: () => {
      return (this.detectPhone.Android() || this.detectPhone.BlackBerry() || this.detectPhone.iOS() || this.detectPhone.Opera() || this.detectPhone.Windows());
    }
  };

  oniceconnectionstatechange(event, peerid, streamid) {
    console.log(`Oniceconnectionstatechange triggered..`, event);
    if (event.currentTarget.iceConnectionState == 'disconnected') {
      console.log("Disconnected..", event);
      if (document.getElementById(streamid)) {
        document.getElementById(streamid).remove();
        this.resize();
      } else {
        console.log("Not found");
      }
    } else if (event.currentTarget.iceConnectionState == 'connected') {
      this.resize();
      console.log("Connected..")
    }
  }
  onicecandidate(event, peerid) {
    console.log(`Onicecandidate triggered..`);
    if (event.candidate) {
      if (!this.rtcService.Candidates[peerid]) {
        this.rtcService.Candidates[peerid] = [];
      }
      console.log("Adding Candidate")
      this.rtcService.Candidates[peerid].push(event.candidate);
    }
  }
  ontrack(event, peerid, userid) {
    console.log(`ontrack triggered..`, event);

    if (event.track.kind == 'audio') {
      event.track.onmute = () => console.log("muted");
      event.track.onunmute = () => console.log("unmuted");
    }
    console.log(this.remoteVideos[peerid], '======')
    if (typeof this.remoteVideos[peerid] == 'undefined') {
      this.remoteVideos[peerid] = {}
      this.remoteVideos[peerid][event.track.kind] = event.track;
    } else {
      this.remoteVideos[peerid][event.track.kind] = event.track;
      let stream = new MediaStream([this.remoteVideos[peerid].video, this.remoteVideos[peerid].audio]);
      if (!document.getElementById(userid)) {
        console.log("Inserted stream");
        let element = this.cameraService.element(userid, stream, 1);
        this.videoElement.nativeElement.appendChild(element);
      }
    }

  }
  resize() {
    if (document.getElementById("videos")) {
      let length = document.getElementById("videos").querySelectorAll('div').length
      console.log(`resize length`, length)
      if (length > 2) {
        document.getElementById("videos").classList.add("resize")
      } else {
        document.getElementById("videos").classList.remove("resize")
      }
    }

  }
  async micState(state) {
    this.mic = state;
    let track;
    if (state) {
      this.mic = await this.audioService.start(this.mic);
      if (this.mic) {
        track = this.audioService.track;
        this.snackBar.open("Microphone on", "close", {
          verticalPosition: 'top',
          duration: 600
        });
      } else {
        track = this.audioService.fakeTrack;
      }

    } else {
      track = this.audioService.fakeTrack;
      this.audioService.stop();
      this.snackBar.open("Microphone off", "close", {
        verticalPosition: 'top',
        duration: 600
      });
    }
    console.log(track);
    this.modify_video();
    Object.keys(this.rtcService.Peers).forEach(peerid => {
      this.rtcService.replaceTrack(peerid, track)
    });
  }

  async videoState(state) {
    this.video = state;
    let track;
    if (state) {
      this.video = await this.cameraService.start(this.video);
      if (this.video) {
        track = this.cameraService.track;
        this.snackBar.open("Videocam on", "close", {
          verticalPosition: 'top',
          duration: 600
        });
      } else {
        track = this.cameraService.fakeTrack;
      }
    } else {
      track = this.cameraService.fakeTrack;
      this.cameraService.stop();
      this.snackBar.open("Videocam off", "close", {
        verticalPosition: 'top',
        duration: 600
      });
    }
    this.modify_video();
    Object.keys(this.rtcService.Peers).forEach(peerid => {
      this.rtcService.replaceTrack(peerid, track)
    });
  }
  modify_video() {
    let AudioTrack;
    let VideoTrack;
    if (this.mic) {
      AudioTrack = this.audioService.track;
    } else {
      AudioTrack = this.audioService.fakeTrack;
    }
    if (this.video) {
      VideoTrack = this.cameraService.track;
    } else {
      VideoTrack = this.cameraService.fakeTrack;
    }
    document.getElementById(this.stream.id).querySelector('video').srcObject = new MediaStream([VideoTrack, AudioTrack]);
  }
  copy_share_link() {
    this.shareurl;
    navigator.clipboard.writeText(this.shareurl).then(() => {
      this.snackBar.open("Share url has been copied in your clipboard", "close", {
        verticalPosition: 'top',
        duration: 600
      });
    }, function (err) {
      console.error('Async: Could not copy text: ', err);
    });

  }
}
