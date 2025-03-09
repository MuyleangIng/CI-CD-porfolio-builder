"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import type { TemplateData } from "@/types/template"
import { Template1 } from "@/components/templates/template-1"
import { Template2 } from "@/components/templates/template-2"
import { Template3 } from "@/components/templates/template-3"
import { Plus, Trash2, RefreshCw, LayoutGrid } from "lucide-react"
import ComponentLibrary from "./component-library"

interface TemplateEditorProps {
  data: TemplateData
  onChange: (data: TemplateData) => void
  onSave: () => void
  onCancel: () => void
  isSaving: boolean
  templateId: number
}

export default function TemplateEditor({
  data,
  onChange,
  onSave,
  onCancel,
  isSaving,
  templateId,
}: TemplateEditorProps) {
  const [activeTab, setActiveTab] = useState("personal")
  const [previewTemplate, setPreviewTemplate] = useState(templateId)

  const handleInputChange = (section: string, field: string, value: string) => {
    const newData = { ...data }

    if (section === "personal") {
      // @ts-ignore: Dynamic property access
      newData[field] = value
    } else if (section === "contact") {
      newData.contact = { ...newData.contact, [field]: value }
    } else if (section === "theme") {
      newData.theme = { ...newData.theme, [field]: value }
    }

    onChange(newData)
  }

  const handleSkillChange = (index: number, value: string) => {
    const newSkills = [...data.skills]
    newSkills[index] = value
    onChange({ ...data, skills: newSkills })
  }

  const addSkill = () => {
    onChange({ ...data, skills: [...data.skills, "New Skill"] })
  }

  const removeSkill = (index: number) => {
    const newSkills = [...data.skills]
    newSkills.splice(index, 1)
    onChange({ ...data, skills: newSkills })
  }

  const handleProjectChange = (index: number, field: string, value: string) => {
    const newProjects = [...data.projects]
    // @ts-ignore: Dynamic property access
    newProjects[index][field] = value
    onChange({ ...data, projects: newProjects })
  }

  const addProject = () => {
    onChange({
      ...data,
      projects: [
        ...data.projects,
        {
          title: "New Project",
          description: "Description of your new project",
          imageUrl: "/placeholder.svg?height=200&width=300",
        },
      ],
    })
  }

  const removeProject = (index: number) => {
    const newProjects = [...data.projects]
    newProjects.splice(index, 1)
    onChange({ ...data, projects: newProjects })
  }

  const handleAddComponent = (componentType: string, sectionId: string) => {
    const newSections = [...data.sections]
    newSections.push({
      id: `section-${Date.now()}`,
      type: componentType,
      sectionId,
      props: getDefaultPropsForComponent(componentType),
    })
    onChange({ ...data, sections: newSections })
  }

  const handleRemoveComponent = (componentId: string) => {
    const newSections = data.sections.filter((section) => section.id !== componentId)
    onChange({ ...data, sections: newSections })
  }

  const handleUpdateComponentProps = (componentId: string, props: any) => {
    const newSections = data.sections.map((section) => {
      if (section.id === componentId) {
        return { ...section, props: { ...section.props, ...props } }
      }
      return section
    })
    onChange({ ...data, sections: newSections })
  }

  const getDefaultPropsForComponent = (componentType: string) => {
    switch (componentType) {
      case "hero":
        return {
          title: "Hero Section",
          subtitle: "Add a subtitle here",
          backgroundImage: "/placeholder.svg?height=500&width=1000",
        }
      case "text":
        return {
          content: "Add your text content here",
        }
      case "gallery":
        return {
          images: [
            "/placeholder.svg?height=300&width=400",
            "/placeholder.svg?height=300&width=400",
            "/placeholder.svg?height=300&width=400",
          ],
        }
      case "testimonial":
        return {
          quote: "This is a testimonial quote",
          author: "John Doe",
          role: "CEO, Company",
        }
      case "cta":
        return {
          title: "Call to Action",
          buttonText: "Click Here",
          buttonLink: "#",
        }
      default:
        return {}
    }
  }

  const renderPreview = () => {
    switch (previewTemplate) {
      case 1:
        return <Template1 data={data} isEditing={true} />
      case 2:
        return <Template2 data={data} isEditing={true} />
      case 3:
        return <Template3 data={data} isEditing={true} />
      default:
        return <Template1 data={data} isEditing={true} />
    }
  }

  return (
    <div className="container mx-auto py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Edit Your Portfolio</h2>
          <div className="space-x-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={onSave} disabled={isSaving}>
              {isSaving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Template
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="theme">Theme</TabsTrigger>
            <TabsTrigger value="components">
              <LayoutGrid className="h-4 w-4 mr-2" />
              Components
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={data.name}
                  onChange={(e) => handleInputChange("personal", "name", e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="title">Professional Title</Label>
                <Input
                  id="title"
                  value={data.title}
                  onChange={(e) => handleInputChange("personal", "title", e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="about">About</Label>
                <Textarea
                  id="about"
                  rows={5}
                  value={data.about}
                  onChange={(e) => handleInputChange("personal", "about", e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={data.contact.email}
                  onChange={(e) => handleInputChange("contact", "email", e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={data.contact.phone}
                  onChange={(e) => handleInputChange("contact", "phone", e.target.value)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="skills" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Skills</h3>
              <Button size="sm" variant="outline" onClick={addSkill}>
                <Plus className="h-4 w-4 mr-2" /> Add Skill
              </Button>
            </div>

            <div className="space-y-3">
              {data.skills.map((skill, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input value={skill} onChange={(e) => handleSkillChange(index, e.target.value)} />
                  <Button size="icon" variant="destructive" onClick={() => removeSkill(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="projects" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Projects</h3>
              <Button size="sm" variant="outline" onClick={addProject}>
                <Plus className="h-4 w-4 mr-2" /> Add Project
              </Button>
            </div>

            <div className="space-y-6">
              {data.projects.map((project, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">Project {index + 1}</CardTitle>
                      <Button size="icon" variant="destructive" onClick={() => removeProject(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor={`project-${index}-title`}>Title</Label>
                      <Input
                        id={`project-${index}-title`}
                        value={project.title}
                        onChange={(e) => handleProjectChange(index, "title", e.target.value)}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor={`project-${index}-description`}>Description</Label>
                      <Textarea
                        id={`project-${index}-description`}
                        rows={3}
                        value={project.description}
                        onChange={(e) => handleProjectChange(index, "description", e.target.value)}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor={`project-${index}-image`}>Image URL</Label>
                      <Input
                        id={`project-${index}-image`}
                        value={project.imageUrl}
                        onChange={(e) => handleProjectChange(index, "imageUrl", e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="theme" className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="primary-color">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primary-color"
                    type="color"
                    className="w-16"
                    value={data.theme.primary}
                    onChange={(e) => handleInputChange("theme", "primary", e.target.value)}
                  />
                  <Input
                    value={data.theme.primary}
                    onChange={(e) => handleInputChange("theme", "primary", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="secondary-color">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondary-color"
                    type="color"
                    className="w-16"
                    value={data.theme.secondary}
                    onChange={(e) => handleInputChange("theme", "secondary", e.target.value)}
                  />
                  <Input
                    value={data.theme.secondary}
                    onChange={(e) => handleInputChange("theme", "secondary", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="background-color">Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="background-color"
                    type="color"
                    className="w-16"
                    value={data.theme.background}
                    onChange={(e) => handleInputChange("theme", "background", e.target.value)}
                  />
                  <Input
                    value={data.theme.background}
                    onChange={(e) => handleInputChange("theme", "background", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="text-color">Text Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="text-color"
                    type="color"
                    className="w-16"
                    value={data.theme.text}
                    onChange={(e) => handleInputChange("theme", "text", e.target.value)}
                  />
                  <Input value={data.theme.text} onChange={(e) => handleInputChange("theme", "text", e.target.value)} />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="components" className="space-y-4">
            <ComponentLibrary
              onAddComponent={handleAddComponent}
              onRemoveComponent={handleRemoveComponent}
              onUpdateComponentProps={handleUpdateComponentProps}
              components={data.sections}
            />
          </TabsContent>
        </Tabs>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Preview</h2>
          <div className="flex gap-2">
            <Button variant={previewTemplate === 1 ? "default" : "outline"} onClick={() => setPreviewTemplate(1)}>
              Template 1
            </Button>
            <Button variant={previewTemplate === 2 ? "default" : "outline"} onClick={() => setPreviewTemplate(2)}>
              Template 2
            </Button>
            <Button variant={previewTemplate === 3 ? "default" : "outline"} onClick={() => setPreviewTemplate(3)}>
              Template 3
            </Button>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden h-[600px] overflow-y-auto">
          <div className="scale-[0.8] origin-top transform-gpu">{renderPreview()}</div>
        </div>
      </div>
    </div>
  )
}

