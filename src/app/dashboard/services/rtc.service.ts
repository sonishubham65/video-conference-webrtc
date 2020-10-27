import { Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { Observable } from 'rxjs';
let Config = {
  server: {
    configuration: {
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    },
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  }
}


@Injectable({
  providedIn: 'root'
})

export class RtcService {
  Peers: Object = {};
  Candidates: Object = {};
  Connections: Object = {};
  constructor() {

  }
  /**
   * This function creates a new RTCPeerConnection and returns a new uniqid.
   */
  async create(userid, streamType, peerid?) {
    if (!peerid) {
      peerid = uuidv4();
    }
    this.Connections[peerid] = { userid: userid };

    this.Peers[peerid] = new RTCPeerConnection(Config.server);
    return peerid;
  }

  /**
   * 
   * @param peerid 
   * @description This function starts a listerner for new icecandiate.
   */
  onicecandidate(peerid) {
    return new Observable(observer => {
      //console.log("onicecandidateby ", peerid)
      this.Peers[peerid].onicecandidate = async (event) => {
        observer.next(event)
      }
    })
  }
  /**
   * 
   * @param peerid 
   * @description This function starts a listerner for connection change event.
   */
  oniceconnectionstatechange(peerid) {
    return new Observable(observer => {
      this.Peers[peerid].oniceconnectionstatechange = (event) => {
        observer.next(event)
      }
    })
  }
  /**
   * 
   * @param peerid 
   * @description This function starts a listerner for new track.
   */
  ontrack(peerid) {
    return new Observable(observer => {
      this.Peers[peerid].ontrack = (event) => {
        observer.next(event)
      }
    });
  }


  /**
   * 
   * @param peerid 
   * @description This function add a new track to RTCPeerConnection
   */
  async addTrack(peerid, track) {
    console.log(`Track is being added..`, track)
    let trackid = await this.Peers[peerid].addTrack(track);
    if (!this.Connections[peerid].tracks) {
      this.Connections[peerid].tracks = [];
    }
    this.Connections[peerid].tracks.push(trackid);

  }

  async removeTrack(peerid) {
    let tracks = this.Connections[peerid].tracks;
    if (tracks) {
      tracks.forEach(trackid => {
        this.Peers[peerid].removeTrack(trackid);
      });
    }
  }

  async replaceTrack(peerid, track) {
    //console.log(this.Connections[peerid], peerid);
    console.log(track)
    var sender = this.Connections[peerid].tracks.find(function (s) {
      console.log(s)
      return s.track.kind == track.kind;
    });
    //console.log('found sender:', sender);
    sender.replaceTrack(track);
  }


  /**
   * 
   * @param peerid 
   * @description This function Creates a new offer and set it as local description.
   */
  async createOffer(peerid) {
    let offer = await this.Peers[peerid].createOffer({ iceRestart: true });
    await this.setLocalDescription(peerid, offer);
    return offer;
  }

  /**
   * 
   * @param peerid 
   * @description This function Creates a answer for offer and set it as localdescription.
   */
  async createAnswer(peerid, description) {
    await this.setRemoteDescription(peerid, description);
    let answer = await this.Peers[peerid].createAnswer();
    await this.setLocalDescription(peerid, answer);
    return answer;
  }

  /**
   * 
   * @param peerid 
   * @param offer 
   * @description This function sets the local description
   */
  async setLocalDescription(peerid, description) {
    //console.log("peerid", peerid)
    await this.Peers[peerid].setLocalDescription(description);
  }


  /**
   * 
   * @param peerid 
   * @param offer 
   * @description This function sets the remote description
   */
  async setRemoteDescription(peerid, description) {
    await this.Peers[peerid].setRemoteDescription(description);
  }

  async addIceCandidate(peerid, candidates) {
    if (candidates)
      candidates.forEach(async candidate => {
        await this.Peers[peerid].addIceCandidate(candidate);
      })
  }

  /**
   * @description This function closes all the opened connections with RTCPeerConnection
   */
  async close() {
    Object.keys(this.Peers).forEach(peerid => {
      this.Peers[peerid].close();
    })
  }
}
