import config from '../config/index.js'

class CloudinaryService {
  constructor() {
    this.apiKey = config.cloudinary.apiKey
    this.cloudName = config.cloudinary.cloudName
    this.uploadPreset = config.cloudinary.uploadPreset
    this.uploadUrl = config.cloudinary.uploadUrl
    
    // Validate configuration on initialization
    this.validateConfig()
  }

  /**
   * Validate Cloudinary configuration
   */
  validateConfig() {
    const missingConfig = []
    if (!this.cloudName) missingConfig.push('VITE_CLOUDINARY_CLOUD_NAME')
    if (!this.uploadPreset) missingConfig.push('VITE_CLOUDINARY_UPLOAD_PRESET')
    
    if (missingConfig.length > 0) {
      console.error('Missing Cloudinary configuration:', missingConfig)
      throw new Error(`Missing required Cloudinary configuration: ${missingConfig.join(', ')}`)
    }
  }

  /**
   * Upload a file to Cloudinary
   * @param {File} file - The file to upload
   * @param {Object} options - Upload options
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} Upload result
   */
  async uploadFile(file, options = {}, onProgress = null) {
    try {
      this.validateConfig()
    } catch (error) {
      throw new Error(`Cloudinary configuration error: ${error.message}`)
    }

    const formData = new FormData()

    // Add required fields for unsigned upload
    formData.append('file', file)
    formData.append('upload_preset', this.uploadPreset)
    
    // Only add API key if it's available (for signed uploads)
    if (this.apiKey) {
      formData.append('api_key', this.apiKey)
    }

    // Add optional fields
    if (options.folder) {
      formData.append('folder', options.folder)
    }

    if (options.public_id) {
      formData.append('public_id', options.public_id)
    }

    // Auto-transform documents and PDFs to images for better compatibility
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      // PDFs should be uploaded as images with auto transformation
      formData.append('resource_type', 'image')
      formData.append('format', 'jpg') // Convert PDFs to JPG for better web compatibility
    } else if (file.type.startsWith('image/')) {
      formData.append('resource_type', 'image')
    } else if (file.type.startsWith('video/')) {
      formData.append('resource_type', 'video')
    } else {
      // For other documents, use auto resource type
      formData.append('resource_type', 'auto')
    }

    try {
      console.log('Starting Cloudinary upload:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        cloudName: this.cloudName,
        uploadPreset: this.uploadPreset,
        folder: options.folder
      })

      // Add timeout to prevent hanging uploads
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 300000) // 5 minutes timeout

      const response = await fetch(this.uploadUrl, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        // Add headers for better CORS compatibility
        headers: {
          'Accept': 'application/json',
        }
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        let errorMessage = `Upload failed with status ${response.status}`
        try {
          const errorData = await response.json()
          console.error('Cloudinary error response:', errorData)
          errorMessage = errorData.error?.message || errorMessage
          
          // Handle specific Cloudinary errors
          if (errorData.error?.message?.includes('File size too large')) {
            errorMessage = 'File is too large. Please select a smaller file.'
          } else if (errorData.error?.message?.includes('Invalid file format')) {
            errorMessage = 'Unsupported file format. Please select PDF, image, or document files.'
          } else if (errorData.error?.message?.includes('Upload preset') || errorData.error?.message?.includes('preset')) {
            errorMessage = 'Upload configuration error. Please contact the administrator.'
          } else if (errorData.error?.message?.includes('Invalid API key')) {
            errorMessage = 'Authentication error. Please contact the administrator.'
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log('Cloudinary upload successful:', {
        publicId: result.public_id,
        url: result.secure_url,
        format: result.format,
        bytes: result.bytes
      })

      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        resourceType: result.resource_type,
        originalFilename: result.original_filename
      }
    } catch (error) {
      console.error('Cloudinary upload error:', error)
      
      // Handle specific error types
      if (error.name === 'AbortError') {
        throw new Error('Upload timed out. Please try again with a smaller file or check your connection.')
      } else if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError') || error.name === 'TypeError') {
        throw new Error('Network error. Please check your connection and try again.')
      } else if (error.message?.includes('CORS')) {
        throw new Error('Upload service configuration error. Please contact the administrator.')
      }
      
      throw error
    }
  }

  /**
   * Delete a file from Cloudinary
   * @param {string} publicId - The public ID of the file to delete
   * @param {string} resourceType - The resource type (image, video, raw). If not provided, will be auto-detected
   * @returns {Promise<Object>} Delete result
   */
  async deleteFile(publicId, resourceType = null) {
    // Auto-detect resource type if not provided
    if (!resourceType) {
      // Check file extension first (most reliable)
      if (publicId.match(/\.(jpg|jpeg|png|gif|webp|bmp|tiff?|svg)$/i)) {
        resourceType = 'image'
      } else if (publicId.match(/\.(mp4|avi|mov|wmv|flv|webm|mkv|mp3|wav|ogg)$/i)) {
        resourceType = 'video'
      } else {
        // Default to raw for documents, PDFs, and other files
        resourceType = 'raw'
      }
    }

    const deleteUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/${resourceType}/destroy`

    const formData = new FormData()
    formData.append('public_id', publicId)
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
   * Generate Cloudinary URL for optimization and display
   * @param {string} publicId - Public ID
   * @param {Object} transformations - Transformation options
   * @returns {string} Optimized URL
   */
  generateOptimizedUrl(publicId, transformations = {}) {
    if (!publicId || !this.cloudName) {
      console.warn('Cannot generate URL: missing publicId or cloudName')
      return ''
    }

    // Determine resource type from public ID or transformations
    let resourceType = transformations.resourceType || 'image'
    
    // Auto-detect resource type from public ID patterns
    if (publicId.includes('study-materials') || publicId.includes('study_materials')) {
      resourceType = 'image' // Study materials are stored as images in Cloudinary
    }

    const baseUrl = `https://res.cloudinary.com/${this.cloudName}/${resourceType}/upload/`

    let transformationString = ''

    // Add quality optimization for all images
    if (resourceType === 'image') {
      transformationString += 'q_auto,f_auto,'
    }

    if (transformations.width) transformationString += `w_${transformations.width},`
    if (transformations.height) transformationString += `h_${transformations.height},`
    if (transformations.quality && !transformationString.includes('q_auto')) {
      transformationString += `q_${transformations.quality},`
    }
    if (transformations.format && !transformationString.includes('f_auto')) {
      transformationString += `f_${transformations.format},`
    }
    if (transformations.crop) transformationString += `c_${transformations.crop},`

    // Remove trailing comma
    transformationString = transformationString.replace(/,$/, '')

    // Add transformation string only if not empty
    const finalUrl = transformationString 
      ? `${baseUrl}${transformationString}/${publicId}`
      : `${baseUrl}${publicId}`

    return finalUrl
  }

  /**
   * Generate Cloudinary download URL
   * @param {string} publicId - Public ID of the file
   * @param {string} resourceType - Resource type (image, video, raw). If not provided, will be auto-detected
   * @param {string} filename - Optional filename for download
   * @returns {string} Download URL
   */
  generateDownloadUrl(publicId, resourceType = null, filename = null) {
    if (!publicId || !this.cloudName) {
      console.warn('Cannot generate download URL: missing publicId or cloudName')
      return ''
    }

    // Auto-detect resource type if not provided
    if (!resourceType) {
      if (publicId.includes('study-materials') || publicId.includes('study_materials')) {
        // Study materials are typically stored as images in Cloudinary
        resourceType = 'image'
      } else if (publicId.match(/\.(jpg|jpeg|png|gif|webp|bmp|tiff?|svg)$/i)) {
        resourceType = 'image'
      } else if (publicId.match(/\.(mp4|avi|mov|wmv|flv|webm|mkv|mp3|wav|ogg)$/i)) {
        resourceType = 'video'
      } else {
        // Default to image for documents transformed by Cloudinary
        resourceType = 'image'
      }
    }

    const baseUrl = `https://res.cloudinary.com/${this.cloudName}/${resourceType}/upload/`

    // Add fl_attachment to force download
    let transformationString = 'fl_attachment'

    // Add filename if provided
    if (filename) {
      transformationString += `,fn_${encodeURIComponent(filename)}`
    }

    return `${baseUrl}${transformationString}/${publicId}`
  }

  /**
   * Generate a simple display URL for images
   * @param {string} publicId - Public ID
   * @param {Object} options - Display options
   * @returns {string} Display URL
   */
  generateDisplayUrl(publicId, options = {}) {
    if (!publicId || !this.cloudName) {
      return ''
    }

    return this.generateOptimizedUrl(publicId, {
      resourceType: 'image',
      quality: 'auto',
      format: 'auto',
      ...options
    })
  }
}

export default new CloudinaryService()