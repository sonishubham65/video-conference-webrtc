import { Injectable } from '@angular/core';
const Config = {
  constraints: {
    HD: {
      video: { width: 1280, height: 720 },
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
    let video = document.createElement("video");
    if (!stream) {
      video.volume = volume ? volume : 0;
      stream = this.Stream;
    }
    console.log(stream);

    video.setAttribute("id", stream.id)
    video.setAttribute("autoplay", "true")
    video.setAttribute("controls", "true")
    //video.setAttribute("playsinline", "true")
    video.setAttribute("data-userid", userid)
    video.srcObject = stream;
    return video;
  }
}
