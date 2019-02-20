﻿import { Component, OnInit, NgZone, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AlertService } from '@app/_services/alert.service';
import { LoginService } from '@app/_services/login.service';

@Component({
  templateUrl: 'register.component.html',
  styleUrls: ['register.component.scss'],
})
export class RegisterComponent implements OnInit, OnDestroy {
  registerForm: FormGroup;
  loading = false;
  submitted = false;

  private g_token: string;
  private fb_token: string;

  private unsubscribe$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private loginService: LoginService,
    private alertService: AlertService,
    private zone: NgZone,
  ) {}

  ngOnInit() {
    this.registerForm = this.formBuilder.group({
      email: [
        this.route.snapshot.paramMap.get('email') || '',
        [Validators.required, Validators.email],
      ],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.g_token = this.route.snapshot.paramMap.get('g_token');
    this.fb_token = this.route.snapshot.paramMap.get('fb_token');
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  onSubmit() {
    this.submitted = true;
    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;

    if (this.g_token !== null) {
      this.loginService
        .createGoogleLogin(
          this.registerForm.controls.email.value,
          this.registerForm.controls.password.value,
          this.g_token,
        )
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe({
          next: this.handleRegisterSuccess.bind(this),
          error: this.handleRegisterError.bind(this),
        });
    } else if (this.fb_token !== null) {
      this.loginService
        .createFacebookLogin(
          this.registerForm.controls.email.value,
          this.registerForm.controls.password.value,
          this.fb_token,
        )
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe({
          next: this.handleRegisterSuccess.bind(this),
          error: this.handleRegisterError.bind(this),
        });
    } else {
      this.loginService
        .createMyLogin(
          this.registerForm.controls.email.value,
          this.registerForm.controls.password.value,
        )
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe({
          next: this.handleRegisterSuccess.bind(this),
          error: this.handleRegisterError.bind(this),
        });
    }
  }

  private handleRegisterSuccess() {
    this.zone.run(() => {
      this.router.navigate(['/login']);
    });
  }

  private handleRegisterError(error: any) {
    let errorMessage = 'Unknown Error';
    switch (error.status) {
      case 0:
        errorMessage = 'Unable to connect to server';
        break;
      case 409:
        errorMessage = 'Email already in use';
        break;
    }

    this.zone.run(() => {
      this.alertService.error(errorMessage);

      this.loading = false;
    });
  }
}
