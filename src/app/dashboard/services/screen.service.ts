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
  constructor() { }
  async start() {
    let stream = await navigator.mediaDevices['getDisplayMedia'](Config.screen);
    this.track = stream.getVideoTrack()[0]
  }
  stop() {
    this.track.stop()
  }
}
