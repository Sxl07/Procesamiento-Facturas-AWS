# Procesamiento de Facturas AWS

Mono-repo del proyecto **Procesamiento de facturas con IA y chatbot conversacional en AWS**.

El objetivo es construir una solución full stack con **Angular + Spring Boot + AWS** para:

- cargar facturas en PDF de forma segura,
- extraer datos financieros con IA,
- validar reglas de negocio,
- almacenar e indexar resultados,
- consultar facturas mediante búsqueda y chatbot,
- aplicar buenas prácticas de seguridad, observabilidad, gobernanza y control de costos.

---

## Estado actual

### Fase 0 completada
Se dejó preparada la base del proyecto para comenzar la implementación:

- definición del alcance inicial del producto,
- organización del mono-repo,
- estrategia de ramas,
- convención de commits,
- lineamientos de flujo de trabajo,
- estructura inicial de documentación,
- base para infraestructura como código,
- lineamientos de seguridad, costos y gobernanza.

---

## Arquitectura objetivo v1

La versión inicial del proyecto estará compuesta por:

- **Frontend**: Angular
- **Backend**: Spring Boot
- **Autenticación**: Amazon Cognito
- **Almacenamiento de documentos**: Amazon S3
- **Extracción de datos**: Amazon Textract
- **Persistencia operacional**: Amazon DynamoDB
- **Búsqueda**: Amazon OpenSearch Service
- **Chatbot**: Amazon Lex
- **Observabilidad y auditoría**: Amazon CloudWatch y AWS CloudTrail
- **Control de costos**: AWS Budgets

---

## Objetivo funcional del proyecto

El flujo principal esperado es:

1. El usuario inicia sesión.
2. El usuario carga una factura en PDF.
3. El archivo se almacena en Amazon S3.
4. Un proceso automático extrae los datos con Amazon Textract.
5. Se validan reglas de negocio.
6. Se guarda el resultado estructurado.
7. Se indexan metadatos para búsqueda.
8. El usuario puede consultar facturas desde la interfaz o mediante chatbot.

---

## Estructura del repositorio

Procesamiento-Facturas-AWS/
├── docs/
├── infra/
├── frontend-angular/
├── backend-springboot/
├── lambda-invoice-processor/
├── lambda-lex-fulfillment/
└── .github/