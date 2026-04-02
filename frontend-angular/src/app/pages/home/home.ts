import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { JsonPipe, NgClass, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize, filter, map, switchMap, tap } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import {
  InvoiceUploadService,
  RegisterInvoiceRequest,
} from '../../core/services/invoice-upload.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrl: './home.css',
  imports: [NgIf, NgClass, JsonPipe, RouterLink],
})
export class Home {
  private readonly http = inject(HttpClient);
  private readonly invoiceUploadService = inject(InvoiceUploadService);
  private readonly cdr = inject(ChangeDetectorRef);
  protected readonly authService = inject(AuthService);

  protected meResponse: unknown = null;
  protected errorMessage = '';
  protected isCallingMe = false;

  protected selectedFile: File | null = null;
  protected uploadErrorMessage = '';
  protected uploadSuccessMessage = '';
  protected uploadProgress = 0;

  protected isRequestingPresign = false;
  protected isUploadingFile = false;
  protected isRegisteringInvoice = false;

  protected uploadedInvoiceId = '';
  protected uploadedObjectKey = '';

  private readonly isDevModeEnabled = true;

  callMe(): void {
    this.errorMessage = '';
    this.meResponse = null;
    this.isCallingMe = true;
    this.cdr.detectChanges();

    this.http.get(`${this.authService.getApiBaseUrl()}/api/me`).subscribe({
      next: (response) => {
        this.meResponse = response;
        this.isCallingMe = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.meResponse = null;
        this.isCallingMe = false;

        if (error.status === 401) {
          this.errorMessage = 'La sesión no es válida o expiró. Inicia sesión nuevamente.';
          this.authService.clearSession();
        } else {
          this.logError('/api/me error', error);
          this.errorMessage = `Error calling /api/me: ${error.status}`;
        }

        this.cdr.detectChanges();
      },
    });
  }

  private logDebug(message: string, data?: unknown): void {
    if (!this.isDevModeEnabled) {
      return;
    }

    if (data !== undefined) {
      console.log(`[home] ${message}`, data);
      return;
    }

    console.log(`[home] ${message}`);
  }

  private logError(message: string, error: unknown): void {
    if (!this.isDevModeEnabled) {
      return;
    }

    console.error(`[home] ${message}`, error);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.resetUploadMessages();
    this.uploadProgress = 0;
    this.uploadedInvoiceId = '';
    this.uploadedObjectKey = '';

    if (!file) {
      this.selectedFile = null;
      this.cdr.detectChanges();
      return;
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      this.selectedFile = null;
      this.uploadErrorMessage = 'Solo se permiten archivos PDF.';
      input.value = '';
      this.cdr.detectChanges();
      return;
    }

    if (file.type && file.type !== 'application/pdf') {
      this.selectedFile = null;
      this.uploadErrorMessage = 'El archivo debe tener content type application/pdf.';
      input.value = '';
      this.cdr.detectChanges();
      return;
    }

    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      this.selectedFile = null;
      this.uploadErrorMessage = 'El archivo supera el tamaño máximo permitido de 10 MB.';
      input.value = '';
      this.cdr.detectChanges();
      return;
    }

    this.logDebug('file selected', {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    this.selectedFile = file;
    this.cdr.detectChanges();
  }

  uploadInvoice(): void {
    if (!this.selectedFile) {
      this.uploadErrorMessage = 'Selecciona un archivo PDF antes de continuar.';
      this.cdr.detectChanges();
      return;
    }

    if (!this.authService.isAuthenticated()) {
      this.uploadErrorMessage = 'Debes iniciar sesión para subir una factura.';
      this.cdr.detectChanges();
      return;
    }

    const file = this.selectedFile;
    const startedAt = performance.now();

    this.resetUploadMessages();
    this.uploadProgress = 0;
    this.uploadedInvoiceId = '';
    this.uploadedObjectKey = '';
    this.isRequestingPresign = true;
    this.isUploadingFile = false;
    this.isRegisteringInvoice = false;
    this.cdr.detectChanges();

    this.logDebug('uploadInvoice() started', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      authenticated: this.authService.isAuthenticated(),
    });

    this.invoiceUploadService.createPresignedUpload(file).pipe(
      tap((presignResponse) => {
        this.isRequestingPresign = false;
        this.isUploadingFile = true;
        this.cdr.detectChanges();

        this.logDebug('Presigned URL received', {
          invoiceId: presignResponse.invoiceId,
          objectKey: presignResponse.objectKey,
        });
      }),
      switchMap((presignResponse) =>
        this.invoiceUploadService.uploadFileToS3(presignResponse.uploadUrl, file).pipe(
          tap((event) => {
            if (event.type === HttpEventType.UploadProgress) {
              const total = event.total ?? file.size;
              if (total > 0) {
                this.uploadProgress = Math.round((event.loaded / total) * 100);
              }
              this.cdr.detectChanges();

              this.logDebug('S3 upload progress', {
                loaded: event.loaded,
                total,
                progress: this.uploadProgress,
              });
            }
          }),
          filter((event) => event.type === HttpEventType.Response),
          tap(() => {
            this.isUploadingFile = false;
            this.isRegisteringInvoice = true;
            this.uploadProgress = 100;
            this.cdr.detectChanges();

            this.logDebug('S3 upload completed');
          }),
          map(() => presignResponse)
        )
      ),
      switchMap((presignResponse) => {
        const registerPayload: RegisterInvoiceRequest = {
          invoiceId: presignResponse.invoiceId,
          objectKey: presignResponse.objectKey,
          originalFileName: file.name,
          contentType: file.type || 'application/pdf',
          sizeBytes: file.size,
        };

        this.logDebug('Register payload created', registerPayload);

        return this.invoiceUploadService.registerInvoice(registerPayload).pipe(
          map((registerResponse) => ({ registerResponse, presignResponse }))
        );
      }),
      finalize(() => {
        this.isRequestingPresign = false;
        this.isUploadingFile = false;
        this.isRegisteringInvoice = false;
        this.cdr.detectChanges();

        const durationMs = Math.round(performance.now() - startedAt);
        this.logDebug('uploadInvoice() finished', {
          durationMs,
          isRequestingPresign: this.isRequestingPresign,
          isUploadingFile: this.isUploadingFile,
          isRegisteringInvoice: this.isRegisteringInvoice,
        });
      })
    ).subscribe({
      next: ({ registerResponse, presignResponse }) => {
        this.uploadSuccessMessage = `Factura registrada correctamente con estado ${registerResponse.status}.`;
        this.uploadedInvoiceId = registerResponse.invoiceId;
        this.uploadedObjectKey = presignResponse.objectKey;
        this.selectedFile = null;
        this.cdr.detectChanges();

        this.logDebug('Invoice registered successfully', registerResponse);
      },
      error: (error) => {
        if (error.status === 401) {
          this.authService.clearSession();
          this.uploadErrorMessage = 'Tu sesión expiró. Inicia sesión nuevamente antes de subir la factura.';
        } else {
          this.uploadErrorMessage = this.buildApiErrorMessage(
            error,
            'Ocurrió un error durante la carga de la factura.'
          );
        }

        this.cdr.detectChanges();
        this.logError('Upload flow error', error);
      },
    });
  }

  logout(): void {
    this.authService.logout();
  }

  protected get isBusy(): boolean {
    return this.isRequestingPresign || this.isUploadingFile || this.isRegisteringInvoice;
  }

  protected get selectedFileName(): string {
    return this.selectedFile?.name ?? 'Ningún archivo seleccionado';
  }

  protected get selectedFileSizeLabel(): string {
    if (!this.selectedFile) {
      return '-';
    }

    const sizeInKb = this.selectedFile.size / 1024;
    if (sizeInKb < 1024) {
      return `${sizeInKb.toFixed(1)} KB`;
    }

    return `${(sizeInKb / 1024).toFixed(2)} MB`;
  }

  protected get uploadStatusLabel(): string {
    if (this.isRequestingPresign) {
      return 'Solicitando URL segura de carga al backend...';
    }

    if (this.isUploadingFile) {
      return `Subiendo archivo a S3... ${this.uploadProgress}%`;
    }

    if (this.isRegisteringInvoice) {
      return 'Registrando factura en DynamoDB...';
    }

    if (this.uploadSuccessMessage) {
      return 'Proceso completado correctamente.';
    }

    if (this.uploadErrorMessage) {
      return 'Ocurrió un error durante la carga.';
    }

    return 'Listo para cargar una factura PDF.';
  }

  private resetUploadMessages(): void {
    this.uploadErrorMessage = '';
    this.uploadSuccessMessage = '';
  }

  private buildApiErrorMessage(error: { status?: number; error?: unknown }, fallback: string): string {
    const message =
      typeof error?.error === 'object' &&
      error?.error !== null &&
      'message' in error.error &&
      typeof (error.error as { message?: unknown }).message === 'string'
        ? (error.error as { message: string }).message
        : fallback;

    return `${message} Código: ${error.status ?? 'desconocido'}.`;
  }
}
