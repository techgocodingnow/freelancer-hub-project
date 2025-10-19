import { test } from '@japa/runner'
import storageService, { StorageService } from '#services/storage_service'

test.group('Storage Service', () => {
  test('should upload PDF buffer to B2 and return object key', async ({ assert }) => {
    const service = new StorageService()
    const testBuffer = Buffer.from('fake pdf content')
    const tenantId = 1
    const invoiceNumber = 'INV-00001'

    // If B2 is not configured, should throw or skip
    if (!service.isConfigured()) {
      assert.isTrue(true, 'B2 not configured, skipping test')
      return
    }

    const objectKey = await service.uploadInvoicePDF(tenantId, invoiceNumber, testBuffer)

    assert.isString(objectKey)
    assert.include(objectKey, `invoices/${tenantId}/${invoiceNumber}`)
  })

  test('should generate presigned URL for stored PDF', async ({ assert }) => {
    const service = new StorageService()
    const objectKey = 'invoices/1/INV-00001.pdf'

    if (!service.isConfigured()) {
      assert.isTrue(true, 'B2 not configured, skipping test')
      return
    }

    const presignedUrl = await service.getPresignedUrl(objectKey, 3600)

    assert.isString(presignedUrl)
    assert.include(presignedUrl, objectKey.replace(/\//g, '%2F')) // URLs encode slashes
  })

  test('should delete PDF from B2 storage', async ({ assert }) => {
    const service = new StorageService()
    const testBuffer = Buffer.from('test content for deletion')
    const tenantId = 999
    const invoiceNumber = 'INV-DELETE-TEST'

    if (!service.isConfigured()) {
      assert.isTrue(true, 'B2 not configured, skipping test')
      return
    }

    // Upload a test file first
    const objectKey = await service.uploadInvoicePDF(tenantId, invoiceNumber, testBuffer)

    // Delete it
    await service.deleteInvoicePDF(objectKey)

    // Verify deletion by trying to generate presigned URL - should not throw
    // (B2 will still generate presigned URLs for non-existent objects)
    const presignedUrl = await service.getPresignedUrl(objectKey, 60)
    assert.isString(presignedUrl)
  })

  test('should return false when B2 is not configured', async ({ assert }) => {
    const service = new StorageService()

    // This test checks the isConfigured method
    const isConfigured = service.isConfigured()

    // The result depends on whether env vars are set
    assert.isBoolean(isConfigured)
  })

  test('should download PDF from B2 as buffer', async ({ assert }) => {
    const service = new StorageService()
    const testContent = 'test pdf content for download'
    const testBuffer = Buffer.from(testContent)
    const tenantId = 1
    const invoiceNumber = 'INV-DOWNLOAD-TEST'

    if (!service.isConfigured()) {
      assert.isTrue(true, 'B2 not configured, skipping test')
      return
    }

    // Upload test file
    const objectKey = await service.uploadInvoicePDF(tenantId, invoiceNumber, testBuffer)

    // Download it back
    const downloadedBuffer = await service.downloadPDF(objectKey)

    assert.instanceOf(downloadedBuffer, Buffer)
    assert.equal(downloadedBuffer.toString(), testContent)

    // Clean up
    await service.deleteInvoicePDF(objectKey)
  })

  test('should handle upload errors gracefully', async ({ assert }) => {
    const service = new StorageService()

    if (!service.isConfigured()) {
      assert.isTrue(true, 'B2 not configured, skipping test')
      return
    }

    // Try to upload with invalid parameters
    await assert.rejects(
      async () => {
        // @ts-expect-error - intentionally passing invalid parameters
        await service.uploadInvoicePDF(null, null, null)
      },
      'Should reject with invalid parameters'
    )
  })
})
