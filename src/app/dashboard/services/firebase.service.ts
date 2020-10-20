import { Injectable } from '@angular/core';
import * as firebase from 'firebase';
import { UserService } from 'src/app/services/user.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  constructor(private userService: UserService) {

  }
  Listeners = { offer: null, answer: null, candidate: null, };
  /**
   * 
   * @param roomid
   * @description This function adds the user id to room.users collection
   */
  async now() {
    const time = await firebase.firestore.Timestamp.now().seconds;
    console.log(`time`, time)
    return time;
  }
  async join(roomid, now) {
    await firebase.firestore().collection("rooms").doc(roomid).collection("users").add({
      id: this.userService.user.uid,
      created: now
    });
    // await firebase.firestore().collection("rooms").doc(roomid).update({
    //   users: firebase.firestore.FieldValue.arrayUnion(this.userService.user.uid)
    // });
  }
  /**
   * 
   * @param roomid 
   * @description This function gets the list of users and room information
   */
  async getroom(roomid) {
    let doc = await firebase.firestore().collection("rooms").doc(roomid).get();
    if (doc.exists && doc.data()) {
      return doc.data();
    }
    return false;
  }
  /**
   * 
   * @param roomid 
   * @description This function is to start a listener for offers;
   */
  offer(roomid, now) {
    return new Observable(observer => {
      this.Listeners.offer = firebase.firestore().collection("rooms").doc(roomid).collection(`offers-${this.userService.user.uid}`).where("created", ">=", now).onSnapshot(snapshot => {
        snapshot.docChanges().forEach(async change => {
          observer.next(change.doc.data());
        });
      });
    })
  }



  /**
   * 
   * @param roomid 
   * @description This function is to start a listener for answers;
   */
  answer(roomid, now) {
    return new Observable(observer => {
      this.Listeners.answer = firebase.firestore().collection("rooms").doc(roomid).collection(`answers-${this.userService.user.uid}`).where("created", ">=", now).onSnapshot(snapshot => {
        snapshot.docChanges().forEach(async change => {
          observer.next(change.doc.data());
        });
      });
    })
  }



  /**
   * 
   * @param roomid 
   * @description This function is to start a listener for candidates;
   */
  candidate(roomid, now) {
    return new Observable(observer => {
      this.Listeners.candidate = firebase.firestore().collection("rooms").doc(roomid).collection(`candidates-${this.userService.user.uid}`).where("created", ">=", now).onSnapshot(snapshot => {
        snapshot.docChanges().forEach(async change => {
          observer.next(change.doc.data());
        });
      });
    })
  }

  /**
   * 
   * @param roomid 
   * @description This function is to start a listener for user;
   */
  user(roomid, now) {
    return new Observable(observer => {
      this.Listeners.candidate = firebase.firestore().collection("rooms").doc(roomid).collection("users").where("created", ">=", now).onSnapshot(snapshot => {
        snapshot.docChanges().forEach(async change => {
          observer.next(change.doc.data());
        });
      });
    })
  }

  /**
   * 
   * @param roomid 
   * @description This function is to start a listener for user response;
   */
  response(roomid) {
    let now = new Date().getTime();
    return new Observable(observer => {
      this.Listeners.candidate = firebase.firestore().collection("response").doc(roomid).collection("users").where("created", ">=", now).onSnapshot(snapshot => {
        snapshot.docChanges().forEach(async change => {
          observer.next(change.doc.data());
        });
      });
    })
  }



  share = {
    offer: (_args) => {
      const { roomid, peerid, userid, offer, streamid, created } = _args;
      let set = {
        description: JSON.stringify(offer),
        from: this.userService.user.uid,
        to: userid,
        peerid: peerid,
        streamid: streamid,
        created: created,
      };
      console.log(`Create an offer for userid=${userid}`);
      firebase.firestore().collection("rooms").doc(roomid).collection(`offers-${userid}`).doc().set(set);
    },
    answer: (_args) => {
      const { roomid, peerid, userid, answer, streamid, created } = _args;
      let set = {
        created: created,
        description: JSON.stringify(answer),
        from: this.userService.user.uid,
        to: userid,
        peerid: peerid,
        streamid: streamid,
      };
      console.log(`Create an answer for userid=${userid}`);
      firebase.firestore().collection("rooms").doc(roomid).collection(`answers-${userid}`).doc().set(set);
    },
    candidate: (_args) => {
      const { roomid, peerid, userid, candidates, first, created } = _args;
      console.log(candidates)
      let set = {
        candidates: JSON.stringify(candidates),
        from: this.userService.user.uid,
        to: userid,
        peerid: peerid,
        created: created,
        first: first
      };
      console.log(`Create candidate for userid=${userid}`);
      firebase.firestore().collection("rooms").doc(roomid).collection(`candidates-${userid}`).doc().set(set);
    },
  }

  /**
   * @description Disconnects all the listeners
   */
  async disconnect() {
    Object.keys(this.Listeners).forEach(key => {
      if (this.Listeners[key])
        this.Listeners[key]();
    })
  }
}
