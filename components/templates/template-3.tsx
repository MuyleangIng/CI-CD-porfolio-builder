import type React from "react"
import Image from "next/image"
import type { TemplateData } from "@/types/template"
import { Github, Linkedin, Mail, Phone, ExternalLink } from "lucide-react"
import DynamicComponent from "../dynamic-component"

interface Template3Props {
  data: TemplateData
  isEditing?: boolean
}

export function Template3({ data, isEditing = false }: Template3Props) {
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
    <div className="min-h-screen" style={{ ...containerStyle, backgroundColor: theme.background, color: theme.text }}>
      <style jsx global>{`
        .template-3 {
          --primary-color: ${theme.primary};
          --secondary-color: ${theme.secondary};
          --background-color: ${theme.background};
          --text-color: ${theme.text};
        }
      `}</style>

      {/* Navbar */}
      <nav
        className="sticky top-0 z-10 p-6 flex justify-between items-center"
        style={{ backgroundColor: theme.primary }}
      >
        <h1 className="text-2xl font-bold text-white">{name}</h1>
        <div className="flex items-center gap-6">
          <a href="#about" className="text-white/80 hover:text-white text-sm uppercase tracking-wider font-medium">
            About
          </a>
          <a href="#skills" className="text-white/80 hover:text-white text-sm uppercase tracking-wider font-medium">
            Skills
          </a>
          <a href="#projects" className="text-white/80 hover:text-white text-sm uppercase tracking-wider font-medium">
            Projects
          </a>
          <a href="#contact" className="text-white/80 hover:text-white text-sm uppercase tracking-wider font-medium">
            Contact
          </a>
        </div>
      </nav>

      {/* Hero */}
      <header className="min-h-[70vh] flex flex-col justify-center items-center text-center py-20 px-6">
        {headerComponents.length > 0 ? (
          headerComponents.map((component) => (
            <DynamicComponent key={component.id} component={component} isEditing={isEditing} />
          ))
        ) : (
          <>
            <h1 className="text-6xl font-bold mb-4" style={{ color: theme.primary }}>
              {name}
            </h1>
            <h2 className="text-3xl mb-8">{title}</h2>
            <p className="max-w-2xl text-xl leading-relaxed">{about}</p>
            <div className="mt-10 flex gap-4">
              <a
                href="#contact"
                className="px-8 py-3 rounded-full text-white font-medium"
                style={{ backgroundColor: theme.secondary }}
              >
                Contact Me
              </a>
              <a
                href="#projects"
                className="px-8 py-3 rounded-full font-medium border"
                style={{ borderColor: theme.primary, color: theme.primary }}
              >
                View My Work
              </a>
            </div>
          </>
        )}
      </header>

      {mainComponents.length > 0 && (
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="space-y-20">
              {mainComponents.map((component) => (
                <DynamicComponent key={component.id} component={component} isEditing={isEditing} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Skills Section */}
      <section id="skills" className="py-20 px-6" style={{ backgroundColor: theme.primary + "10" }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center" style={{ color: theme.primary }}>
            My Skills
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {skills.map((skill, index) => (
              <div
                key={index}
                className="p-4 rounded-lg text-center border-2 hover:scale-105 transition-transform"
                style={{ borderColor: theme.secondary }}
              >
                <h3 className="text-xl font-medium">{skill}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center" style={{ color: theme.primary }}>
            Featured Projects
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {projects.map((project, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-lg shadow-lg border"
                style={{ borderColor: theme.secondary + "30" }}
              >
                <div className="relative h-60">
                  <Image
                    src={project.imageUrl || "/placeholder.svg"}
                    alt={project.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold mb-3" style={{ color: theme.primary }}>
                    {project.title}
                  </h3>
                  <p className="mb-5">{project.description}</p>
                  <a href="#" className="inline-flex items-center gap-2 font-medium" style={{ color: theme.secondary }}>
                    View Project <ExternalLink size={18} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {sidebarComponents.length > 0 && (
        <section className="py-20 px-6" style={{ backgroundColor: theme.primary + "05" }}>
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold mb-12 text-center" style={{ color: theme.primary }}>
              Additional Content
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {sidebarComponents.map((component) => (
                <DynamicComponent key={component.id} component={component} isEditing={isEditing} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section id="contact" className="py-20 px-6 text-white" style={{ backgroundColor: theme.primary }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">Get In Touch</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold mb-6">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-6 w-6" />
                  <a href={`mailto:${contact.email}`} className="text-lg hover:underline">
                    {contact.email}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-6 w-6" />
                  <a href={`tel:${contact.phone}`} className="text-lg hover:underline">
                    {contact.phone}
                  </a>
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                <a href="#" className="hover:opacity-80">
                  <Github size={24} />
                </a>
                <a href="#" className="hover:opacity-80">
                  <Linkedin size={24} />
                </a>
              </div>
            </div>
            <div>
              <form className="space-y-4">
                <div>
                  <label className="block mb-2">Name</label>
                  <input type="text" className="w-full px-4 py-3 rounded" style={{ color: theme.text }} />
                </div>
                <div>
                  <label className="block mb-2">Email</label>
                  <input type="email" className="w-full px-4 py-3 rounded" style={{ color: theme.text }} />
                </div>
                <div>
                  <label className="block mb-2">Message</label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 rounded resize-none"
                    style={{ color: theme.text }}
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 rounded text-white font-medium"
                  style={{ backgroundColor: theme.secondary }}
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 text-center">
        {footerComponents.length > 0 ? (
          footerComponents.map((component) => (
            <DynamicComponent key={component.id} component={component} isEditing={isEditing} />
          ))
        ) : (
          <p>
            &copy; {new Date().getFullYear()} {name}. All rights reserved.
          </p>
        )}
      </footer>
    </div>
  )
}

