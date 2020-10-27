import { Injectable } from '@angular/core';
const Config = {
  constraints: {
    video: { width: 553, height: 317 },
    audio: false
  }
}
@Injectable({
  providedIn: 'root'
})
export class CameraService {
  track;
  fakeTrack;
  constructor() {
    let width = Config['constraints']['video']['width'];
    let height = Config['constraints']['video']['height'];
    let canvas = Object.assign(document.createElement("canvas"), { width, height });
    canvas.getContext('2d').fillRect(0, 0, width, height);
    let stream = (canvas as any).captureStream(25);
    this.fakeTrack = Object.assign(stream.getVideoTracks()[0], { enabled: false });
  }
  async start(video) {
    try {
      if (video) {
        let stream = await navigator.mediaDevices.getUserMedia(Config.constraints);
        this.track = stream.getVideoTracks()[0];
      } else {
        this.track = this.fakeTrack;
      }
    } catch (e) {
      video = false
      this.track = this.fakeTrack;
    }
    return video;
  }
  stop() {
    this.track.stop();
  }
  element(userid, stream?, volume?) {
    let div = document.createElement("div");

    let video = document.createElement("video");
    video.volume = volume ? volume : 0;
    div.setAttribute("id", stream.id)
    div.setAttribute("data-userid", userid)

    video.setAttribute("autoplay", "true")
    //video.setAttribute("controls", "false")
    video.setAttribute("class", "sizer")

    video.srcObject = stream;
    div.appendChild(video)
    return div;
  }
}
