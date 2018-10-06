import { TestBed, async } from '@angular/core/testing';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { APP_BASE_HREF } from '@angular/common';

import { AppComponent } from './app.component';
import { routing } from './app.routing';
import { AlertComponent } from './_directives/alert.component';
import { AuthGuard, NoAuthGuard } from './_guards/auth.guard';
import { LoginService } from './_services/login.service';
import { AlertService } from './_services/alert.service';
import { UserService } from './_services/user.service';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { MainComponent } from './main/main.component';

describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        ReactiveFormsModule,
        HttpClientModule,
        routing,
    ],
    declarations: [
        AppComponent,
        AlertComponent,
        LoginComponent,
        RegisterComponent,
        MainComponent,
    ],
    providers: [
        {
          provide: APP_BASE_HREF,
          useValue : '/'
        },
        AuthGuard,
        NoAuthGuard,
        AlertService,
        LoginService,
        UserService,
    ],
    }).compileComponents();
  }));
  it('should create the app', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));
});
