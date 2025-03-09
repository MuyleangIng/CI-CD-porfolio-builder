import Image from "next/image"
import type { Section } from "@/types/template"

interface DynamicComponentProps {
  component: Section
  isEditing?: boolean
}

export default function DynamicComponent({ component, isEditing = false }: DynamicComponentProps) {
  const { type, props } = component

  // Add a light border if in editing mode
  const editingClass = isEditing ? "relative group" : ""

  const renderComponent = () => {
    switch (type) {
      case "hero":
        return (
          <div className={`${editingClass} text-center py-12`}>
            {props.backgroundImage && (
              <div className="absolute inset-0 -z-10 opacity-20">
                <Image
                  src={props.backgroundImage || "/placeholder.svg"}
                  alt="Background"
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{props.title}</h1>
            <p className="text-xl md:text-2xl opacity-90">{props.subtitle}</p>
            {isEditing && (
              <div className="absolute -top-2 -right-2 bg-primary text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                Hero
              </div>
            )}
          </div>
        )

      case "text":
        return (
          <div className={`${editingClass} prose max-w-none my-8`}>
            <div dangerouslySetInnerHTML={{ __html: props.content }} />
            {isEditing && (
              <div className="absolute -top-2 -right-2 bg-primary text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                Text
              </div>
            )}
          </div>
        )

      case "gallery":
        return (
          <div className={`${editingClass} my-8`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {props.images.map((image: string, index: number) => (
                <div key={index} className="relative aspect-square overflow-hidden rounded-lg">
                  <Image
                    src={image || "/placeholder.svg"}
                    alt={`Gallery image ${index + 1}`}
                    fill
                    className="object-cover hover:scale-105 transition-transform"
                  />
                </div>
              ))}
            </div>
            {isEditing && (
              <div className="absolute -top-2 -right-2 bg-primary text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                Gallery
              </div>
            )}
          </div>
        )

      case "testimonial":
        return (
          <div className={`${editingClass} my-8 p-6 rounded-lg bg-primary/5 border border-primary/10`}>
            <blockquote className="text-lg italic mb-4">"{props.quote}"</blockquote>
            <div className="flex items-center gap-2">
              <div>
                <p className="font-medium">{props.author}</p>
                <p className="text-sm opacity-70">{props.role}</p>
              </div>
            </div>
            {isEditing && (
              <div className="absolute -top-2 -right-2 bg-primary text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                Testimonial
              </div>
            )}
          </div>
        )

      case "cta":
        return (
          <div className={`${editingClass} my-8 p-8 text-center rounded-lg bg-primary/10`}>
            <h3 className="text-2xl font-bold mb-4">{props.title}</h3>
            <a
              href={props.buttonLink}
              className="inline-block px-6 py-3 rounded-full text-white font-medium bg-secondary hover:bg-secondary/90 transition-colors"
            >
              {props.buttonText}
            </a>
            {isEditing && (
              <div className="absolute -top-2 -right-2 bg-primary text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                CTA
              </div>
            )}
          </div>
        )

      default:
        return <div className="p-4 border border-dashed rounded-md">Unknown component type: {type}</div>
    }
  }

  return renderComponent()
}

