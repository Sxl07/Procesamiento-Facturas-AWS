import { Component, inject } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { JsonPipe, NgClass, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
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

  callMe(): void {
    this.errorMessage = '';
    this.meResponse = null;
    this.isCallingMe = true;

    this.http.get(`${this.authService.getApiBaseUrl()}/api/me`).subscribe({
      next: (response) => {
        this.meResponse = response;
        this.isCallingMe = false;
      },
      error: (error) => {
        this.meResponse = null;
        this.isCallingMe = false;

        if (error.status === 401) {
          this.errorMessage = 'La sesión no es válida o expiró. Inicia sesión nuevamente.';
          this.authService.clearSession();
          return;
        }
        console.error('[home] presign error', error);
        this.errorMessage = `Error calling /api/me: ${error.status}`;
      },
    });
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
      return;
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      this.selectedFile = null;
      this.uploadErrorMessage = 'Solo se permiten archivos PDF.';
      input.value = '';
      return;
    }

    if (file.type && file.type !== 'application/pdf') {
      this.selectedFile = null;
      this.uploadErrorMessage = 'El archivo debe tener content type application/pdf.';
      input.value = '';
      return;
    }

    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      this.selectedFile = null;
      this.uploadErrorMessage = 'El archivo supera el tamaño máximo permitido de 10 MB.';
      input.value = '';
      return;
    }
    console.log('[home] file selected', {
  name: file.name,
  size: file.size,
  type: file.type,
});
    this.selectedFile = file;
  }

  uploadInvoice(): void {
    if (!this.selectedFile) {
      this.uploadErrorMessage = 'Selecciona un archivo PDF antes de continuar.';
      return;
    }

    if (!this.authService.isAuthenticated()) {
      this.uploadErrorMessage = 'Debes iniciar sesión para subir una factura.';
      return;
    }

    const file = this.selectedFile;
    console.log('[home] uploadInvoice() started', {
  fileName: file.name,
  fileSize: file.size,
  fileType: file.type,
  authenticated: this.authService.isAuthenticated(),
});
    this.resetUploadMessages();
    this.uploadProgress = 0;
    this.isRequestingPresign = true;
    console.log('[home] requesting presigned URL...');
    this.invoiceUploadService.createPresignedUpload(file).subscribe({
      next: (presignResponse) => {
        console.log('[home] presigned URL received', presignResponse);
        this.isRequestingPresign = false;
        this.isUploadingFile = true;
        console.log('[home] starting S3 upload...');
        this.invoiceUploadService.uploadFileToS3(presignResponse.uploadUrl, file).subscribe({
          next: (event) => {
            if (event.type === HttpEventType.UploadProgress) {
              console.log('[home] S3 upload progress', {
  loaded: event.loaded,
  total: event.total,
});
              const total = event.total ?? file.size;
              if (total > 0) {
                this.uploadProgress = Math.round((event.loaded / total) * 100);
              }
            }

            if (event.type === HttpEventType.Response) {
              console.log('[home] S3 upload completed, starting register...');
              this.isUploadingFile = false;
              this.isRegisteringInvoice = true;
              this.uploadProgress = 100;

              const registerPayload: RegisterInvoiceRequest = {
                invoiceId: presignResponse.invoiceId,
                objectKey: presignResponse.objectKey,
                originalFileName: file.name,
                contentType: file.type || 'application/pdf',
                sizeBytes: file.size,
              };

              this.invoiceUploadService.registerInvoice(registerPayload).subscribe({
                next: (registerResponse) => {
                  console.log('[home] invoice registered successfully', registerResponse);
                  this.isRegisteringInvoice = false;
                  this.uploadSuccessMessage = `Factura registrada correctamente con estado ${registerResponse.status}.`;
                  this.uploadedInvoiceId = registerResponse.invoiceId;
                  this.uploadedObjectKey = presignResponse.objectKey;
                  this.selectedFile = null;
                },
                error: (error) => {
                  this.isRegisteringInvoice = false;
                  this.uploadErrorMessage = this.buildApiErrorMessage(
                    error,
                    'No se pudo registrar la factura en DynamoDB.'
                  );
                  console.error('[home] S3 upload error', error);
                },
                
              });
            }
          },
          error: (error) => {
            this.isUploadingFile = false;
            this.uploadErrorMessage = `No se pudo subir el archivo a S3. Código: ${error.status || 'desconocido'}.`;
            console.error('[home] register error', error);
          },
        }
      );
      },
      error: (error) => {
        this.isRequestingPresign = false;
        console.error('[home] /api/me error', error);

        if (error.status === 401) {
          this.authService.clearSession();
          this.uploadErrorMessage = 'Tu sesión expiró. Inicia sesión nuevamente antes de subir la factura.';
          return;
        }

        this.uploadErrorMessage = this.buildApiErrorMessage(
          error,
          'No se pudo obtener la URL prefirmada.'
        );
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
      return 'Solicitando URL segura de carga...';
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