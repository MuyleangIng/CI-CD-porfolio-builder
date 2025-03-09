"use client"

import type React from "react"

import { useState } from "react"
import { useDrag, useDrop } from "react-dnd"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Section } from "@/types/template"
import { LayoutTemplate, Type, ImageIcon, Quote, MousePointerClick, Trash2, Move, Edit, Plus } from "lucide-react"

interface ComponentLibraryProps {
  onAddComponent: (componentType: string, sectionId: string) => void
  onRemoveComponent: (componentId: string) => void
  onUpdateComponentProps: (componentId: string, props: any) => void
  components: Section[]
}

const componentTypes = [
  {
    id: "hero",
    name: "Hero Section",
    icon: LayoutTemplate,
    description: "A large banner with title and subtitle",
  },
  {
    id: "text",
    name: "Text Block",
    icon: Type,
    description: "A block of formatted text content",
  },
  {
    id: "gallery",
    name: "Image Gallery",
    icon: ImageIcon,
    description: "A collection of images in a grid",
  },
  {
    id: "testimonial",
    name: "Testimonial",
    icon: Quote,
    description: "A customer quote with attribution",
  },
  {
    id: "cta",
    name: "Call to Action",
    icon: MousePointerClick,
    description: "A button with a compelling message",
  },
]

const dropZones = [
  { id: "header", name: "Header" },
  { id: "main", name: "Main Content" },
  { id: "sidebar", name: "Sidebar" },
  { id: "footer", name: "Footer" },
]

export default function ComponentLibrary({
  onAddComponent,
  onRemoveComponent,
  onUpdateComponentProps,
  components,
}: ComponentLibraryProps) {
  const [selectedComponent, setSelectedComponent] = useState<Section | null>(null)
  const [activeTab, setActiveTab] = useState("library")

  const handleEditComponent = (component: Section) => {
    setSelectedComponent(component)
    setActiveTab("editor")
  }

  const handleSaveComponentChanges = () => {
    if (selectedComponent) {
      onUpdateComponentProps(selectedComponent.id, selectedComponent.props)
      setSelectedComponent(null)
      setActiveTab("library")
    }
  }

  const handleCancelEdit = () => {
    setSelectedComponent(null)
    setActiveTab("library")
  }

  const handlePropChange = (key: string, value: any) => {
    if (selectedComponent) {
      setSelectedComponent({
        ...selectedComponent,
        props: {
          ...selectedComponent.props,
          [key]: value,
        },
      })
    }
  }

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="library">Component Library</TabsTrigger>
          <TabsTrigger value="editor" disabled={!selectedComponent}>
            Component Editor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {componentTypes.map((component) => (
              <DraggableComponent
                key={component.id}
                type={component.id}
                name={component.name}
                Icon={component.icon}
                description={component.description}
              />
            ))}
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-medium mb-4">Drop Zones</h3>
            <div className="grid grid-cols-1 gap-4">
              {dropZones.map((zone) => (
                <DropZone
                  key={zone.id}
                  id={zone.id}
                  name={zone.name}
                  onDrop={(componentType) => onAddComponent(componentType, zone.id)}
                />
              ))}
            </div>
          </div>

          {components.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Added Components</h3>
              <div className="space-y-3">
                {components.map((component) => (
                  <div key={component.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center gap-3">
                      <div className="bg-muted p-2 rounded">{getComponentIcon(component.type)}</div>
                      <div>
                        <p className="font-medium">{getComponentName(component.type)}</p>
                        <p className="text-sm text-muted-foreground">Zone: {component.sectionId}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEditComponent(component)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => onRemoveComponent(component.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="editor">
          {selectedComponent && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Edit {getComponentName(selectedComponent.type)}</CardTitle>
                  <CardDescription>Customize the properties of this component</CardDescription>
                </CardHeader>
                <CardContent>{renderComponentEditor(selectedComponent, handlePropChange)}</CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button variant="outline" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveComponentChanges}>Save Changes</Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface DraggableComponentProps {
  type: string
  name: string
  Icon: React.ElementType
  description: string
}

function DraggableComponent({ type, name, Icon, description }: DraggableComponentProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "component",
    item: { type },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }))

  return (
    <div
      ref={drag}
      className={`p-4 border rounded-md cursor-move transition-opacity ${isDragging ? "opacity-50" : "opacity-100"}`}
    >
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-2 rounded text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-medium">{name}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center text-xs text-muted-foreground">
        <Move className="h-3 w-3 mr-1" /> Drag to add to template
      </div>
    </div>
  )
}

interface DropZoneProps {
  id: string
  name: string
  onDrop: (componentType: string) => void
}

function DropZone({ id, name, onDrop }: DropZoneProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "component",
    drop: (item: { type: string }) => {
      onDrop(item.type)
      return { id }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }))

  return (
    <div
      ref={drop}
      className={`p-4 border-2 border-dashed rounded-md text-center transition-colors ${
        isOver ? "border-primary bg-primary/5" : "border-muted-foreground/20"
      }`}
    >
      <div className="flex flex-col items-center gap-2 py-4">
        <h3 className="font-medium">{name}</h3>
        <p className="text-sm text-muted-foreground">Drop components here</p>
        {isOver && (
          <div className="mt-2 text-primary font-medium">
            <Plus className="h-5 w-5 mx-auto animate-pulse" />
          </div>
        )}
      </div>
    </div>
  )
}

function getComponentIcon(type: string) {
  const component = componentTypes.find((c) => c.id === type)
  if (!component) return <LayoutTemplate className="h-5 w-5" />

  const Icon = component.icon
  return <Icon className="h-5 w-5" />
}

function getComponentName(type: string) {
  const component = componentTypes.find((c) => c.id === type)
  return component ? component.name : type
}

function renderComponentEditor(component: Section, onChange: (key: string, value: any) => void) {
  switch (component.type) {
    case "hero":
      return (
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="hero-title">Title</Label>
            <Input id="hero-title" value={component.props.title} onChange={(e) => onChange("title", e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="hero-subtitle">Subtitle</Label>
            <Input
              id="hero-subtitle"
              value={component.props.subtitle}
              onChange={(e) => onChange("subtitle", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="hero-bg">Background Image URL</Label>
            <Input
              id="hero-bg"
              value={component.props.backgroundImage}
              onChange={(e) => onChange("backgroundImage", e.target.value)}
            />
          </div>
        </div>
      )
    case "text":
      return (
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="text-content">Content</Label>
            <Textarea
              id="text-content"
              rows={5}
              value={component.props.content}
              onChange={(e) => onChange("content", e.target.value)}
            />
          </div>
        </div>
      )
    case "gallery":
      return (
        <div className="space-y-4">
          <Label>Images</Label>
          {component.props.images.map((image: string, index: number) => (
            <div key={index} className="flex gap-2 items-center">
              <Input
                value={image}
                onChange={(e) => {
                  const newImages = [...component.props.images]
                  newImages[index] = e.target.value
                  onChange("images", newImages)
                }}
              />
              <Button
                size="icon"
                variant="destructive"
                onClick={() => {
                  const newImages = [...component.props.images]
                  newImages.splice(index, 1)
                  onChange("images", newImages)
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              onChange("images", [...component.props.images, "/placeholder.svg?height=300&width=400"])
            }}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Image
          </Button>
        </div>
      )
    case "testimonial":
      return (
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="testimonial-quote">Quote</Label>
            <Textarea
              id="testimonial-quote"
              rows={3}
              value={component.props.quote}
              onChange={(e) => onChange("quote", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="testimonial-author">Author</Label>
            <Input
              id="testimonial-author"
              value={component.props.author}
              onChange={(e) => onChange("author", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="testimonial-role">Role</Label>
            <Input
              id="testimonial-role"
              value={component.props.role}
              onChange={(e) => onChange("role", e.target.value)}
            />
          </div>
        </div>
      )
    case "cta":
      return (
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="cta-title">Title</Label>
            <Input id="cta-title" value={component.props.title} onChange={(e) => onChange("title", e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cta-button-text">Button Text</Label>
            <Input
              id="cta-button-text"
              value={component.props.buttonText}
              onChange={(e) => onChange("buttonText", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cta-button-link">Button Link</Label>
            <Input
              id="cta-button-link"
              value={component.props.buttonLink}
              onChange={(e) => onChange("buttonLink", e.target.value)}
            />
          </div>
        </div>
      )
    default:
      return <p>No editor available for this component type</p>
  }
}

