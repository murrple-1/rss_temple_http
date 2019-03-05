import {
  Component,
  ViewChild,
  ElementRef,
  NgZone,
  OnDestroy,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { OPMLService } from '@app/_services/data/opml.service';
import { ProgressService } from '@app/_services/data/progress.service';
import { HttpErrorService } from '@app/_services/httperror.service';

interface ProgressStatus {
  totalCount: number;
  finishedCount: number;
}

@Component({
  templateUrl: 'opmlmodal.component.html',
  styleUrls: ['opmlmodal.component.scss'],
})
export class OPMLModalComponent implements OnDestroy {
  @ViewChild('opmlFileInput')
  opmlFileInput!: ElementRef<HTMLInputElement>;

  uploading = false;

  progressStatus: ProgressStatus | null = null;

  errorString: string | null = null;

  private readonly progressCheckInterval = 2000;

  private unsubscribe$ = new Subject<void>();

  constructor(
    private zone: NgZone,
    private activeModal: NgbActiveModal,
    private opmlService: OPMLService,
    private progressService: ProgressService,
    private httpErrorService: HttpErrorService,
  ) {}

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  dismiss() {
    this.activeModal.dismiss();
  }

  finish() {
    const nativeElement = this.opmlFileInput.nativeElement;
    if (nativeElement.files && nativeElement.files.length > 0) {
      const file = nativeElement.files[0];

      const reader = new FileReader();

      reader.onload = () => {
        if (reader.result !== null) {
          this.opmlService
            .upload(reader.result)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe({
              next: response => {
                if (response.status === 200) {
                  this.activeModal.close();
                } else if (response.status === 202) {
                  const body = response.body;
                  if (typeof body === 'string') {
                    this.zone.run(() => {
                      this.checkProgress(body);
                    });
                  } else {
                    this.zone.run(() => {
                      this.uploading = false;
                    });
                  }
                } else {
                  this.activeModal.close();
                }
              },
              error: (error: HttpErrorResponse) => {
                this.zone.run(() => {
                  this.uploading = false;
                });
                this.httpErrorService.handleError(error);
              },
            });
        }
      };

      reader.onerror = () => {
        // TODO show error?
        this.zone.run(() => {
          this.uploading = false;
        });
      };

      this.uploading = true;
      reader.readAsText(file);
    } else {
      this.activeModal.dismiss();
    }
  }

  private checkProgress(progressUuid: string) {
    this.progressService
      .checkProgress(progressUuid)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: status => {
          switch (status.state) {
            case 'notstarted':
            case 'started':
              this.zone.run(() => {
                this.progressStatus = {
                  totalCount: status.totalCount,
                  finishedCount: status.finishedCount,
                };
              });
              setTimeout(
                this.checkProgress.bind(this, progressUuid),
                this.progressCheckInterval,
              );
              break;
            case 'finished':
              this.activeModal.close();
              break;
          }
        },
        error: (error: HttpErrorResponse) => {
          this.httpErrorService.handleError(error);
        },
      });
  }
}
