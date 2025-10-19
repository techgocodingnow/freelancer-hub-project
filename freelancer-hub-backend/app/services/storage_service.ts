import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import env from '#start/env'

/**
 * Storage Service for managing file uploads to Backblaze B2 using S3-compatible API
 */

export class StorageService {
  private client: S3Client | null
  private bucketName: string | null

  constructor() {
    const endpoint = env.get('B2_ENDPOINT')
    const region = env.get('B2_REGION')
    const accessKeyId = env.get('B2_ACCESS_KEY_ID')
    const secretAccessKey = env.get('B2_SECRET_ACCESS_KEY')
    this.bucketName = env.get('B2_BUCKET_NAME')

    // Initialize S3 client if all required config is present
    if (endpoint && region && accessKeyId && secretAccessKey && this.bucketName) {
      this.client = new S3Client({
        endpoint,
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      })
    } else {
      this.client = null
    }
  }

  /**
   * Check if B2 storage is configured
   */
  isConfigured(): boolean {
    return this.client !== null && this.bucketName !== null
  }

  /**
   * Upload invoice PDF to B2 storage
   * @param tenantId - Tenant ID for path organization
   * @param invoiceNumber - Invoice number for file naming
   * @param pdfBuffer - PDF file content as Buffer
   * @returns Object key (S3 path) of uploaded file
   */
  async uploadInvoicePDF(
    tenantId: number,
    invoiceNumber: string,
    pdfBuffer: Buffer
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('B2 storage is not configured')
    }

    if (!tenantId || !invoiceNumber || !pdfBuffer) {
      throw new Error('Invalid upload parameters: tenantId, invoiceNumber, and pdfBuffer are required')
    }

    const objectKey = `invoices/${tenantId}/${invoiceNumber}.pdf`

    const command = new PutObjectCommand({
      Bucket: this.bucketName!,
      Key: objectKey,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
      Metadata: {
        tenantId: String(tenantId),
        invoiceNumber,
        uploadedAt: new Date().toISOString(),
      },
    })

    await this.client!.send(command)

    return objectKey
  }

  /**
   * Generate presigned URL for temporary access to PDF
   * @param objectKey - S3 object key (path)
   * @param expiresIn - URL expiration time in seconds (default 24 hours)
   * @returns Presigned URL
   */
  async getPresignedUrl(objectKey: string, expiresIn: number = 86400): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('B2 storage is not configured')
    }

    const command = new GetObjectCommand({
      Bucket: this.bucketName!,
      Key: objectKey,
    })

    const presignedUrl = await getSignedUrl(this.client!, command, { expiresIn })

    return presignedUrl
  }

  /**
   * Delete PDF from B2 storage
   * @param objectKey - S3 object key (path) to delete
   */
  async deleteInvoicePDF(objectKey: string): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('B2 storage is not configured')
    }

    const command = new DeleteObjectCommand({
      Bucket: this.bucketName!,
      Key: objectKey,
    })

    await this.client!.send(command)
  }

  /**
   * Download PDF from B2 storage as Buffer
   * @param objectKey - S3 object key (path) to download
   * @returns PDF content as Buffer
   */
  async downloadPDF(objectKey: string): Promise<Buffer> {
    if (!this.isConfigured()) {
      throw new Error('B2 storage is not configured')
    }

    const command = new GetObjectCommand({
      Bucket: this.bucketName!,
      Key: objectKey,
    })

    const response = await this.client!.send(command)

    if (!response.Body) {
      throw new Error('No content received from B2 storage')
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = []
    for await (const chunk of response.Body as any) {
      chunks.push(chunk)
    }

    return Buffer.concat(chunks)
  }
}

export default new StorageService()
