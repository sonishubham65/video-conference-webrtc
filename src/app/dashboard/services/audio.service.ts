import { Injectable } from '@angular/core';
@Injectable({
  providedIn: 'root'
})
export class AudioService {
  Stream;
  isStarted;

  constructor() { }
  async start() {
    this.Stream = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: true
    });
    this.isStarted = true;
  }
  stop() {
    this.Stream.getTracks().forEach(function (track) {
      track.stop();
    });
    this.isStarted = false;
  }
  element(stream?, volume?) {
    let audio = document.createElement("audio");
    if (!stream) {
      audio.volume = volume ? volume : 0;
      stream = this.Stream;
    }

    audio.setAttribute("id", stream.id)
    audio.setAttribute("autoplay", "true")
    audio.setAttribute("playsinline", "true")
    audio.srcObject = stream;
    return audio;
  }
}
