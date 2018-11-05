import { Injectable } from '@angular/core';

import { BehaviorSubject, Observable } from 'rxjs';

import { environment } from '@environments/environment';

@Injectable()
export class FBAuthService {
    private _user$ = new BehaviorSubject<facebook.AuthResponse>(null);
    private _isLoaded$ = new BehaviorSubject<boolean>(false);

    user$: Observable<facebook.AuthResponse>;
    isLoaded$: Observable<boolean>;

    constructor() {
        this.user$ = this._user$.asObservable();
        this.isLoaded$ = this._isLoaded$.asObservable();
    }

    signIn(options: fb.LoginOptions = {
        scope: 'email',
    }) {
        FB.login(response => {
            if (response.status === 'connected') {
                this._user$.next(response.authResponse);
            } else {
                this._user$.next(null);
            }
        }, options);
    }

    signOut() {
        FB.logout(_ => {
            this._user$.next(null);
        });
    }

    load(id = 'fb-jssdk', language = 'en_US') {
        (window as any).fbAsyncInit = () => {
            FB.init({
                appId: environment.facebookAppId,
                xfbml: true,
                version: 'v2.10',
            });
            FB.AppEvents.logPageView();

            this._isLoaded$.next(true);
        };

        if (document.getElementById(id)) {
            return;
        }

        const js = document.createElement('script');
        js.id = id;
        js.src = `//connect.facebook.net/${language}/sdk.js`;
        document.head.appendChild(js);
    }
}
