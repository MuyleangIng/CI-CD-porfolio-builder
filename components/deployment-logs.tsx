"use client"

import { useEffect, useRef, useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface LogEntry {
  id: string
  timestamp: number
  text: string
  type: "info" | "error" | "success" | "warning"
}

interface DeploymentLogsProps {
  logs: LogEntry[]
  className?: string
  autoScroll?: boolean
}

export default function DeploymentLogs({ logs, className, autoScroll = true }: DeploymentLogsProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [isAutoScrolling, setIsAutoScrolling] = useState(autoScroll)

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (isAutoScrolling && scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current
      scrollArea.scrollTop = scrollArea.scrollHeight
    }
  }, [logs, isAutoScrolling])

  // Format timestamp to readable time
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  }

  // Get color class based on log type
  const getLogColor = (type: string) => {
    switch (type) {
      case "error":
        return "text-red-500"
      case "success":
        return "text-green-500"
      case "warning":
        return "text-yellow-500"
      default:
        return "text-gray-300"
    }
  }

  return (
    <div className={cn("flex flex-col", className)}>
      <ScrollArea
        ref={scrollAreaRef}
        className="h-[300px] w-full rounded-md border bg-black p-4 font-mono text-sm"
        onScroll={(e) => {
          const target = e.currentTarget
          const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50
          setIsAutoScrolling(isAtBottom)
        }}
      >
        <div className="space-y-1">
          {logs.length === 0 ? (
            <div className="text-gray-500 italic">Waiting for logs...</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex">
                <span className="text-gray-500 mr-2">[{formatTime(log.timestamp)}]</span>
                <span className={cn("flex-1", getLogColor(log.type))}>{log.text}</span>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
        <div>{logs.length} log entries</div>
        <div>{isAutoScrolling ? "Auto-scrolling enabled" : "Auto-scrolling disabled"}</div>
      </div>
    </div>
  )
}

