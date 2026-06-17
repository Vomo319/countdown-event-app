'use client'

import React, { useState, useEffect } from 'react'
import { X, Copy, Share2, Check, QrCode } from 'lucide-react'
import { createSharedRoom } from '@/app/actions/shared-rooms'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  event: {
    id: string
    title: string
    emoji: string
    eventDate: string
    category?: string
    color?: string
  }
  isDark: boolean
}

export function ShareModal({ isOpen, onClose, event, isDark }: ShareModalProps) {
  const [roomCode, setRoomCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [shareUrl, setShareUrl] = useState('')

  useEffect(() => {
    if (isOpen) {
      generateShare()
    }
  }, [isOpen])

  const generateShare = async () => {
    setLoading(true)
    try {
      const result = await createSharedRoom(
        event.title,
        event.emoji,
        new Date(event.eventDate),
        event.category,
        event.color
      )
      
      if (result.success && result.room) {
        const code = result.room.room_code
        setRoomCode(code)
        const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/shared/${code}`
        setShareUrl(url)
      }
    } catch (error) {
      console.error('[v0] Failed to generate share room:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareVia = async () => {
    if (shareUrl && navigator.share) {
      try {
        await navigator.share({
          title: `Countdown: ${event.title}`,
          text: `Let's count down to ${event.title} ${event.emoji}!`,
          url: shareUrl,
        })
      } catch (error) {
        console.error('[v0] Share cancelled:', error)
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl animate-slideUp sm:animate-scaleIn p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Share2 size={28} className="text-indigo-600" />
            Share Countdown
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Event Info */}
        <div className="surface">
          <div className="text-4xl mb-2">{event.emoji}</div>
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">{event.title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {new Date(event.eventDate).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>

        {/* Share Code */}
        {roomCode && (
          <>
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Share Code</p>
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 rounded-2xl p-4 border-2 border-indigo-200 dark:border-indigo-800 text-center">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Code</p>
                <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 font-mono tracking-widest">
                  {roomCode}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Share Link</p>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-3 overflow-hidden">
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate break-all font-mono">
                  {shareUrl}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          {!loading && shareUrl && (
            <>
              <button
                onClick={copyToClipboard}
                className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  copied
                    ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                    : 'btn-primary'
                }`}
              >
                {copied ? (
                  <>
                    <Check size={20} />
                    Copied to clipboard!
                  </>
                ) : (
                  <>
                    <Copy size={20} />
                    Copy Link
                  </>
                )}
              </button>

              {navigator.share && (
                <button
                  onClick={shareVia}
                  className="btn-secondary w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                >
                  <Share2 size={20} />
                  Share
                </button>
              )}
            </>
          )}

          <button
            onClick={onClose}
            className="btn-ghost w-full py-3 rounded-xl font-semibold"
          >
            Done
          </button>
        </div>

        {/* Info */}
        <p className="text-xs text-gray-600 dark:text-gray-400 text-center bg-blue-50 dark:bg-blue-950 rounded-xl p-3">
          Anyone with this code or link can view and sync this countdown on their device - no account needed!
        </p>
      </div>
    </div>
  )
}
