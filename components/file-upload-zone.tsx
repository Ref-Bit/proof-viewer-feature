"use client"

import type React from "react"

import { useCallback } from "react"
import { useDrop } from "react-dnd"
import { NativeTypes } from "react-dnd-html5-backend"
import { Upload, FileImage, FileVideo, AlertCircle } from "lucide-react"
import { Label } from "@/components/ui/label"

interface FileUploadZoneProps {
  onFileChange: (file: File | undefined) => void
  watchedFile: File | undefined
  errors: any
  formatFileSize: (bytes: number) => string
}

interface DropResult {
  files: File[]
}

export function FileUploadZone({ onFileChange, watchedFile, errors, formatFileSize }: FileUploadZoneProps) {
  const handleFileDrop = useCallback(
    (item: DropResult) => {
      if (item.files && item.files.length > 0) {
        const file = item.files[0]

        // Validate file type
        const isImage = file.type.startsWith("image/")
        const isVideo = file.type.startsWith("video/")

        if (!isImage && !isVideo) {
          alert("Please upload only image or video files")
          return
        }

        // Validate file size
        const maxSize = isImage ? 1 * 1024 * 1024 : 5 * 1024 * 1024 // 1MB for images, 5MB for videos
        if (file.size > maxSize) {
          alert(`File size must be less than ${isImage ? "1MB" : "5MB"}`)
          return
        }

        onFileChange(file)
      }
    },
    [onFileChange],
  )

  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: [NativeTypes.FILE],
      drop: handleFileDrop,
      canDrop: (item: DropResult) => {
        if (!item.files || item.files.length === 0) return false

        const file = item.files[0]
        const isImage = file.type.startsWith("image/")
        const isVideo = file.type.startsWith("video/")

        return isImage || isVideo
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [handleFileDrop],
  )

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    onFileChange(file)
  }

  const getDropZoneClasses = () => {
    const baseClasses =
      "flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200"

    if (errors?.file) {
      return `${baseClasses} border-red-300 bg-red-50`
    }

    if (isOver && canDrop) {
      return `${baseClasses} border-green-400 bg-green-50 scale-105`
    }

    if (isOver && !canDrop) {
      return `${baseClasses} border-red-400 bg-red-50`
    }

    if (canDrop) {
      return `${baseClasses} border-blue-300 bg-blue-50`
    }

    return `${baseClasses} border-gray-300 hover:bg-gray-50`
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <FileImage className="size-5 text-blue-600" />
    }
    if (file.type.startsWith("video/")) {
      return <FileVideo className="size-5 text-purple-600" />
    }
    return <Upload className="size-5 text-gray-400" />
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="file-upload" className="text-sm font-medium text-gray-900">
        File Upload
      </Label>

      <div ref={drop} className="relative">
        <input id="file-upload" type="file" accept="image/*,video/*" onChange={handleInputChange} className="hidden" />

        <label htmlFor="file-upload" className={getDropZoneClasses()}>
          <div className="text-center p-4">
            {isOver && canDrop ? (
              <>
                <Upload className="size-8 text-green-600 mx-auto mb-2 animate-bounce" />
                <p className="text-sm text-green-700 font-medium">Drop file here to upload</p>
              </>
            ) : isOver && !canDrop ? (
              <>
                <AlertCircle className="size-8 text-red-600 mx-auto mb-2" />
                <p className="text-sm text-red-700 font-medium">Invalid file type</p>
              </>
            ) : watchedFile ? (
              <>
                {getFileIcon(watchedFile)}
                <p className="text-sm text-gray-700 font-medium mt-2">{watchedFile.name}</p>
                <p className="text-xs text-gray-500">Click to change file</p>
              </>
            ) : (
              <>
                <Upload className="size-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">Images (max 1MB) • Videos (max 5MB)</p>
              </>
            )}
          </div>
        </label>

        {/* Drag overlay indicator */}
        {isOver && (
          <div className="absolute inset-0 pointer-events-none">
            <div
              className={`w-full h-full rounded-lg border-2 ${canDrop ? "border-green-400 bg-green-100" : "border-red-400 bg-red-100"} opacity-50`}
            />
          </div>
        )}
      </div>

      {/* File preview when selected */}
      {watchedFile && !errors?.file && (
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="size-2 bg-green-500 rounded-full animate-pulse"></div>
            {getFileIcon(watchedFile)}
            <span className="text-sm text-gray-700 font-medium">{watchedFile.name}</span>
          </div>
          <span className="text-xs text-gray-500">{formatFileSize(watchedFile.size)}</span>
        </div>
      )}

      {/* Error display */}
      {errors?.file && (
        <div className="flex items-center gap-1 text-sm text-red-600">
          <AlertCircle className="size-4" />
          {errors.file.message}
        </div>
      )}
    </div>
  )
}
