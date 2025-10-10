import config from '../config/index.js'

class CloudinaryService {
  constructor() {
    this.apiKey = config.cloudinary.apiKey
    this.cloudName = config.cloudinary.cloudName
    this.uploadPreset = config.cloudinary.uploadPreset
    this.uploadUrl = config.cloudinary.uploadUrl
  }

  /**
   * Upload a file to Cloudinary
   * @param {File} file - The file to upload
   * @param {Object} options - Upload options
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} Upload result
   */
  async uploadFile(file, options = {}, onProgress = null) {
    const formData = new FormData()

    // Add required fields
    formData.append('file', file)
    formData.append('upload_preset', this.uploadPreset)
    formData.append('api_key', this.apiKey)

    // Add optional fields
    if (options.folder) {
      formData.append('folder', options.folder)
    }

    if (options.public_id) {
      formData.append('public_id', options.public_id)
    }

    // Set resource type based on file type
    if (file.type.startsWith('image/')) {
      formData.append('resource_type', 'image')
    } else if (file.type.startsWith('video/')) {
      formData.append('resource_type', 'video')
    } else {
      formData.append('resource_type', 'raw')
    }

    try {
      const response = await fetch(this.uploadUrl, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Upload failed')
      }

      const result = await response.json()
      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        resourceType: result.resource_type
      }
    } catch (error) {
      console.error('Cloudinary upload error:', error)
      throw error
    }
  }

  /**
   * Delete a file from Cloudinary
   * @param {string} publicId - The public ID of the file to delete
   * @param {string} resourceType - The resource type (image, video, raw)
   * @returns {Promise<Object>} Delete result
   */
  async deleteFile(publicId, resourceType = 'image') {
    const deleteUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/${resourceType}/destroy`

    const formData = new FormData()
    formData.append('public_id', publicId)
    formData.append('upload_preset', this.uploadPreset)
    formData.append('api_key', this.apiKey)

    try {
      const response = await fetch(deleteUrl, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Delete failed')
      }

      const result = await response.json()
      return {
        success: result.result === 'ok',
        result: result.result
      }
    } catch (error) {
      console.error('Cloudinary delete error:', error)
      throw error
    }
  }

  /**
   * Extract public ID from Cloudinary URL
   * @param {string} url - Cloudinary URL
   * @returns {string} Public ID
   */
  extractPublicId(url) {
    try {
      const urlParts = url.split('/')
      const filename = urlParts[urlParts.length - 1]
      const publicId = filename.split('.')[0]
      return publicId
    } catch (error) {
      console.error('Error extracting public ID:', error)
      return null
    }
  }

  /**
   * Generate Cloudinary URL for optimization
   * @param {string} publicId - Public ID
   * @param {Object} transformations - Transformation options
   * @returns {string} Optimized URL
   */
  generateOptimizedUrl(publicId, transformations = {}) {
    const baseUrl = `https://res.cloudinary.com/${this.cloudName}/image/upload/`

    let transformationString = ''

    if (transformations.width) transformationString += `w_${transformations.width},`
    if (transformations.height) transformationString += `h_${transformations.height},`
    if (transformations.quality) transformationString += `q_${transformations.quality},`
    if (transformations.format) transformationString += `f_${transformations.format},`

    // Remove trailing comma
    transformationString = transformationString.replace(/,$/, '')

    return `${baseUrl}${transformationString}/${publicId}`
  }
}

export default new CloudinaryService()