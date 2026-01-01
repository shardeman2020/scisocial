'use client'

import { useState, useRef } from 'react'

import { API_BASE_URL } from '../config/api'
interface ImageWithAlt {
  file: File
  preview: string
  altText: string
  loading: boolean
}

interface PostComposerProps {
  onPostCreated?: () => void
}

export default function PostComposer({ onPostCreated }: PostComposerProps) {
  const [doi, setDoi] = useState('')
  const [content, setContent] = useState('')
  const [images, setImages] = useState<ImageWithAlt[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle file selection from input
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const newImages: ImageWithAlt[] = []

    // Convert FileList to array and process each file
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return

      const reader = new FileReader()
      reader.onloadend = async () => {
        const preview = reader.result as string
        const imageData: ImageWithAlt = {
          file,
          preview,
          altText: '',
          loading: true,
        }

        // Add image to state immediately with loading state
        setImages(prev => [...prev, imageData])

        // Generate AI alt-text
        try {
          const formData = new FormData()
          formData.append('image', file)

          // Upload image first to get URL (you'll need an upload endpoint)
          // For now, we'll use a placeholder URL based on filename
          const imageUrl = `https://placeholder.com/${file.name}`

          const response = await fetch(`${API_BASE_URL}/ai/alt-text`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl }),
          })

          if (response.ok) {
            const data = await response.json()

            // Update the image with generated alt text
            setImages(prev =>
              prev.map(img =>
                img.file === file
                  ? { ...img, altText: data.altText, loading: false }
                  : img
              )
            )
          } else {
            throw new Error('Failed to generate alt text')
          }
        } catch (err) {
          console.error('Failed to generate alt text:', err)
          // Set a default alt text on error
          setImages(prev =>
            prev.map(img =>
              img.file === file
                ? { ...img, altText: 'Image description', loading: false }
                : img
            )
          )
        }
      }
      reader.readAsDataURL(file)
    })
  }

  // Handle drag and drop
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    handleFileSelect(files)
  }

  // Remove image from selection
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  // Update alt text for an image
  const updateAltText = (index: number, newAltText: string) => {
    setImages(prev =>
      prev.map((img, i) =>
        i === index ? { ...img, altText: newAltText } : img
      )
    )
  }

  // Submit the post
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Prepare images data (without file objects, just url and altText)
      // Note: In production, you'd upload images first to get URLs
      const imagesData = images.map(img => ({
        url: `https://placeholder.com/${img.file.name}`, // Replace with actual upload
        altText: img.altText || null,
      }))

      const response = await fetch(`${API_BASE_URL}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doi,
          content: content || 'AI-generated summary',
          images: imagesData.length > 0 ? imagesData : undefined,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create post')
      }

      // Reset form
      setDoi('')
      setContent('')
      setImages([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Notify parent component
      if (onPostCreated) {
        onPostCreated()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Create a Post</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* DOI Input */}
        <div>
          <label htmlFor="doi" className="block text-sm font-medium text-gray-700 mb-1">
            DOI (required)
          </label>
          <input
            type="text"
            id="doi"
            value={doi}
            onChange={(e) => setDoi(e.target.value)}
            placeholder="10.1234/example.doi"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Content Input (Optional) */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Comment (optional)
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add your thoughts about this paper..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Image Upload Area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Images (optional)
          </label>

          {/* Drag and Drop Zone */}
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
            }`}
          >
            <svg
              className={`mx-auto h-12 w-12 ${isDragging ? 'text-purple-500' : 'text-gray-400'}`}
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-semibold text-purple-600">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </div>

        {/* Image Previews */}
        {images.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {images.map((image, index) => (
              <div
                key={index}
                className="relative border border-gray-200 rounded-lg p-3 bg-gray-50 animate-fadeIn"
              >
                {/* Image Preview */}
                <div className="relative mb-2">
                  <img
                    src={image.preview}
                    alt={image.altText || 'Preview'}
                    className="w-full h-32 object-cover rounded"
                  />

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    title="Remove image"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {/* Loading Indicator */}
                  {image.loading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>

                {/* Alt Text Input */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Alt Text {image.loading && <span className="text-purple-600">(Generating...)</span>}
                  </label>
                  <input
                    type="text"
                    value={image.altText}
                    onChange={(e) => updateAltText(index, e.target.value)}
                    placeholder="Describe this image for accessibility"
                    disabled={image.loading}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:bg-gray-100"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !doi || images.some(img => img.loading)}
          className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? 'Creating Post...' : 'Create Post'}
        </button>
      </form>

      {/* Add fade-in animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
