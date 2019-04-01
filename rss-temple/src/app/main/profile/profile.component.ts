import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ValidationErrors,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { Subject, zip } from 'rxjs';
import { takeUntil, skip } from 'rxjs/operators';

import {
  FeedService,
  FeedEntryService,
  UserService,
} from '@app/_services/data';
import {
  HttpErrorService,
  GAuthService,
  FBAuthService,
  AlertService,
} from '@app/_services';
import { UpdateUserBody } from '@app/_services/data/user.service';
import {
  isValidPassword,
  doPasswordsMatch,
} from '@app/_modules/password.module';
import { FormGroupErrors } from '@app/_modules/formgrouperrors.module';

enum State {
  IsLoading,
  LoadSuccess,
  LoadError,
  IsSaving,
  SaveSuccess,
  SaveError,
}

@Component({
  templateUrl: 'profile.component.html',
  styleUrls: ['profile.component.scss'],
})
export class ProfileComponent implements OnInit, OnDestroy {
  state = State.IsLoading;
  readonly State = State;

  profileForm: FormGroup;
  profileFormErrors = new FormGroupErrors();

  hasGoogleLogin = false;
  hasFacebookLogin = false;

  numberOfFeeds = 0;
  numberOfReadFeedEntries = 0;

  gLoaded = false;
  fbLoaded = false;

  private unsubscribe$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private zone: NgZone,
    private feedService: FeedService,
    private feedEntryService: FeedEntryService,
    private userService: UserService,
    private httpErrorService: HttpErrorService,
    private gAuthService: GAuthService,
    private fbAuthService: FBAuthService,
    private alertService: AlertService,
  ) {
    this.profileForm = this.formBuilder.group(
      {
        email: ['', [Validators.email]],
        oldPassword: [''],
        newPassword: ['', [isValidPassword()]],
        newPasswordCheck: ['', [isValidPassword()]],
      },
      {
        validators: [doPasswordsMatch('newPassword', 'newPasswordCheck')],
      },
    );

    this.profileFormErrors.initializeControls(this.profileForm);
  }

  ngOnInit() {
    zip(
      this.userService.get({
        fields: ['email', 'hasGoogleLogin', 'hasFacebookLogin'],
      }),
      this.feedService.query({
        returnObjects: false,
        returnTotalCount: true,
      }),
      this.feedEntryService.query({
        returnObjects: false,
        returnTotalCount: true,
        search: 'isRead:"true"',
      }),
    )
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: responses => {
          this.zone.run(() => {
            const user = responses[0];
            if (user.email !== undefined) {
              this.profileForm.controls.email.setValue(user.email);
              this.profileForm.controls.email.markAsPristine();
            }

            if (user.hasGoogleLogin !== undefined) {
              this.hasGoogleLogin = user.hasGoogleLogin;
            }

            if (user.hasFacebookLogin !== undefined) {
              this.hasFacebookLogin = user.hasFacebookLogin;
            }

            if (responses[1].totalCount !== undefined) {
              this.numberOfFeeds = responses[1].totalCount;
            }

            if (responses[2].totalCount) {
              this.numberOfReadFeedEntries = responses[2].totalCount;
            }

            this.state = State.LoadSuccess;
          });
        },
        error: error => {
          this.httpErrorService.handleError(error);

          this.zone.run(() => {
            this.state = State.LoadError;
          });
        },
      });

    this.gAuthService.isLoaded$.pipe(takeUntil(this.unsubscribe$)).subscribe({
      next: isLoaded => {
        if (isLoaded !== this.gLoaded) {
          this.zone.run(() => {
            this.gLoaded = isLoaded;
          });
        }

        if (!isLoaded) {
          this.gAuthService.load();
        }
      },
    });

    if (this.gAuthService.user !== null) {
      this.gAuthService.signOut();
    }

    this.gAuthService.user$
      .pipe(
        skip(1),
        takeUntil(this.unsubscribe$),
      )
      .subscribe({
        next: user => {
          if (user !== null) {
            this.handleGoogleUser(user);
          }
        },
      });

    this.fbAuthService.isLoaded$.pipe(takeUntil(this.unsubscribe$)).subscribe({
      next: isLoaded => {
        if (isLoaded !== this.fbLoaded) {
          this.zone.run(() => {
            this.fbLoaded = isLoaded;
          });
        }

        if (!isLoaded) {
          this.fbAuthService.load();
        }
      },
    });

    if (this.fbAuthService.user !== null) {
      this.fbAuthService.signOut();
    }

    this.fbAuthService.user$
      .pipe(
        skip(1),
        takeUntil(this.unsubscribe$),
      )
      .subscribe({
        next: user => {
          if (user !== null) {
            this.handleFacebookUser(user);
          }
        },
      });
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  linkGoogle() {
    this.gAuthService.signIn();
  }

  private handleGoogleUser(user: gapi.auth2.GoogleUser) {
    this.userService
      .update({
        google: {
          token: user.getAuthResponse().id_token,
        },
      })
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: () => {
          this.zone.run(() => {
            this.hasGoogleLogin = true;
          });
        },
        error: error => {
          this.httpErrorService.handleError(error);
        },
      });
  }

  linkFacebook() {
    this.fbAuthService.signIn();
  }

  private handleFacebookUser(user: fb.AuthResponse) {
    this.userService
      .update({
        facebook: {
          token: user.accessToken,
        },
      })
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: () => {
          this.zone.run(() => {
            this.hasFacebookLogin = true;
          });
        },
        error: error => {
          this.httpErrorService.handleError(error);
        },
      });
  }

  unlinkGoogle() {
    this.gAuthService.signOut();

    this.hasGoogleLogin = false;

    this.userService
      .update({
        google: null,
      })
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        error: error => {
          this.httpErrorService.handleError(error);

          this.zone.run(() => {
            this.hasGoogleLogin = true;
          });
        },
      });
  }

  unlinkFacebook() {
    this.fbAuthService.signOut();

    this.hasFacebookLogin = false;

    this.userService
      .update({
        facebook: null,
      })
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        error: error => {
          this.httpErrorService.handleError(error);

          this.zone.run(() => {
            this.hasFacebookLogin = true;
          });
        },
      });
  }

  onSave() {
    let hasUpdates = false;
    const updateUserBody: UpdateUserBody = {};

    const emailControl = this.profileForm.controls.email;
    if (!emailControl.errors && emailControl.dirty) {
      updateUserBody.email = emailControl.value as string;
      hasUpdates = true;
    }

    const oldPasswordControl = this.profileForm.controls.oldPassword;
    if (
      (oldPasswordControl.value as string).length > 0 &&
      !((this.profileForm.errors || {}) as ValidationErrors).passwordErrors
    ) {
      const newPasswordControl = this.profileForm.controls.newPassword;

      updateUserBody.my = {
        password: {
          old: oldPasswordControl.value as string,
          new: newPasswordControl.value as string,
        },
      };
      hasUpdates = true;
    }

    if (hasUpdates) {
      this.state = State.IsSaving;

      this.userService
        .update(updateUserBody)
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe({
          next: () => {
            this.alertService.success('Profile Saved', 5000);

            this.zone.run(() => {
              this.state = State.SaveSuccess;
            });
          },
          error: error => {
            if (error instanceof HttpErrorResponse && error.status === 400) {
              this.alertService.error('Profile failed to save', 5000);
            } else {
              this.httpErrorService.handleError(error);
            }

            this.zone.run(() => {
              this.state = State.SaveError;
            });
          },
        });
    }
  }
}
