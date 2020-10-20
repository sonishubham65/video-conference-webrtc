import { Component, OnInit, ViewChild, ViewEncapsulation, OnDestroy, ɵCompiler_compileModuleSync__POST_R3__ } from '@angular/core';
import { Title, DomSanitizer } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from 'src/app/services/user.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ScreenService } from '../services/screen.service';
import { CameraService } from '../services/camera.service';
import { AudioService } from '../services/audio.service';
import { FirebaseService } from '../services/firebase.service';
import { RtcService } from '../services/rtc.service';


@Component({
  selector: 'app-meeting',
  templateUrl: './meeting.component.html',
  styleUrls: ['./meeting.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class MeetingComponent implements OnInit, OnDestroy {
  roomid;
  shareurl;
  constructor(
    private titleService: Title,
    private snackBar: MatSnackBar,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private cameraService: CameraService,
    private audioService: AudioService,
    public screenService: ScreenService,
    private firebaseService: FirebaseService,
    private rtcService: RtcService) {

    titleService.setTitle("Join the Meeting | webRTC by Shubham Soni, Nagarro Jaipur");
    this.roomid = this.route.params['value'].roomid
    this.shareurl;

    let url;
    if (this.detectPhone.any()) {
      url = `whatsapp://send?text=https://opentok65.web.app/dashboard/meeting/${this.roomid}`;
    } else {
      url = `https://api.whatsapp.com/send?text=https://opentok65.web.app/dashboard/meeting/${this.roomid}`;
    }
    this.shareurl = this.sanitizer.bypassSecurityTrustUrl(url)
  }

  @ViewChild('videos', { static: false }) videoElement: any;

  hasJoined: boolean;

  subscriptions = { offer: null, answer: null, candidate: null, user: null };;
  async ngOnInit() {

  }
  async Join() {
    try {
      let now = await this.firebaseService.now();
      this.hasJoined = true;
      await this.cameraService.start('Low');
      //await this.audioService.start();

      //Create HTML
      let element = this.cameraService.element();
      this.videoElement.nativeElement.appendChild(element);



      // Join the room with roomid.
      this.firebaseService.join(this.roomid, now).then((data) => {
        this.snackBar.open("You have joined the meeting successfully.", "close", {
          duration: 600
        });
      });

      this.subscriptions.user = this.firebaseService.user(this.roomid, now).subscribe(async snapshot => {
        // Create a new Peer for respective Stream

        let userid = snapshot['id'];
        if (userid != this.userService.user.uid) {
          console.log(`Offer is Subscribed.`);
          let peerid = await this.rtcService.create(userid, 'camera');

          //add camera track
          (this.screenService.Stream || this.cameraService.Stream).getTracks().forEach(async track => {
            console.log(`track.muted ${track.muted}`)
            this.rtcService.addTrack(peerid, track, this.cameraService.Stream);
          });

          //add audio track
          // this.audioService.Stream.getTracks().forEach(async track => {
          //   this.rtcService.addTrack(peerid, track, this.cameraService.Stream)
          // });

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
            streamid: this.cameraService.Stream.id
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
          this.ontrack(track, peerid);
        });


        (this.screenService.Stream || this.cameraService.Stream).getTracks().forEach(async track => {
          this.rtcService.addTrack(peerid, track, this.cameraService.Stream)
        });

        // this.audioService.Stream.getTracks().forEach(async track => {
        //   this.rtcService.addTrack(peerid, track, this.cameraService.Stream)
        // });

        //create an answer
        let answer = await this.rtcService.createAnswer(peerid, JSON.parse(snapshot['description']));

        //send answer to user who offered.
        this.firebaseService.share.answer({
          created: await this.firebaseService.now(),
          roomid: this.roomid,
          peerid: peerid,
          userid: snapshot['from'],
          answer: answer,
          streamid: this.cameraService.Stream.id
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
          this.ontrack(event, peerid);
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
    await this.screenService.start();
    let screenTrack = this.screenService.Stream.getVideoTracks()[0];
    Object.keys(this.rtcService.Peers).forEach(peerid => {
      this.rtcService.replaceTrack(peerid, screenTrack)
    });
  }

  async Stop_share() {
    await this.screenService.stop();
    let cameraTrack = this.cameraService.Stream.getVideoTracks()[0];
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
    this.videoElement.nativeElement.querySelectorAll('video').forEach(ele => {
      ele.remove();
    })

    //Stop camera stream
    if (this.cameraService.isStarted)
      this.cameraService.stop();

    //Stop audio stream
    if (this.audioService.isStarted)
      this.audioService.stop();

    //Stop screen stream
    if (this.screenService.isStarted)
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
        //this.setClass();
      } else {
        console.log("Not found");
      }
    } else if (event.currentTarget.iceConnectionState == 'connected') {
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
  ontrack(event, peerid) {
    console.log(`ontrack triggered..`, event);

    event.track.onmute = () => console.log("muted");
    event.track.onunmute = () => console.log("unmuted");

    let stream = event.streams[0];
    console.log(stream.getTracks())
    if (!document.getElementById(stream.id)) {
      console.log("Inserted stream");
      let element = this.cameraService.element(stream, 1);
      this.videoElement.nativeElement.appendChild(element);
      //this.setClass();
    }
  }
}
