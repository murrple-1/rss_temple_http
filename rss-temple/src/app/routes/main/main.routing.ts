import { RouterModule, Routes } from '@angular/router';

import { MainComponent } from '@app/routes/main/main.component';
import { FeedsComponent } from '@app/routes/main/components/feeds/feeds.component';
import { FeedComponent } from '@app/routes/main/components/feed/feed.component';
import { ProfileComponent } from '@app/routes/main/components/profile/profile.component';

const routes: Routes = [
  {
    path: '',
    component: MainComponent,
    children: [
      { path: '', component: FeedsComponent },
      { path: 'feed', component: FeedComponent },
      { path: 'profile', component: ProfileComponent },
    ],
  },
];

export const routing = RouterModule.forChild(routes);