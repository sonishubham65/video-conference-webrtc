import { Injectable } from '@angular/core';
const Config = {
  screen: {
    video: {
      cursor: "always",
    },
    audio: false
  }
}
@Injectable({
  providedIn: 'root'
})
export class ScreenService {
  track;
  stream;
  constructor() { }
  async start() {
    this.stream = await navigator.mediaDevices['getDisplayMedia'](Config.screen);
    this.track = this.stream.getTracks()[0]
  }
  stop() {
    if (this.track) {
      this.track.stop()
      this.track = undefined
    }
  }
}
