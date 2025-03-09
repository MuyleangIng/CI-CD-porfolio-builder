"use client"

import { useState } from "react"
import TemplateSelector from "@/components/template-selector"
import TemplateEditor from "@/components/template-editor"
import { Template1 } from "@/components/templates/template-1"
import { Template2 } from "@/components/templates/template-2"
import { Template3 } from "@/components/templates/template-3"
import type { TemplateData } from "@/types/template"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import DeploymentModal from "@/components/deployment-modal"
import { Github } from "lucide-react"
import { TooltipProvider } from "@/components/ui/tooltip"

// Default template data
const defaultTemplateData: TemplateData = {
  name: "Your Name",
  title: "Your Title",
  about: "Write something about yourself here.",
  skills: ["React", "TypeScript", "JavaScript", "HTML", "CSS"],
  projects: [
    {
      title: "Project 1",
      description: "Description of project 1",
      imageUrl: "/placeholder.svg?height=200&width=300",
    },
    {
      title: "Project 2",
      description: "Description of project 2",
      imageUrl: "/placeholder.svg?height=200&width=300",
    },
  ],
  contact: {
    email: "your.email@example.com",
    phone: "+1 234 567 890",
  },
  theme: {
    primary: "#3b82f6",
    secondary: "#10b981",
    background: "#ffffff",
    text: "#1f2937",
  },
  sections: [], // This will store the dynamic components
}

export default function Home() {
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null)
  const [templateData, setTemplateData] = useState<TemplateData>(defaultTemplateData)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeploymentModalOpen, setIsDeploymentModalOpen] = useState(false)

  const handleTemplateSelect = (templateId: number) => {
    setSelectedTemplate(templateId)
  }

  const handleStartEditing = () => {
    setIsEditing(true)
  }

  const handleCancelEditing = () => {
    setIsEditing(false)
  }

  const handleSaveTemplate = async () => {
    setIsSaving(true)
    try {
      // The user mentioned they already have an API
      const response = await fetch("/api/save-template", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateId: selectedTemplate,
          data: templateData,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save template")
      }

      setIsEditing(false)
      alert("Template saved successfully!")
    } catch (error) {
      console.error("Error saving template:", error)
      alert("Failed to save template. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeployTemplate = () => {
    setIsDeploymentModalOpen(true)
  }

  const renderSelectedTemplate = () => {
    switch (selectedTemplate) {
      case 1:
        return <Template1 data={templateData} isEditing={isEditing} />
      case 2:
        return <Template2 data={templateData} isEditing={isEditing} />
      case 3:
        return <Template3 data={templateData} isEditing={isEditing} />
      default:
        return null
    }
  }

  return (
    <TooltipProvider>
      <DndProvider backend={HTML5Backend}>
        <main className="min-h-screen">
          {!selectedTemplate ? (
            <TemplateSelector onSelect={handleTemplateSelect} />
          ) : (
            <div className="relative">
              {isEditing ? (
                <TemplateEditor
                  data={templateData}
                  onChange={setTemplateData}
                  onSave={handleSaveTemplate}
                  onCancel={handleCancelEditing}
                  isSaving={isSaving}
                  templateId={selectedTemplate}
                />
              ) : (
                <>
                  <div className="sticky top-0 z-10 bg-background p-4 shadow-md">
                    <div className="container mx-auto flex justify-between items-center">
                      <h1 className="text-xl font-bold">Portfolio Preview</h1>
                      <div className="flex gap-2">
                        <div className="space-x-2">
                          <button
                            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                            onClick={handleStartEditing}
                          >
                            Edit Template
                          </button>
                          <button
                            className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
                            onClick={() => setSelectedTemplate(null)}
                          >
                            Choose Another Template
                          </button>
                        </div>
                        <button
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                          onClick={handleDeployTemplate}
                        >
                          <Github className="h-4 w-4" />
                          Push & Deploy
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="container mx-auto py-8">{renderSelectedTemplate()}</div>
                </>
              )}
            </div>
          )}

          {isDeploymentModalOpen && (
            <DeploymentModal
              isOpen={isDeploymentModalOpen}
              onClose={() => setIsDeploymentModalOpen(false)}
              templateData={templateData}
              templateId={selectedTemplate || 1}
            />
          )}
        </main>
      </DndProvider>
    </TooltipProvider>
  )
}

