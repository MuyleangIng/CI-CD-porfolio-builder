// Vercel API integration service

interface VercelCredentials {
  token: string
  teamId?: string
}

interface DeploymentOptions {
  name: string
  gitRepository: {
    repo: string
    type: "github"
    org: string
  }
}

interface DeploymentStatus {
  id: string
  readyState: "INITIALIZING" | "ANALYZING" | "BUILDING" | "DEPLOYING" | "READY" | "ERROR"
  state: string
  createdAt: number
  buildingAt?: number
  readyAt?: number
  url?: string
}

interface DeploymentLog {
  type: string
  created: number
  payload: {
    text: string
    deploymentId?: string
    statusCode?: number
    [key: string]: any
  }
}

export class VercelService {
  private credentials: VercelCredentials | null = null
  private pollingInterval = 2000 // 2 seconds

  constructor() {
    // Try to load credentials from localStorage if available
    this.loadCredentials()
  }

  private loadCredentials() {
    if (typeof window !== "undefined") {
      const savedCredentials = localStorage.getItem("vercel_credentials")
      if (savedCredentials) {
        try {
          this.credentials = JSON.parse(savedCredentials)
        } catch (error) {
          console.error("Failed to parse Vercel credentials:", error)
        }
      }
    }
  }

  public saveCredentials(credentials: VercelCredentials) {
    this.credentials = credentials
    if (typeof window !== "undefined") {
      localStorage.setItem("vercel_credentials", JSON.stringify(credentials))
    }
  }

  public clearCredentials() {
    this.credentials = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("vercel_credentials")
    }
  }

  public getCredentials(): VercelCredentials | null {
    return this.credentials
  }

  public isAuthenticated(): boolean {
    return !!this.credentials
  }

  // Replace the existing createDeployment method with this updated version:
  async createDeployment(options: {
    name: string
    gitRepository: {
      type: string
      repo: string
      org: string
    }
  }): Promise<{
    success: boolean
    error?: string
    deploymentId?: string
  }> {
    try {
      if (!this.isAuthenticated()) {
        throw new Error("Vercel credentials not found")
      }

      const { token } = this.credentials

      // First, check if the project already exists
      let projectId
      try {
        const projectResponse = await fetch(`https://api.vercel.com/v9/projects/${options.name}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (projectResponse.ok) {
          const projectData = await projectResponse.json()
          projectId = projectData.id
        }
      } catch (error) {
        console.log("Project not found, will create a new one")
      }

      // If project doesn't exist, create it
      if (!projectId) {
        console.log("Creating new Vercel project")
        const createProjectResponse = await fetch("https://api.vercel.com/v9/projects", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: options.name,
            framework: "nextjs",
            gitRepository: {
              type: options.gitRepository.type,
              repo: `${options.gitRepository.org}/${options.gitRepository.repo}`,
            },
          }),
        })

        if (!createProjectResponse.ok) {
          const errorData = await createProjectResponse.json()
          throw new Error(`Failed to create project: ${JSON.stringify(errorData)}`)
        }

        const projectData = await createProjectResponse.json()
        projectId = projectData.id
      }

      // Create the deployment
      console.log(`Creating deployment for project ID: ${projectId}`)
      const deployResponse = await fetch(`https://api.vercel.com/v13/deployments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          target: "production",
          gitSource: {
            type: "github",
            repo: `${options.gitRepository.org}/${options.gitRepository.repo}`,
            ref: "main",
          },
        }),
      })

      const deployData = await deployResponse.json()

      if (!deployResponse.ok) {
        throw new Error(`Deployment failed: ${JSON.stringify(deployData)}`)
      }

      return {
        success: true,
        deploymentId: deployData.id || projectId,
      }
    } catch (error) {
      console.error("Vercel deployment error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  public async getDeploymentStatus(
    projectId: string,
  ): Promise<{ success: boolean; status?: DeploymentStatus; error?: string }> {
    if (!this.credentials) {
      return { success: false, error: "Not authenticated with Vercel" }
    }

    try {
      const response = await fetch(`https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=1`, {
        headers: {
          Authorization: `Bearer ${this.credentials.token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        return {
          success: false,
          error: errorData.error?.message || `Failed to get deployment status: ${response.status}`,
        }
      }

      const data = await response.json()

      if (!data.deployments || data.deployments.length === 0) {
        return {
          success: false,
          error: "No deployments found for this project",
        }
      }

      return {
        success: true,
        status: data.deployments[0],
      }
    } catch (error) {
      console.error("Error getting deployment status:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error getting deployment status",
      }
    }
  }

  public async getDeploymentLogs(
    deploymentId: string,
    since?: number,
  ): Promise<{ success: boolean; logs?: DeploymentLog[]; error?: string }> {
    if (!this.credentials) {
      return { success: false, error: "Not authenticated with Vercel" }
    }

    try {
      let url = `https://api.vercel.com/v2/deployments/${deploymentId}/events`
      if (since) {
        url += `?since=${since}`
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.credentials.token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        return {
          success: false,
          error: errorData.error?.message || `Failed to get deployment logs: ${response.status}`,
        }
      }

      const data = await response.json()

      return {
        success: true,
        logs: data.events || [],
      }
    } catch (error) {
      console.error("Error getting deployment logs:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error getting deployment logs",
      }
    }
  }

  public async pollDeploymentStatus(
    projectId: string,
    onStatusUpdate: (status: DeploymentStatus) => void,
    onError: (error: string) => void,
    onComplete: (url: string) => void,
  ): Promise<() => void> {
    let isPolling = true

    const poll = async () => {
      if (!isPolling) return

      try {
        const result = await this.getDeploymentStatus(projectId)

        if (!result.success || !result.status) {
          onError(result.error || "Failed to get deployment status")
          return
        }

        const status = result.status
        onStatusUpdate(status)

        if (status.readyState === "READY") {
          onComplete(status.url || `https://${projectId}.vercel.app`)
          isPolling = false
          return
        } else if (status.readyState === "ERROR") {
          onError("Deployment failed")
          isPolling = false
          return
        }

        // Continue polling
        setTimeout(poll, this.pollingInterval)
      } catch (error) {
        onError(error instanceof Error ? error.message : "Unknown error polling deployment status")
        isPolling = false
      }
    }

    // Start polling
    poll()

    // Return a function to stop polling
    return () => {
      isPolling = false
    }
  }

  public async pollDeploymentLogs(
    deploymentId: string,
    onNewLogs: (logs: DeploymentLog[]) => void,
    onError: (error: string) => void,
  ): Promise<() => void> {
    let isPolling = true
    let lastTimestamp = 0

    const poll = async () => {
      if (!isPolling) return

      try {
        const result = await this.getDeploymentLogs(deploymentId, lastTimestamp)

        if (!result.success || !result.logs) {
          onError(result.error || "Failed to get deployment logs")
          return
        }

        const logs = result.logs

        if (logs.length > 0) {
          onNewLogs(logs)
          lastTimestamp = logs[logs.length - 1].created
        }

        // Continue polling
        setTimeout(poll, this.pollingInterval)
      } catch (error) {
        onError(error instanceof Error ? error.message : "Unknown error polling deployment logs")
        isPolling = false
      }
    }

    // Start polling
    poll()

    // Return a function to stop polling
    return () => {
      isPolling = false
    }
  }
}

export const vercelService = new VercelService()

