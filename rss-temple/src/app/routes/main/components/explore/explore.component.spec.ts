import { TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { ClarityModule } from '@clr/angular';

import { of } from 'rxjs';

import {
  FeedService,
  FeedEntryService,
  UserService,
  ExploreService,
} from '@app/services/data';
import { ReadCounterService } from '@app/routes/main/services';

import { ExploreComponent } from './explore.component';

async function setup() {
  const mockReadCounterService = jasmine.createSpyObj<ReadCounterService>(
    'ReadCounterService',
    ['readAll'],
  );
  (mockReadCounterService as any).feedCounts$ = of({});

  const mockFeedService = jasmine.createSpyObj<FeedService>('FeedService', [
    'query',
  ]);
  const mockExploreService = jasmine.createSpyObj<ExploreService>(
    'ExploreService',
    ['explore'],
  );
  const mockFeedEntryService = jasmine.createSpyObj<FeedEntryService>(
    'FeedEntryService',
    ['query'],
  );
  const mockUserService = jasmine.createSpyObj<UserService>('UserService', [
    'get',
    'update',
  ]);

  await TestBed.configureTestingModule({
    imports: [
      FormsModule,
      BrowserAnimationsModule,
      ClarityModule,
      RouterTestingModule.withRoutes([]),
    ],
    declarations: [ExploreComponent],
    providers: [
      {
        provide: FeedService,
        useValue: mockFeedService,
      },
      {
        provide: ExploreService,
        useValue: mockExploreService,
      },
    ],
  }).compileComponents();

  return {
    mockReadCounterService,
    mockFeedService,
    mockExploreService,
    mockFeedEntryService,
    mockUserService,
  };
}

describe('ExploreComponent', () => {
  it(
    'should create the component',
    waitForAsync(async () => {
      await setup();

      const componentFixture = TestBed.createComponent(ExploreComponent);
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
        mockExploreService,
        mockFeedEntryService,
      } = await setup();
      mockUserService.get.and.returnValue(of({}));
      mockFeedService.query.and.returnValue(
        of({
          objects: [],
          totalCount: 0,
        }),
      );
      mockExploreService.explore.and.returnValue(of([]));
      mockFeedEntryService.query.and.returnValue(
        of({
          objects: [],
          totalCount: 0,
        }),
      );

      const componentFixture = TestBed.createComponent(ExploreComponent);
      const component = componentFixture.componentInstance;

      component.ngOnInit();

      expect().nothing();
    }),
  );

  // TODO more tests
});
