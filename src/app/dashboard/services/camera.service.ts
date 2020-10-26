import { Injectable } from '@angular/core';
const Config = {
  constraints: {
    HD: {
      video: true,
      audio: true
    },
    Low: {
      video: { width: 640, height: 480 },
      audio: true,
    }
  }
}
@Injectable({
  providedIn: 'root'
})
export class CameraService {
  Stream;
  isStarted;

  constructor() { }
  async start(type) {
    this.Stream = await navigator.mediaDevices.getUserMedia(Config.constraints[type]);
    this.isStarted = true;
  }
  stop() {
    this.Stream.getTracks().forEach(function (track) {
      track.stop();
    });
    this.isStarted = false;
  }
  element(userid, stream?, volume?) {
    let div = document.createElement("div");

    let video = document.createElement("video");
    if (!stream) {
      video.volume = volume ? volume : 0;
      stream = this.Stream;
    }
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
