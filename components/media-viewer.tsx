"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import { X, Download, ZoomIn, ZoomOut, RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"

interface MediaViewerProps {
  isOpen: boolean
  onClose: () => void
  fileUrl: string
  fileName: string
  fileType: string
  fileSize?: number
}

export function MediaViewer({ isOpen, onClose, fileUrl, fileName, fileType, fileSize }: MediaViewerProps) {
  const [imageScale, setImageScale] = useState(1)
  const [imageRotation, setImageRotation] = useState(0)
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const isImage = fileType.startsWith("image/")
  const isVideo = fileType.startsWith("video/")

  const handleZoomIn = useCallback(() => {
    setImageScale((prev) => Math.min(prev + 0.25, 3))
  }, [])

  const handleZoomOut = useCallback(() => {
    setImageScale((prev) => {
      const newScale = Math.max(prev - 0.25, 0.25)
      // Reset pan position if zooming out to fit or below
      if (newScale <= 1) {
        setPanPosition({ x: 0, y: 0 })
      }
      return newScale
    })
  }, [])

  const handleRotate = useCallback(() => {
    setImageRotation((prev) => (prev + 90) % 360)
  }, [])

  const handleReset = useCallback(() => {
    setImageScale(1)
    setImageRotation(0)
    setPanPosition({ x: 0, y: 0 })
  }, [])

  // Drag and drop functionality
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isImage && imageScale > 1) {
        setIsDragging(true)
        setDragStart({
          x: e.clientX - panPosition.x,
          y: e.clientY - panPosition.y,
        })
        e.preventDefault()
      }
    },
    [isImage, imageScale, panPosition],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging && imageScale > 1) {
        const newX = e.clientX - dragStart.x
        const newY = e.clientY - dragStart.y

        // Optional: Add boundary constraints to prevent dragging too far
        const maxOffset = 200 // Maximum pixels to drag beyond container
        const constrainedX = Math.max(-maxOffset, Math.min(maxOffset, newX))
        const constrainedY = Math.max(-maxOffset, Math.min(maxOffset, newY))

        setPanPosition({
          x: constrainedX,
          y: constrainedY,
        })
      }
    },
    [isDragging, imageScale, dragStart],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Touch events for mobile drag support
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (isImage && imageScale > 1 && e.touches.length === 1) {
        const touch = e.touches[0]
        setIsDragging(true)
        setDragStart({
          x: touch.clientX - panPosition.x,
          y: touch.clientY - panPosition.y,
        })
        e.preventDefault()
      }
    },
    [isImage, imageScale, panPosition],
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (isDragging && imageScale > 1 && e.touches.length === 1) {
        const touch = e.touches[0]
        const newX = touch.clientX - dragStart.x
        const newY = touch.clientY - dragStart.y

        // Apply same constraints as mouse
        const maxOffset = 200
        const constrainedX = Math.max(-maxOffset, Math.min(maxOffset, newX))
        const constrainedY = Math.max(-maxOffset, Math.min(maxOffset, newY))

        setPanPosition({
          x: constrainedX,
          y: constrainedY,
        })
        e.preventDefault()
      }
    },
    [isDragging, imageScale, dragStart],
  )

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleDownload = async () => {
    try {
      const response = await fetch(fileUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Download failed:", error)
    }
  }

  const resetImageControls = useCallback(() => {
    setImageScale(1)
    setImageRotation(0)
    setPanPosition({ x: 0, y: 0 })
    setIsDragging(false)
    setIsLoading(true)
  }, [])

  const handleClose = useCallback(() => {
    resetImageControls()
    onClose()
  }, [resetImageControls, onClose])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  // Determine cursor style based on state
  const getCursorStyle = () => {
    if (!isImage) return "default"
    if (isDragging) return "grabbing"
    if (imageScale > 1) return "grab"
    return "default"
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl w-full h-[90vh] p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-white">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold truncate">{fileName}</h3>
            <p className="text-sm text-gray-500">
              {fileType} {fileSize && `• ${formatFileSize(fileSize)}`}
            </p>
          </div>

          <div className="flex items-center gap-2 ml-4">
            {isImage && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={imageScale <= 0.25}
                  title="Zoom Out"
                >
                  <ZoomOut className="size-4" />
                </Button>
                <span className="text-sm text-gray-600 min-w-[4rem] text-center font-mono">
                  {Math.round(imageScale * 100)}%
                </span>
                <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={imageScale >= 3} title="Zoom In">
                  <ZoomIn className="size-4" />
                </Button>
                <div className="w-px h-6 bg-gray-300 mx-2" />
                <Button variant="outline" size="sm" onClick={handleRotate} title="Rotate 90°">
                  <RotateCw className="size-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleReset} title="Reset View">
                  Reset
                </Button>
                <div className="w-px h-6 bg-gray-300 mx-2" />
              </>
            )}
            <Button variant="outline" size="sm" onClick={handleDownload} title="Download File">
              <Download className="size-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleClose} title="Close Viewer">
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Media Content */}
        <div
          ref={containerRef}
          className="flex-1 flex items-center justify-center bg-gray-50 relative overflow-hidden"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ cursor: getCursorStyle() }}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <p className="text-sm text-gray-600">Loading...</p>
              </div>
            </div>
          )}

          {isImage && (
            <img
              ref={imageRef}
              src={fileUrl || "/placeholder.svg"}
              alt={fileName}
              className="max-w-full max-h-full object-contain select-none transition-transform duration-200"
              style={{
                transform: `scale(${imageScale}) rotate(${imageRotation}deg) translate(${panPosition.x / imageScale}px, ${panPosition.y / imageScale}px)`,
                transformOrigin: "center center",
              }}
              onLoad={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
              draggable={false}
            />
          )}

          {isVideo && (
            <video
              src={fileUrl}
              controls
              className="max-w-full max-h-full"
              onLoadedData={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
            >
              Your browser does not support the video tag.
            </video>
          )}

          {!isImage && !isVideo && (
            <div className="text-center p-8">
              <p className="text-gray-500 mb-4">Preview not available for this file type</p>
              <Button onClick={handleDownload}>
                <Download className="size-4 mr-2" />
                Download File
              </Button>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="p-4 border-t bg-gray-50 text-sm text-gray-600">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span>File size: {fileSize ? formatFileSize(fileSize) : "Unknown"}</span>
              {isImage && imageScale > 1 && (
                <span className="text-blue-600">
                  Position: ({panPosition.x.toFixed(0)}, {panPosition.y.toFixed(0)})
                </span>
              )}
            </div>
            {isImage && (
              <span className="text-xs text-gray-500">
                {imageScale > 1
                  ? "Click and drag to reposition • Use zoom buttons to adjust view"
                  : "Use zoom buttons to adjust view • Rotate button to turn image"}
              </span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
