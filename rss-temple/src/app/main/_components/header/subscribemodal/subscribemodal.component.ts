import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormGroupErrors } from '@app/_modules/formgrouperrors.module';

export interface SubscriptionDetails {
  feedUrl: string;
}

@Component({
  templateUrl: 'subscribemodal.component.html',
  styleUrls: ['subscribemodal.component.scss'],
})
export class SubscribeModalComponent {
  submitted = false;

  subscribeForm: FormGroup;
  subscribeFormErrors = new FormGroupErrors();

  constructor(
    private formBuilder: FormBuilder,
    private activeModal: NgbActiveModal,
  ) {
    this.subscribeForm = this.formBuilder.group({
      feedUrl: ['', [Validators.required]],
    });

    this.subscribeFormErrors.initializeControls(this.subscribeForm);
  }

  dismiss() {
    this.activeModal.dismiss();
  }

  finish() {
    this.submitted = true;
    if (this.subscribeForm.invalid) {
      return;
    }

    const result: SubscriptionDetails = {
      feedUrl: this.subscribeForm.controls.feedUrl.value as string,
    };
    this.activeModal.close(result);
  }
}
