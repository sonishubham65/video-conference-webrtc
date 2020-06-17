import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private _user;
  private _isLoggedIn: boolean = false;
  constructor() {
    let data = localStorage.getItem("user");
    if (data) {
      data = JSON.parse(data)
      this.user = data;
    }
  }
  set user(data) {
    if (data) {
      this._isLoggedIn = true;
      this._user = data;
      localStorage.setItem("user", JSON.stringify(data))
    } else {
      this._isLoggedIn = false;
      this._user = null;
      localStorage.setItem("user", null)
    }
  }
  get user() {
    return this._user;
  }
  get isLoggedIn() {
    return this._isLoggedIn;
  }
  logout() {
    this._user = null;
    this._isLoggedIn = false;
    localStorage.removeItem("user");
  }
}
