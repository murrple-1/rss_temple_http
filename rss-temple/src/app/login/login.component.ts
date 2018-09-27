﻿import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { first } from 'rxjs/operators';

import { AlertService } from '../_services/alert.service';
import { LoginService } from '../_services/login.service';
import { GAuthService } from '../_services/gauth.service';
import { FBAuthService } from '../_services/fbauth.service';
import { Subscription } from 'rxjs';

@Component({
    templateUrl: 'login.component.html',
    styleUrls: ['login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
    loginForm: FormGroup;
    submitted = false;
    returnUrl: string;

    isLoggingIn = false;

    gLoaded = false;
    private gLoadedSubscription: Subscription;
    private gUserSubscription: Subscription;

    fbLoaded = false;
    private fbLoadedSubscription: Subscription;
    private fbUserSubscription: Subscription;

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private loginService: LoginService,
        private alertService: AlertService,
        private gAuthService: GAuthService,
        private fbAuthService: FBAuthService,
        private changeDetectorRef: ChangeDetectorRef,
    ) { }

    ngOnInit() {
        this.loginForm = this.formBuilder.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', Validators.required]
        });

        localStorage.removeItem('sessionToken');

        this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/main';

        this.gAuthService.isLoaded$.subscribe(isLoaded => {
            if (isLoaded !== this.gLoaded) {
                this.gLoaded = isLoaded;
                this.changeDetectorRef.detectChanges();
            }

            if (!isLoaded) {
                this.gAuthService.load();
            }
        });

        this.gUserSubscription = this.gAuthService.user$.subscribe(user => {
            this.isLoggingIn = false;
            this.changeDetectorRef.detectChanges();

            if (user) {
                this.handleGoogleUser(user);
            }
        });

        this.fbLoadedSubscription = this.fbAuthService.isLoaded$.subscribe(isLoaded => {
            if (isLoaded !== this.fbLoaded) {
                this.fbLoaded = isLoaded;
                this.changeDetectorRef.detectChanges();
            }

            if (!isLoaded) {
                this.fbAuthService.load();
            }
        });

        this.fbUserSubscription = this.fbAuthService.user$.subscribe(user => {
            this.isLoggingIn = false;
            this.changeDetectorRef.detectChanges();

            if (user) {
                this.handleFacebookUser(user);
            }
        });
    }

    ngOnDestroy() {
        if (this.gLoadedSubscription) {
            this.gLoadedSubscription.unsubscribe();
        }

        if (this.gUserSubscription) {
            this.gUserSubscription.unsubscribe();
        }

        if (this.fbLoadedSubscription) {
            this.fbLoadedSubscription.unsubscribe();
        }

        if (this.fbUserSubscription) {
            this.fbUserSubscription.unsubscribe();
        }
    }

    onSubmit() {
        this.submitted = true;

        if (this.loginForm.invalid) {
            return;
        }

        this.isLoggingIn = true;
        this.loginService.getMyLoginSession(this.loginForm.controls.email.value, this.loginForm.controls.password.value).pipe(
            first()
        ).subscribe(
            data => {
                localStorage.setItem('sessionToken', data);

                this.router.navigate([this.returnUrl]);
            },
            error => {
                let errorMessage = 'Unknown Error';
                if ('status' in error) {
                    switch (error.status) {
                        case 0:
                            errorMessage = 'Unable to connect to server';
                            break;
                        case 403:
                            errorMessage = 'Email or password wrong';
                            break;
                    }
                }
                this.alertService.error(errorMessage);

                this.isLoggingIn = false;
            }
        );
    }

    onGoogleLogin() {
        const user = this.gAuthService.user$.getValue();
        if (!user) {
            this.isLoggingIn = true;
            this.gAuthService.signIn();
        } else {
            this.handleGoogleUser(user);
        }
    }

    handleGoogleUser(user: gapi.auth2.GoogleUser) {
        console.log(user);
        this.router.navigate([this.returnUrl]);
    }

    onFacebookLogin() {
        const user = this.fbAuthService.user$.getValue();
        if (!user) {
            this.isLoggingIn = true;
            this.fbAuthService.signIn();
        } else {
            this.handleFacebookUser(user);
        }
    }

    handleFacebookUser(user: fb.AuthResponse) {
        console.log(user);
        this.router.navigate([this.returnUrl]);
    }
}
