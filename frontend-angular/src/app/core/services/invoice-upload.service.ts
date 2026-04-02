import { HttpClient, HttpEvent, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AuthService } from './auth.service';

export interface PresignUploadRequest {
  fileName: string;
  contentType: string;
  sizeBytes: number;
}

export interface PresignUploadResponse {
  invoiceId: string;
  objectKey: string;
  uploadUrl: string;
  expiresInSeconds: number;
}

export interface RegisterInvoiceRequest {
  invoiceId: string;
  objectKey: string;
  originalFileName: string;
  contentType: string;
  sizeBytes: number;
}

export interface RegisterInvoiceResponse {
  invoiceId: string;
  status: string;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class InvoiceUploadService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private readonly isDevModeEnabled = true;

  private get apiBaseUrl(): string {
    return this.authService.getApiBaseUrl();
  }

  private logDebug(message: string, data?: unknown): void {
    if (!this.isDevModeEnabled) {
      return;
    }

    if (data !== undefined) {
      console.log(`[upload-service] ${message}`, data);
      return;
    }

    console.log(`[upload-service] ${message}`);
  }

  private logError(message: string, error: unknown): void {
    if (!this.isDevModeEnabled) {
      return;
    }

    console.error(`[upload-service] ${message}`, error);
  }

  createPresignedUpload(file: File): Observable<PresignUploadResponse> {
    const payload: PresignUploadRequest = {
      fileName: file.name,
      contentType: file.type || 'application/pdf',
      sizeBytes: file.size,
    };

    this.logDebug('POST /api/uploads/presign -> request', payload);

    return this.http.post<PresignUploadResponse>(
      `${this.apiBaseUrl}/api/uploads/presign`,
      payload
    ).pipe(
      tap({
        next: (response) => this.logDebug('POST /api/uploads/presign <- response', response),
        error: (error) => this.logError('POST /api/uploads/presign <- error', error),
      })
    );
  }

  uploadFileToS3(uploadUrl: string, file: File): Observable<HttpEvent<string>> {
    this.logDebug('PUT S3 upload -> start', {
      uploadUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || 'application/pdf',
    });

    return this.http.put(uploadUrl, file, {
      headers: new HttpHeaders({
        'Content-Type': file.type || 'application/pdf',
      }),
      observe: 'events',
      reportProgress: true,
      responseType: 'text',
    }).pipe(
      tap({
        next: (event) => this.logDebug('PUT S3 upload <- event', event),
        error: (error) => this.logError('PUT S3 upload <- error', error),
      })
    );
  }

  registerInvoice(payload: RegisterInvoiceRequest): Observable<RegisterInvoiceResponse> {
    this.logDebug('POST /api/invoices/register -> request', payload);

    return this.http.post<RegisterInvoiceResponse>(
      `${this.apiBaseUrl}/api/invoices/register`,
      payload
    ).pipe(
      tap({
        next: (response) => this.logDebug('POST /api/invoices/register <- response', response),
        error: (error) => this.logError('POST /api/invoices/register <- error', error),
      })
    );
  }
}
