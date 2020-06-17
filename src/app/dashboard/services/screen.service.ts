import { Injectable } from '@angular/core';
const Config = {
  screen: {
    video: {
      cursor: "always",
    },
    audio: true
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

  }
}
