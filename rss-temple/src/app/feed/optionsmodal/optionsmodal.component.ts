import { Component, OnInit, NgZone } from '@angular/core';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { SelectItem } from 'primeng/api';

import { first } from 'rxjs/operators';

import { UserCategoryService } from '@app/_services/data/usercategory.service';

export interface Options {
    categoryText: string;
    isNewCategory: boolean;
}

@Component({
    templateUrl: 'optionsmodal.component.html',
    styleUrls: ['optionsmodal.component.scss'],
})
export class OptionsModalComponent implements OnInit {
    selectItems: SelectItem[];
    selectedItem: string;

    private availableTexts: Set<string>;

    constructor(
        private userCategoryService: UserCategoryService,
        private activeModal: NgbActiveModal,
        private zone: NgZone,
    ) { }

    ngOnInit(): void {
        this.userCategoryService.all({
            fields: ['uuid', 'text'],
            sort: 'text:ASC',
        }).pipe(
            first()
        ).subscribe(userCategoriesObj => {
            this.zone.run(() => {
                this.selectItems = userCategoriesObj.objects.map(uc => {
                    const item: SelectItem = {
                        value: uc.uuid,
                        label: uc.text,
                    };
                    return item;
                });

                this.availableTexts = new Set<string>(userCategoriesObj.objects.map(uc => uc.text));
            });
        }, error => {
            console.log(error);
        });
    }

    dismiss() {
        this.activeModal.dismiss();
    }

    finish() {
        const categoryText: string = this.selectedItem.replace(/\s/g, '').length > 0 ? this.selectedItem : null;
        const isNewCategory = categoryText !== null ? this.availableTexts.has(categoryText) : false;

        const result: Options = {
            categoryText: categoryText,
            isNewCategory: isNewCategory,
        };
        this.activeModal.close(result);
    }
}
