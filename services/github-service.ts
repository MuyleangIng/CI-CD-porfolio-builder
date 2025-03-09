// GitHub API integration service

interface GitHubCredentials {
  token: string
  username: string
}

interface RepoCreationOptions {
  name: string
  description?: string
  private?: boolean
}

export class GitHubService {
  private credentials: GitHubCredentials | null = null

  constructor() {
    // Try to load credentials from localStorage if available
    this.loadCredentials()
  }

  private loadCredentials() {
    if (typeof window !== "undefined") {
      const savedCredentials = localStorage.getItem("github_credentials")
      if (savedCredentials) {
        try {
          this.credentials = JSON.parse(savedCredentials)
        } catch (error) {
          console.error("Failed to parse GitHub credentials:", error)
        }
      }
    }
  }

  public saveCredentials(credentials: GitHubCredentials) {
    this.credentials = credentials
    if (typeof window !== "undefined") {
      localStorage.setItem("github_credentials", JSON.stringify(credentials))
    }
  }

  public clearCredentials() {
    this.credentials = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("github_credentials")
    }
  }

  public getCredentials(): GitHubCredentials | null {
    return this.credentials
  }

  public isAuthenticated(): boolean {
    return !!this.credentials
  }

  public async createRepository(
    options: RepoCreationOptions,
  ): Promise<{ success: boolean; repoUrl?: string; error?: string }> {
    if (!this.credentials) {
      return { success: false, error: "Not authenticated with GitHub" }
    }

    try {
      const response = await fetch("https://api.github.com/user/repos", {
        method: "POST",
        headers: {
          Authorization: `token ${this.credentials.token}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github.v3+json",
        },
        body: JSON.stringify({
          name: options.name,
          description: options.description || `Portfolio created with Portfolio Builder`,
          private: options.private || false,
          auto_init: true, // Initialize with README
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        return {
          success: false,
          error: errorData.message || `Failed to create repository: ${response.status}`,
        }
      }

      const data = await response.json()
      return {
        success: true,
        repoUrl: data.html_url,
      }
    } catch (error) {
      console.error("Error creating GitHub repository:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error creating repository",
      }
    }
  }

  public async pushTemplateToRepo(repoName: string, templateData: any): Promise<{ success: boolean; error?: string }> {
    if (!this.credentials) {
      return { success: false, error: "Not authenticated with GitHub" }
    }

    try {
      // Create a list of files to push to the repository
      const files = this.generateTemplateFiles(templateData, repoName)

      // Get the default branch
      const repoResponse = await fetch(`https://api.github.com/repos/${this.credentials.username}/${repoName}`, {
        headers: {
          Authorization: `token ${this.credentials.token}`,
          Accept: "application/vnd.github.v3+json",
        },
      })

      if (!repoResponse.ok) {
        throw new Error(`Failed to get repository information: ${repoResponse.status}`)
      }

      const repoData = await repoResponse.json()
      const defaultBranch = repoData.default_branch || "main"

      // Get the latest commit SHA
      const refResponse = await fetch(
        `https://api.github.com/repos/${this.credentials.username}/${repoName}/git/refs/heads/${defaultBranch}`,
        {
          headers: {
            Authorization: `token ${this.credentials.token}`,
            Accept: "application/vnd.github.v3+json",
          },
        },
      )

      if (!refResponse.ok) {
        throw new Error(`Failed to get reference: ${refResponse.status}`)
      }

      const refData = await refResponse.json()
      const latestCommitSha = refData.object.sha

      // Get the tree SHA
      const commitResponse = await fetch(
        `https://api.github.com/repos/${this.credentials.username}/${repoName}/git/commits/${latestCommitSha}`,
        {
          headers: {
            Authorization: `token ${this.credentials.token}`,
            Accept: "application/vnd.github.v3+json",
          },
        },
      )

      if (!commitResponse.ok) {
        throw new Error(`Failed to get commit: ${commitResponse.status}`)
      }

      const commitData = await commitResponse.json()
      const treeSha = commitData.tree.sha

      // Create a new tree with the files
      const treeItems = await Promise.all(
        files.map(async (file) => {
          // Create a blob for each file
          const blobResponse = await fetch(
            `https://api.github.com/repos/${this.credentials.username}/${repoName}/git/blobs`,
            {
              method: "POST",
              headers: {
                Authorization: `token ${this.credentials.token}`,
                "Content-Type": "application/json",
                Accept: "application/vnd.github.v3+json",
              },
              body: JSON.stringify({
                content: file.content,
                encoding: "utf-8",
              }),
            },
          )

          if (!blobResponse.ok) {
            throw new Error(`Failed to create blob for ${file.path}: ${blobResponse.status}`)
          }

          const blobData = await blobResponse.json()

          return {
            path: file.path,
            mode: "100644", // Regular file
            type: "blob",
            sha: blobData.sha,
          }
        }),
      )

      // Create a new tree
      const newTreeResponse = await fetch(
        `https://api.github.com/repos/${this.credentials.username}/${repoName}/git/trees`,
        {
          method: "POST",
          headers: {
            Authorization: `token ${this.credentials.token}`,
            "Content-Type": "application/json",
            Accept: "application/vnd.github.v3+json",
          },
          body: JSON.stringify({
            base_tree: treeSha,
            tree: treeItems,
          }),
        },
      )

      if (!newTreeResponse.ok) {
        throw new Error(`Failed to create tree: ${newTreeResponse.status}`)
      }

      const newTreeData = await newTreeResponse.json()

      // Create a new commit
      const newCommitResponse = await fetch(
        `https://api.github.com/repos/${this.credentials.username}/${repoName}/git/commits`,
        {
          method: "POST",
          headers: {
            Authorization: `token ${this.credentials.token}`,
            "Content-Type": "application/json",
            Accept: "application/vnd.github.v3+json",
          },
          body: JSON.stringify({
            message: "Initial portfolio template commit",
            tree: newTreeData.sha,
            parents: [latestCommitSha],
          }),
        },
      )

      if (!newCommitResponse.ok) {
        throw new Error(`Failed to create commit: ${newCommitResponse.status}`)
      }

      const newCommitData = await newCommitResponse.json()

      // Update the reference
      const updateRefResponse = await fetch(
        `https://api.github.com/repos/${this.credentials.username}/${repoName}/git/refs/heads/${defaultBranch}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `token ${this.credentials.token}`,
            "Content-Type": "application/json",
            Accept: "application/vnd.github.v3+json",
          },
          body: JSON.stringify({
            sha: newCommitData.sha,
            force: false,
          }),
        },
      )

      if (!updateRefResponse.ok) {
        throw new Error(`Failed to update reference: ${updateRefResponse.status}`)
      }

      return { success: true }
    } catch (error) {
      console.error("Error pushing template to repo:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error pushing template to repo",
      }
    }
  }

  private generateTemplateFiles(templateData: any, repoName: string): { path: string; content: string }[] {
    const files = [
      {
        path: "package.json",
        content: JSON.stringify(
          {
            name: repoName,
            version: "0.1.0",
            private: true,
            scripts: {
              dev: "next dev",
              build: "next build",
              start: "next start",
              lint: "next lint",
            },
            dependencies: {
              next: "^14.0.0",
              react: "^18.2.0",
              "react-dom": "^18.2.0",
              tailwindcss: "^3.3.0",
              "lucide-react": "^0.294.0",
            },
            devDependencies: {
              typescript: "^5.0.0",
              "@types/react": "^18.2.0",
              "@types/node": "^20.0.0",
              autoprefixer: "^10.4.0",
              postcss: "^8.4.0",
            },
          },
          null,
          2,
        ),
      },
      {
        path: "next.config.js",
        content: `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig`,
      },
      {
        path: "tsconfig.json",
        content: JSON.stringify(
          {
            compilerOptions: {
              target: "es5",
              lib: ["dom", "dom.iterable", "esnext"],
              allowJs: true,
              skipLibCheck: true,
              strict: true,
              forceConsistentCasingInFileNames: true,
              noEmit: true,
              esModuleInterop: true,
              module: "esnext",
              moduleResolution: "node",
              resolveJsonModule: true,
              isolatedModules: true,
              jsx: "preserve",
              incremental: true,
              plugins: [{ name: "next" }],
              paths: { "@/*": ["./*"] },
            },
            include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
            exclude: ["node_modules"],
          },
          null,
          2,
        ),
      },
      {
        path: "tailwind.config.js",
        content: `/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        primary: "${templateData.theme.primary}",
        secondary: "${templateData.theme.secondary}",
        background: "${templateData.theme.background}",
        text: "${templateData.theme.text}",
      },
    },
  },
  plugins: [],
}`,
      },
      {
        path: "postcss.config.js",
        content: `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
      },
      {
        path: "app/page.tsx",
        content: this.generateTemplateCode(templateData),
      },
      {
        path: "app/layout.tsx",
        content: `import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '${templateData.name} - Portfolio',
  description: '${templateData.about.substring(0, 150)}...',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}`,
      },
      {
        path: "app/globals.css",
        content: `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --primary: ${templateData.theme.primary};
  --secondary: ${templateData.theme.secondary};
  --background: ${templateData.theme.background};
  --text: ${templateData.theme.text};
}

body {
  background-color: var(--background);
  color: var(--text);
}
`,
      },
    ]

    return files
  }

  private generateTemplateCode(templateData: any): string {
    // This is a simplified version - in a real app, you'd generate the full template code
    return `"use client"

import Image from 'next/image'
import { useState, useEffect } from 'react'

export default function Portfolio() {
  return (
    <div className="min-h-screen">
      <header className="bg-primary text-white py-20 px-8">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-5xl font-bold mb-4">${templateData.name}</h1>
          <h2 className="text-2xl opacity-90">${templateData.title}</h2>
        </div>
      </header>
      
      <main className="container mx-auto max-w-4xl px-8 py-16">
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-primary">About Me</h2>
          <p className="text-lg leading-relaxed">${templateData.about}</p>
        </section>
        
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-primary">Skills</h2>
          <div className="flex flex-wrap gap-3">
            ${templateData.skills
              .map(
                (skill: string) => `
            <span className="px-4 py-2 rounded-full text-white font-medium bg-secondary">
              ${skill}
            </span>`,
              )
              .join("")}
          </div>
        </section>
        
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-primary">Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            ${templateData.projects
              .map(
                (project: any) => `
            <div className="border rounded-lg overflow-hidden shadow-md">
              <div className="relative h-48">
                <img 
                  src="${project.imageUrl}" 
                  alt="${project.title}"
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">${project.title}</h3>
                <p className="text-gray-600">${project.description}</p>
              </div>
            </div>`,
              )
              .join("")}
          </div>
        </section>
        
        <section>
          <h2 className="text-3xl font-bold mb-6 text-primary">Contact</h2>
          <div className="flex flex-col md:flex-row gap-6">
            <a 
              href="mailto:${templateData.contact.email}"
              className="inline-flex items-center gap-2 text-lg"
            >
              ${templateData.contact.email}
            </a>
            <a 
              href="tel:${templateData.contact.phone}"
              className="inline-flex items-center gap-2 text-lg"
            >
              ${templateData.contact.phone}
            </a>
          </div>
        </section>
      </main>
      
      <footer className="bg-primary text-white py-8 px-8">
        <div className="container mx-auto max-w-4xl flex flex-col md:flex-row justify-between items-center">
          <div>
            <p className="text-lg font-medium">${templateData.name}</p>
            <p className="opacity-80">&copy; ${new Date().getFullYear()} All Rights Reserved</p>
          </div>
        </div>
      </footer>
    </div>
  )
}`
  }
}

export const githubService = new GitHubService()

