import type React from "react"
import Image from "next/image"
import type { TemplateData } from "@/types/template"
import { Github, Linkedin, Mail, Phone } from "lucide-react"
import DynamicComponent from "../dynamic-component"

interface Template1Props {
  data: TemplateData
  isEditing?: boolean
}

export function Template1({ data, isEditing = false }: Template1Props) {
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
    <div className="min-h-screen" style={containerStyle}>
      <style jsx global>{`
        .template-1 {
          --primary-color: ${theme.primary};
          --secondary-color: ${theme.secondary};
          --background-color: ${theme.background};
          --text-color: ${theme.text};
        }
      `}</style>

      <header className="bg-primary text-white py-20 px-8">
        <div className="container mx-auto max-w-4xl">
          {headerComponents.length > 0 ? (
            headerComponents.map((component) => (
              <DynamicComponent key={component.id} component={component} isEditing={isEditing} />
            ))
          ) : (
            <>
              <h1 className="text-5xl font-bold mb-4">{name}</h1>
              <h2 className="text-2xl opacity-90">{title}</h2>
            </>
          )}
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-8 py-16">
        {mainComponents.length > 0 && (
          <div className="mb-16">
            {mainComponents.map((component) => (
              <DynamicComponent key={component.id} component={component} isEditing={isEditing} />
            ))}
          </div>
        )}

        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-primary">About Me</h2>
          <p className="text-lg leading-relaxed" style={{ color: theme.text }}>
            {about}
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-primary">Skills</h2>
          <div className="flex flex-wrap gap-3">
            {skills.map((skill, index) => (
              <span
                key={index}
                className="px-4 py-2 rounded-full text-white font-medium"
                style={{ backgroundColor: theme.secondary }}
              >
                {skill}
              </span>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-primary">Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {projects.map((project, index) => (
              <div key={index} className="border rounded-lg overflow-hidden shadow-md">
                <div className="relative h-48">
                  <Image
                    src={project.imageUrl || "/placeholder.svg"}
                    alt={project.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{project.title}</h3>
                  <p className="text-muted-foreground">{project.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {sidebarComponents.length > 0 && (
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6 text-primary">Additional Content</h2>
            <div className="space-y-8">
              {sidebarComponents.map((component) => (
                <DynamicComponent key={component.id} component={component} isEditing={isEditing} />
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-3xl font-bold mb-6 text-primary">Contact</h2>
          <div className="flex flex-col md:flex-row gap-6">
            <a
              href={`mailto:${contact.email}`}
              className="inline-flex items-center gap-2 text-lg"
              style={{ color: theme.text }}
            >
              <Mail size={20} /> {contact.email}
            </a>
            <a
              href={`tel:${contact.phone}`}
              className="inline-flex items-center gap-2 text-lg"
              style={{ color: theme.text }}
            >
              <Phone size={20} /> {contact.phone}
            </a>
          </div>
        </section>
      </main>

      <footer className="bg-primary text-white py-8 px-8">
        <div className="container mx-auto max-w-4xl flex flex-col md:flex-row justify-between items-center">
          {footerComponents.length > 0 ? (
            footerComponents.map((component) => (
              <DynamicComponent key={component.id} component={component} isEditing={isEditing} />
            ))
          ) : (
            <>
              <div>
                <p className="text-lg font-medium">{name}</p>
                <p className="opacity-80">&copy; {new Date().getFullYear()} All Rights Reserved</p>
              </div>
              <div className="flex gap-4 mt-4 md:mt-0">
                <a href="#" className="text-white hover:text-white/80">
                  <Github size={24} />
                </a>
                <a href="#" className="text-white hover:text-white/80">
                  <Linkedin size={24} />
                </a>
              </div>
            </>
          )}
        </div>
      </footer>
    </div>
  )
}

