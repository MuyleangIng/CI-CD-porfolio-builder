export interface TemplateData {
  name: string
  title: string
  about: string
  skills: string[]
  projects: {
    title: string
    description: string
    imageUrl: string
  }[]
  contact: {
    email: string
    phone: string
  }
  theme: {
    primary: string
    secondary: string
    background: string
    text: string
  }
  sections: Section[]
}

export interface Section {
  id: string
  type: string
  sectionId: string
  props: any
}

