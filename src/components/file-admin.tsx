'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { api, auth, type FileItem } from '@/lib/api'
import { formatFileSize, formatDateTime, cn } from '@/lib/utils'
import { Upload, Eye, Trash2, Copy, LogOut } from 'lucide-react'

interface FileAdminProps {
  onLogout: () => void
}

export default function FileAdmin({ onLogout }: FileAdminProps) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState('')

  const loadFiles = async () => {
    try {
      setLoading(true)
      const response = await api.get<FileItem[]>('/files/')
      setFiles(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFiles()
  }, [])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setSelectedFile(file || null)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    setUploadProgress(0)
    
    // Simulate progress for demo
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90))
    }, 100)

    try {
      await api.upload('/files/upload', selectedFile)
      setUploadProgress(100)
      setSelectedFile(null)
      await loadFiles()
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      if (fileInput) fileInput.value = ''
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      clearInterval(progressInterval)
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this file?')) return

    try {
      await api.delete(`/files/${id}`)
      await loadFiles()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  const handleView = (file: FileItem) => {
    if (file.oss_url) {
      window.open(file.oss_url, '_blank')
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  const handleLogout = () => {
    auth.logout()
    onLogout()
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-stone-800">OSS File Manager</h1>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-lg font-medium text-stone-800 mb-4">Upload File</h2>
          <div className="flex items-center gap-4">
            <Input
              type="file"
              onChange={handleFileSelect}
              disabled={uploading}
              className="flex-1"
            />
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="bg-stone-800 hover:bg-stone-900 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
          
          {uploading && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-stone-600 mb-1">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-stone-200 rounded-full h-2">
                <div 
                  className="bg-stone-800 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
            <button 
              onClick={() => setError('')}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Files Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-medium text-stone-800">Files</h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center text-stone-500">
              Loading files...
            </div>
          ) : files.length === 0 ? (
            <div className="p-8 text-center text-stone-500">
              No files found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>OSS Key</TableHead>
                    <TableHead>File Size</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell>
                        <button
                          onClick={() => copyToClipboard(file.oss_key)}
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline font-mono text-sm"
                        >
                          {file.oss_key}
                          <Copy className="w-3 h-3" />
                        </button>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatFileSize(file.file_size)}
                      </TableCell>
                      <TableCell>
                        {formatDateTime(file.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleView(file)}
                            className="flex items-center gap-1"
                          >
                            🔍 View
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(file.id)}
                            className="flex items-center gap-1"
                          >
                            🗑 Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}