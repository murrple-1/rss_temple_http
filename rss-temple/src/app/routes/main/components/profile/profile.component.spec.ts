import { TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { ClarityModule } from '@clr/angular';

import { of } from 'rxjs';

import { MockGAuthService } from '@app/test/gauth.service.mock';
import { MockFBAuthService } from '@app/test/fbauth.service.mock';
import {
  FeedService,
  FeedEntryService,
  UserService,
  OPMLService,
} from '@app/services/data';
import { GAuthService, FBAuthService } from '@app/services';
import { FeedCountsObservableService } from '@app/routes/main/services';

import { ProfileComponent } from './profile.component';

async function setup() {
  const mockFeedCountsObservableService = jasmine.createSpyObj<FeedCountsObservableService>(
    'FeedCountsObservableService',
    ['refresh'],
  );
  (mockFeedCountsObservableService as any).feedCounts$ = of({});

  const mockFeedService = jasmine.createSpyObj<FeedService>('FeedService', [
    'query',
  ]);
  const mockFeedEntryService = jasmine.createSpyObj<FeedEntryService>(
    'FeedEntryService',
    ['query'],
  );
  const mockUserService = jasmine.createSpyObj<UserService>('UserService', [
    'get',
    'update',
  ]);
  const mockOPMLService = jasmine.createSpyObj<OPMLService>('OPMLService', [
    'download',
  ]);

  await TestBed.configureTestingModule({
    imports: [
      FormsModule,
      BrowserAnimationsModule,
      ClarityModule,
      RouterTestingModule.withRoutes([]),
    ],
    declarations: [ProfileComponent],
    providers: [
      {
        provide: FeedCountsObservableService,
        useValue: mockFeedCountsObservableService,
      },
      {
        provide: GAuthService,
        useClass: MockGAuthService,
      },
      {
        provide: FBAuthService,
        useClass: MockFBAuthService,
      },
      {
        provide: FeedService,
        useValue: mockFeedService,
      },
      {
        provide: FeedEntryService,
        useValue: mockFeedEntryService,
      },
      {
        provide: UserService,
        useValue: mockUserService,
      },
      {
        provide: OPMLService,
        useValue: mockOPMLService,
      },
    ],
  }).compileComponents();

  return {
    mockFeedCountsObservableService,
    mockFeedService,
    mockFeedEntryService,
    mockUserService,
  };
}

describe('ProfileComponent', () => {
  it(
    'should create the component',
    waitForAsync(async () => {
      await setup();

      const componentFixture = TestBed.createComponent(ProfileComponent);
      const component = componentFixture.componentInstance;
      expect(component).toBeTruthy();
    }),
  );

  it(
    'can run ngOnInit',
    waitForAsync(async () => {
      const {
        mockUserService,
        mockFeedService,
        mockFeedEntryService,
      } = await setup();
      mockUserService.get.and.returnValue(of({}));
      mockFeedService.query.and.returnValue(
        of({
          objects: [],
          totalCount: 0,
        }),
      );
      mockFeedEntryService.query.and.returnValue(
        of({
          objects: [],
          totalCount: 0,
        }),
      );

      const componentFixture = TestBed.createComponent(ProfileComponent);
      const component = componentFixture.componentInstance;

      component.ngOnInit();

      expect().nothing();
    }),
  );

  // TODO more tests
});
