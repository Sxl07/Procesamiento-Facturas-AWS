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

  private get apiBaseUrl(): string {
    return this.authService.getApiBaseUrl();
  }

  createPresignedUpload(file: File): Observable<PresignUploadResponse> {
    const payload: PresignUploadRequest = {
      fileName: file.name,
      contentType: file.type || 'application/pdf',
      sizeBytes: file.size,
    };

    console.log('[upload-service] POST /api/uploads/presign -> request', payload);

    return this.http.post<PresignUploadResponse>(
      `${this.apiBaseUrl}/api/uploads/presign`,
      payload
    ).pipe(
      tap({
        next: (response) => console.log('[upload-service] POST /api/uploads/presign <- response', response),
        error: (error) => console.error('[upload-service] POST /api/uploads/presign <- error', error),
      })
    );
  }

  uploadFileToS3(uploadUrl: string, file: File): Observable<HttpEvent<string>> {
    console.log('[upload-service] PUT S3 upload -> start', {
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
        next: (event) => console.log('[upload-service] PUT S3 upload <- event', event),
        error: (error) => console.error('[upload-service] PUT S3 upload <- error', error),
      })
    );
  }

  registerInvoice(payload: RegisterInvoiceRequest): Observable<RegisterInvoiceResponse> {
    console.log('[upload-service] POST /api/invoices/register -> request', payload);

    return this.http.post<RegisterInvoiceResponse>(
      `${this.apiBaseUrl}/api/invoices/register`,
      payload
    ).pipe(
      tap({
        next: (response) => console.log('[upload-service] POST /api/invoices/register <- response', response),
        error: (error) => console.error('[upload-service] POST /api/invoices/register <- error', error),
      })
    );
  }
}