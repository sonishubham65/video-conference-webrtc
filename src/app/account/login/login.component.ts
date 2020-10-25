import { Component, OnInit, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import * as firebase from 'firebase';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from 'src/app/services/user.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  otpForm: FormGroup;
  loginForm: FormGroup;
  countryCodes: Object;
  Process = { otp: false, login: false };
  recaptchaVerifier;
  confirmationResult;
  constructor(private titleService: Title, private fb: FormBuilder, private snackBar: MatSnackBar, private userService: UserService, private router: Router) {
    titleService.setTitle("Login | Realtime by Shubham Soni, MTX");
  }
  ngOnInit() {
    firebase.auth().useDeviceLanguage();
    this.countryCodes = "+1,+91".split(",")
    this.otpForm = this.fb.group({
      countryCode: ['+91', [Validators.required]],
      phone: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(13)]]
    });
    this.loginForm = this.fb.group({
      otp: ['', [Validators.required]]
    });

    this.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('sign-in-button', {
      'size': 'invisible'
    })
  }
  sendOTP(stepper) {
    if (this.otpForm.status == "VALID") {
      this.Process.otp = true;
      let phoneNumber = this.otpForm.get('countryCode').value + this.otpForm.get('phone').value
      firebase.auth().signInWithPhoneNumber(phoneNumber, this.recaptchaVerifier).then(otpConfirmation => {
        this.confirmationResult = otpConfirmation;
        stepper.next();
      }).catch((error) => {
        this.snackBar.open(error.message, "close", {
          duration: 2000,
        });
      }).finally(() => {
        this.Process.otp = false;
      });
    }
  }
  login() {
    if (this.loginForm.status == "VALID") {
      this.Process.login = true;
      this.confirmationResult.confirm(this.loginForm.get('otp').value).then((result) => {
        var user = result.user;
        console.log(user);
        user = JSON.parse(JSON.stringify(user));
        if (user) {
          this.userService.user = {
            phone: user.providerData[0].phoneNumber,
            token: user.stsTokenManager.accessToken,
            uid: user.uid
          }
          if (localStorage.getItem('return_url') != null) {
            this.router.navigate([localStorage.getItem('return_url')]);
            localStorage.removeItem('return_url')
          } else {
            this.router.navigate(['./dashboard/room'])
          }

        }
      }).catch((error) => {
        if (error.code == 'auth/invalid-verification-code') {
          error.message = "The SMS verification code used to create the phone auth credential is invalid."
        }
        this.snackBar.open(error.message, "close", {
          duration: 2000,
        });
      }).finally(() => {
        this.Process.login = false;
      });
    }
  }

}
