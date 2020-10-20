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
  Stream;
  isStarted;
  constructor() { }
  async start() {
    this.Stream = await navigator.mediaDevices['getDisplayMedia'](Config.screen);
    this.isStarted = true;
  }
  stop() {
    this.isStarted = false;
    this.Stream.getTracks().forEach(function (track) {
      track.stop();
    });
  }
}
