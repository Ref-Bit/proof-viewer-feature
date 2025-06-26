"use client"

import type React from "react"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { Link, AlertCircle, CheckCircle2, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { addProofSchema, type AddProofFormData } from "./lib/validation"
import { uploadFileToSupabase } from "./lib/supabase-client"
import { insertProofRecord, type ProofSubmission } from "./lib/supabase-actions"
import { MediaViewer } from "./components/media-viewer"
import { FileUploadZone } from "./components/file-upload-zone"

interface SubmissionResult {
  id?: number
  proofLink?: string
  fileName?: string
  fileUrl?: string
  fileSize?: number
  fileType?: string
  submittedAt: string
  status: string
}

export default function Component() {
  const [isOpen, setIsOpen] = useState(false)
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showMediaViewer, setShowMediaViewer] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
    clearErrors,
  } = useForm<AddProofFormData>({
    resolver: zodResolver(addProofSchema),
    mode: "onChange",
  })

  const watchedFile = watch("file")
  const watchedProofLink = watch("proofLink")

  const handleFileChange = (file: File | undefined) => {
    setValue("file", file, { shouldValidate: true })
    // Clear root error when file is selected
    if (errors.root && file) {
      clearErrors("root")
    }
  }

  const handleLinkChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setValue("proofLink", value, { shouldValidate: true })
    // Clear root error when link is entered
    if (errors.root && value) {
      clearErrors("root")
    }
  }

  const onSubmit = async (data: AddProofFormData) => {
    setIsSubmitting(true)

    try {
      let fileUrl: string | undefined
      let uploadError: string | undefined

      // Upload file to Supabase if provided
      if (data.file) {
        console.log("Uploading file:", data.file.name)
        const uploadResult = await uploadFileToSupabase(data.file)
        if (uploadResult.error) {
          uploadError = uploadResult.error
          console.error("File upload failed:", uploadResult.error)
        } else {
          fileUrl = uploadResult.url
          console.log("File uploaded successfully:", fileUrl)
        }
      }

      // If file upload failed, show error and stop
      if (uploadError) {
        alert(`File upload failed: ${uploadError}`)
        return
      }

      // Prepare proof data for database
      const proofData: ProofSubmission = {
        proofLink: data.proofLink,
        fileName: data.file?.name,
        fileUrl,
        fileSize: data.file?.size,
        fileType: data.file?.type,
      }

      console.log("Inserting proof record:", proofData)

      // Insert proof record into database
      const dbResult = await insertProofRecord(proofData)

      if (!dbResult.success) {
        console.error("Database insertion failed:", dbResult.error)
        alert(`Database error: ${dbResult.error}`)
        return
      }

      console.log("Proof record inserted successfully:", dbResult.id)

      // Success - show results
      const result: SubmissionResult = {
        id: dbResult.id,
        proofLink: data.proofLink,
        fileName: data.file?.name,
        fileUrl,
        fileSize: data.file?.size,
        fileType: data.file?.type,
        submittedAt: new Date().toISOString(),
        status: "pending",
      }

      setSubmissionResult(result)
      reset()
    } catch (error) {
      console.error("Submission error:", error)
      alert(`Submission failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleClose = () => {
    setIsOpen(false)
    setSubmissionResult(null)
    reset()
  }

  const handleNewSubmission = () => {
    setSubmissionResult(null)
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="shadow-sm cursor-pointer">
            <Play className="mr-2 size-4" />
            Execute
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          {submissionResult ? (
            // Success view
            <>
              <DialogHeader className="text-center">
                <div className="size-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="size-8 text-green-600" />
                </div>
                <DialogTitle className="text-2xl">Proof Submitted Successfully!</DialogTitle>
                <DialogDescription>Your proof has been submitted and is being processed.</DialogDescription>
              </DialogHeader>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3 my-4">
                <h3 className="font-semibold text-gray-900">Submission Details:</h3>

                <div>
                  <span className="text-sm font-medium text-gray-700">Proof ID:</span>
                  <p className="text-sm text-gray-600">#{submissionResult.id}</p>
                </div>

                {submissionResult.proofLink && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Proof Link:</span>
                    <p className="text-sm text-blue-600 break-all">{submissionResult.proofLink}</p>
                  </div>
                )}

                {submissionResult.fileName && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">File:</span>
                    <p className="text-sm text-gray-600">
                      {submissionResult.fileName} ({formatFileSize(submissionResult.fileSize || 0)})
                    </p>
                    {submissionResult.fileUrl && (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs text-blue-600 hover:underline"
                        onClick={() => setShowMediaViewer(true)}
                      >
                        View File
                      </Button>
                    )}
                  </div>
                )}

                <div>
                  <span className="text-sm font-medium text-gray-700">Status:</span>
                  <span className="text-sm text-yellow-600 capitalize ml-1">{submissionResult.status}</span>
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-700">Submitted:</span>
                  <p className="text-sm text-gray-600">{new Date(submissionResult.submittedAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleNewSubmission} variant="outline" className="flex-1">
                  Submit Another
                </Button>
                <Button onClick={handleClose} className="flex-1">
                  Close
                </Button>
              </div>
            </>
          ) : (
            // Form view
            <>
              <DialogHeader>
                <DialogTitle>Add Proof</DialogTitle>
                <DialogDescription>Submit a proof link or upload a file to execute the term.</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Root Error */}
                {errors.root && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="size-4 text-red-600 flex-shrink-0" />
                    <span className="text-sm text-red-700">{errors.root.message}</span>
                  </div>
                )}

                {/* Proof Link Section */}
                <div className="space-y-2">
                  <Label htmlFor="proof-link" className="text-sm font-medium text-gray-900">
                    Proof Link
                  </Label>
                  <div className="relative">
                    <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      id="proof-link"
                      type="url"
                      placeholder="https://example.com/proof"
                      {...register("proofLink")}
                      onChange={handleLinkChange}
                      className={`pl-10 ${errors.proofLink ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
                    />
                  </div>
                  {errors.proofLink && (
                    <div className="flex items-center gap-1 text-sm text-red-600">
                      <AlertCircle className="size-4" />
                      {errors.proofLink.message}
                    </div>
                  )}
                </div>

                {/* Enhanced File Upload Section with React DnD */}
                <FileUploadZone
                  onFileChange={handleFileChange}
                  watchedFile={watchedFile}
                  errors={errors}
                  formatFileSize={formatFileSize}
                />

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={handleClose}
                    variant="outline"
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit"}
                  </Button>
                </div>
              </form>
            </>
          )}
          {submissionResult && submissionResult.fileUrl && (
            <MediaViewer
              isOpen={showMediaViewer}
              onClose={() => setShowMediaViewer(false)}
              fileUrl={submissionResult.fileUrl}
              fileName={submissionResult.fileName || "Unknown file"}
              fileType={submissionResult.fileType || "application/octet-stream"}
              fileSize={submissionResult.fileSize}
            />
          )}
        </DialogContent>
      </Dialog>
    </DndProvider>
  )
}
