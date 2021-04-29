import { Component, OnDestroy, NgZone } from '@angular/core';

import { Subject } from 'rxjs';
import { takeUntil, map, take } from 'rxjs/operators';

import { UserCategoryService } from '@app/services/data';
import { HttpErrorService } from '@app/services';
import { Sort } from '@app/services/data/sort.interface';
import { UserCategory } from '@app/models';

type UserCategoryImpl1 = Required<Pick<UserCategory, 'uuid' | 'text'>>;
type UserCategoryImpl2 = Required<Pick<UserCategory, 'uuid'>>;

interface CategoryDescriptor {
  _uuid: string;
  text: string;
}

@Component({
  selector: 'app-global-user-categories-modal',
  templateUrl: './global-user-categories-modal.component.html',
  styleUrls: ['./global-user-categories-modal.component.scss'],
})
export class GlobalUserCategoriesModalComponent implements OnDestroy {
  open = false;

  isLoading = false;

  newUserCategoryText = '';

  categoryDescriptors: CategoryDescriptor[] = [];

  result = new Subject<void>();

  private readonly unsubscribe$ = new Subject<void>();

  constructor(
    private zone: NgZone,
    private userCategoryService: UserCategoryService,
    private httpErrorService: HttpErrorService,
  ) {}

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  reset() {
    this.newUserCategoryText = '';
    this.categoryDescriptors = [];
  }

  load() {
    this.userCategoryService
      .queryAll({
        fields: ['uuid', 'text'],
        returnTotalCount: false,
        sort: new Sort([['text', 'ASC']]),
      })
      .pipe(
        takeUntil(this.unsubscribe$),
        map(userCategories => {
          if (userCategories.objects !== undefined) {
            return userCategories.objects as UserCategoryImpl1[];
          }
          throw new Error('malformed response');
        }),
      )
      .subscribe({
        next: userCategories => {
          const categoryDescriptors = userCategories.map<CategoryDescriptor>(
            uc => ({
              _uuid: uc.uuid,
              text: uc.text,
            }),
          );

          this.zone.run(() => {
            this.categoryDescriptors = categoryDescriptors;
          });
        },
        error: error => {
          this.httpErrorService.handleError(error);
        },
      });
  }

  openChanged(open: boolean) {
    if (!open) {
      this.result.next();
    }

    this.open = open;
  }

  addUserCategory() {
    const newUserCategoryText = this.newUserCategoryText;
    const categoryDescriptor = this.categoryDescriptors.find(
      cd => cd.text === newUserCategoryText,
    );
    if (categoryDescriptor === undefined) {
      this.isLoading = true;

      this.userCategoryService
        .create(
          {
            text: this.newUserCategoryText,
          },
          {
            fields: ['uuid'],
          },
        )
        .pipe(
          takeUntil(this.unsubscribe$),
          map(response => response as UserCategoryImpl2),
        )
        .subscribe({
          next: userCategory => {
            const categoryDescriptors = [
              ...this.categoryDescriptors,
              {
                _uuid: userCategory.uuid,
                text: newUserCategoryText,
              },
            ].sort(sortCategoryDescriptor);

            this.zone.run(() => {
              this.categoryDescriptors = categoryDescriptors;
              this.newUserCategoryText = '';
              this.isLoading = false;
            });
          },
          error: error => {
            this.httpErrorService.handleError(error);

            this.zone.run(() => {
              this.isLoading = false;
            });
          },
        });
    } else {
      this.newUserCategoryText = '';
    }
  }

  removeUserCategory(categoryDescriptor: CategoryDescriptor) {
    this.isLoading = true;
    this.userCategoryService
      .delete(categoryDescriptor._uuid)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: () => {
          const categoryDescriptors = this.categoryDescriptors.filter(
            cd => cd._uuid !== categoryDescriptor._uuid,
          );

          this.zone.run(() => {
            this.categoryDescriptors = categoryDescriptors;
            this.isLoading = false;
          });
        },
        error: error => {
          this.httpErrorService.handleError(error);

          this.zone.run(() => {
            this.isLoading = false;
          });
        },
      });
  }
}

export function openModal(modal: GlobalUserCategoriesModalComponent) {
  modal.reset();
  modal.open = true;
  modal.load();

  return modal.result.pipe(take(1)).toPromise();
}

function sortCategoryDescriptor(a: CategoryDescriptor, b: CategoryDescriptor) {
  return a.text.localeCompare(b.text);
}
