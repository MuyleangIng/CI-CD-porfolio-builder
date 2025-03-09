import type React from "react"
import Image from "next/image"
import type { TemplateData } from "@/types/template"
import { Github, Linkedin, Mail, Phone } from "lucide-react"
import DynamicComponent from "../dynamic-component"

interface Template2Props {
  data: TemplateData
  isEditing?: boolean
}

export function Template2({ data, isEditing = false }: Template2Props) {
  const { name, title, about, skills, projects, contact, theme, sections } = data

  const containerStyle = {
    "--primary": theme.primary,
    "--secondary": theme.secondary,
    "--background": theme.background,
    "--text": theme.text,
  } as React.CSSProperties

  // Filter components by section
  const headerComponents = sections.filter((section) => section.sectionId === "header")
  const mainComponents = sections.filter((section) => section.sectionId === "main")
  const sidebarComponents = sections.filter((section) => section.sectionId === "sidebar")
  const footerComponents = sections.filter((section) => section.sectionId === "footer")

  return (
    <div className="min-h-screen bg-black text-white" style={containerStyle}>
      <style jsx global>{`
        .template-2 {
          --primary-color: ${theme.primary};
          --secondary-color: ${theme.secondary};
          --background-color: ${theme.background};
          --text-color: ${theme.text};
        }
      `}</style>

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <div
          className="w-1/3 fixed left-0 h-screen overflow-auto p-12 flex flex-col justify-between"
          style={{ backgroundColor: theme.primary }}
        >
          <div>
            {headerComponents.length > 0 ? (
              headerComponents.map((component) => (
                <div key={component.id} className="mb-8">
                  <DynamicComponent component={component} isEditing={isEditing} />
                </div>
              ))
            ) : (
              <>
                <h1 className="text-4xl font-bold mb-2">{name}</h1>
                <h2 className="text-xl opacity-90 mb-8">{title}</h2>
              </>
            )}

            <div className="mb-12">
              <h3 className="text-lg font-bold mb-3 uppercase tracking-wider">About</h3>
              <p className="leading-relaxed">{about}</p>
            </div>

            <div className="mb-12">
              <h3 className="text-lg font-bold mb-3 uppercase tracking-wider">Skills</h3>
              <ul className="space-y-2">
                {skills.map((skill, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: theme.secondary }}></span>
                    {skill}
                  </li>
                ))}
              </ul>
            </div>

            {sidebarComponents.length > 0 && (
              <div className="mb-12">
                <h3 className="text-lg font-bold mb-3 uppercase tracking-wider">Additional Content</h3>
                <div className="space-y-6">
                  {sidebarComponents.map((component) => (
                    <DynamicComponent key={component.id} component={component} isEditing={isEditing} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-bold mb-3 uppercase tracking-wider">Contact</h3>
            <div className="space-y-3">
              <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-white hover:opacity-80">
                <Mail size={18} /> {contact.email}
              </a>
              <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-white hover:opacity-80">
                <Phone size={18} /> {contact.phone}
              </a>
              <div className="flex gap-4 mt-6">
                <a href="#" className="text-white hover:opacity-80">
                  <Github size={20} />
                </a>
                <a href="#" className="text-white hover:opacity-80">
                  <Linkedin size={20} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-2/3 ml-auto p-12" style={{ backgroundColor: theme.background, color: theme.text }}>
          {mainComponents.length > 0 && (
            <div className="mb-12">
              {mainComponents.map((component) => (
                <DynamicComponent key={component.id} component={component} isEditing={isEditing} />
              ))}
            </div>
          )}

          <h2 className="text-3xl font-bold mb-12 pb-4 border-b-2" style={{ borderColor: theme.secondary }}>
            My Projects
          </h2>

          <div className="space-y-20">
            {projects.map((project, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className={index % 2 === 0 ? "order-1" : "order-2"}>
                  <div className="relative aspect-video overflow-hidden rounded-lg">
                    <Image
                      src={project.imageUrl || "/placeholder.svg"}
                      alt={project.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                <div className={index % 2 === 0 ? "order-2" : "order-1"}>
                  <h3 className="text-2xl font-bold mb-4" style={{ color: theme.secondary }}>
                    {project.title}
                  </h3>
                  <p className="text-lg leading-relaxed">{project.description}</p>
                  <div className="mt-6">
                    <button
                      className="px-6 py-2 rounded font-medium"
                      style={{ backgroundColor: theme.secondary, color: "white" }}
                    >
                      View Project
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {footerComponents.length > 0 && (
            <div className="mt-20 pt-8 border-t" style={{ borderColor: theme.secondary + "30" }}>
              {footerComponents.map((component) => (
                <DynamicComponent key={component.id} component={component} isEditing={isEditing} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

