# Flujo de upload seguro de facturas

## Objetivo

Permitir que un usuario autenticado suba una factura PDF de forma segura sin enviar el archivo directamente al backend.

## Servicios involucrados

- Angular frontend
- Spring Boot backend
- Amazon S3
- Amazon DynamoDB
- Amazon Cognito

## Flujo funcional

1. El usuario inicia sesión con Cognito.
2. El usuario selecciona un archivo PDF desde el frontend.
3. El frontend valida:
   - que el archivo sea PDF
   - que el tamaño no supere 10 MB
4. El frontend llama a `POST /api/uploads/presign`.
5. El backend valida la solicitud y genera:
   - `invoiceId`
   - `objectKey`
   - `uploadUrl` prefirmada
6. El frontend usa la `uploadUrl` para subir el archivo directamente a S3 con método `PUT`.
7. Cuando el upload finaliza correctamente, el frontend llama a `POST /api/invoices/register`.
8. El backend valida:
   - usuario autenticado
   - tipo de archivo permitido
   - tamaño máximo
   - estructura esperada de `objectKey`
   - existencia real del objeto en S3
9. El backend registra la metadata en DynamoDB con estado `UPLOADED`.

## Endpoints implementados

### `POST /api/uploads/presign`

Genera una URL prefirmada para subir una factura PDF a S3.

#### Request

{
  "fileName": "factura.pdf",
  "contentType": "application/pdf",
  "sizeBytes": 245123
}

#### Response
# Flujo de upload seguro de facturas

## Objetivo

Permitir que un usuario autenticado suba una factura PDF de forma segura sin enviar el archivo directamente al backend.

## Servicios involucrados

- Angular frontend
- Spring Boot backend
- Amazon S3
- Amazon DynamoDB
- Amazon Cognito

## Flujo funcional

1. El usuario inicia sesión con Cognito.
2. El usuario selecciona un archivo PDF desde el frontend.
3. El frontend valida:
   - que el archivo sea PDF
   - que el tamaño no supere 10 MB
4. El frontend llama a `POST /api/uploads/presign`.
5. El backend valida la solicitud y genera:
   - `invoiceId`
   - `objectKey`
   - `uploadUrl` prefirmada
6. El frontend usa la `uploadUrl` para subir el archivo directamente a S3 con método `PUT`.
7. Cuando el upload finaliza correctamente, el frontend llama a `POST /api/invoices/register`.
8. El backend valida:
   - usuario autenticado
   - tipo de archivo permitido
   - tamaño máximo
   - estructura esperada de `objectKey`
   - existencia real del objeto en S3
9. El backend registra la metadata en DynamoDB con estado `UPLOADED`.
