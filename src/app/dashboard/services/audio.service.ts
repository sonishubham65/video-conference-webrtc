import { Injectable } from '@angular/core';
@Injectable({
  providedIn: 'root'
})
export class AudioService {
  track;
  fakeTrack;
  constructor() {
    let ctx = new AudioContext();
    let oscillator = ctx.createOscillator();
    let dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    let track = Object.assign(dst['stream'].getAudioTracks()[0], { enabled: false });
    this.fakeTrack = track;
  }

  async start(mic) {
    try {
      if (mic) {
        let stream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true
        });
        this.track = stream.getAudioTracks()[0]
      } else {
        this.track = this.fakeTrack;
      }
    } catch (e) {
      mic = false
      this.track = this.fakeTrack;
    }
    return mic;
  }
  stop() {
    this.track.stop();
  }
  element(stream?, volume?) {
    let audio = document.createElement("audio");
    if (!stream) {
      audio.volume = volume ? volume : 0;
      stream = this.track;
    }

    audio.setAttribute("id", stream.id)
    audio.setAttribute("autoplay", "true")
    audio.setAttribute("playsinline", "true")
    audio.srcObject = stream;
    return audio;
  }
}
