"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import type { TemplateData } from "@/types/template"
import { githubService } from "@/services/github-service"
import { vercelService } from "@/services/vercel-service"
import { AlertCircle, CheckCircle2, Github, RefreshCw, BellIcon as Vercel, LogOut, Copy, Check } from "lucide-react"
import DeploymentLogs from "./deployment-logs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface DeploymentModalProps {
  isOpen: boolean
  onClose: () => void
  templateData: TemplateData
  templateId: number
}

type LogEntry = {
  id: string
  timestamp: number
  text: string
  type: "info" | "error" | "success" | "warning"
}

type DeploymentAction = "push" | "deploy" | "both"

export default function DeploymentModal({ isOpen, onClose, templateData, templateId }: DeploymentModalProps) {
  const [activeTab, setActiveTab] = useState("github")
  const [deploymentStatus, setDeploymentStatus] = useState<
    "idle" | "connecting" | "pushing" | "deploying" | "success" | "error"
  >("idle")
  const [statusMessage, setStatusMessage] = useState("")
  const [deploymentUrl, setDeploymentUrl] = useState("")
  const [repoUrl, setRepoUrl] = useState("")
  const [repoOwner, setRepoOwner] = useState("")
  const [repoName, setRepoName] = useState(`portfolio-template-${templateId}`)
  const [deploymentProgress, setDeploymentProgress] = useState(0)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [projectId, setProjectId] = useState("")
  const [deploymentId, setDeploymentId] = useState("")
  const [deploymentAction, setDeploymentAction] = useState<DeploymentAction>("both")
  const [copied, setCopied] = useState(false)
  const [deployWithVercel, setDeployWithVercel] = useState(false)

  // GitHub credentials
  const [githubToken, setGithubToken] = useState("")
  const [githubUsername, setGithubUsername] = useState("")

  // Vercel credentials
  const [vercelToken, setVercelToken] = useState("")
  const [existingRepoUrl, setExistingRepoUrl] = useState("")

  const isGithubAuthenticated = githubService.isAuthenticated()
  const isVercelAuthenticated = vercelService.isAuthenticated()

  // Load saved credentials on mount
  useEffect(() => {
    if (isGithubAuthenticated) {
      const credentials = githubService.getCredentials()
      if (credentials) {
        setGithubUsername(credentials.username)
        setRepoOwner(credentials.username)
      }
    }
  }, [isGithubAuthenticated])

  // Clean up polling when component unmounts
  useEffect(() => {
    const stopStatusPolling: (() => void) | null = null
    const stopLogsPolling: (() => void) | null = null

    return () => {
      if (stopStatusPolling) stopStatusPolling()
      if (stopLogsPolling) stopLogsPolling()
    }
  }, [])

  // Reset copy state after 2 seconds
  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => {
        setCopied(false)
      }, 2000)
      return () => clearTimeout(timeout)
    }
  }, [copied])

  const addLog = (text: string, type: "info" | "error" | "success" | "warning" = "info") => {
    setLogs((prev) => [
      ...prev,
      {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        text,
        type,
      },
    ])
  }

  const handleGithubConnect = () => {
    if (githubToken && githubUsername) {
      githubService.saveCredentials({
        token: githubToken,
        username: githubUsername,
      })
      setRepoOwner(githubUsername)
      setActiveTab("deploy")
      addLog(`Connected to GitHub as ${githubUsername}`, "success")
    }
  }

  const handleVercelConnect = () => {
    if (vercelToken) {
      vercelService.saveCredentials({
        token: vercelToken,
      })
      setActiveTab("deploy")
      addLog("Connected to Vercel", "success")
    }
  }

  const handleClearGithubToken = () => {
    if (confirm("Are you sure you want to clear your GitHub credentials?")) {
      githubService.clearCredentials()
      setGithubToken("")
      setGithubUsername("")
      addLog("GitHub credentials cleared", "info")
    }
  }

  const handleClearVercelToken = () => {
    if (confirm("Are you sure you want to clear your Vercel credentials?")) {
      vercelService.clearCredentials()
      setVercelToken("")
      addLog("Vercel credentials cleared", "info")
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
  }

  const createVercelDeployUrl = () => {
    if (!repoUrl) return ""

    // Extract owner and repo name from repoUrl
    // GitHub URL format: https://github.com/owner/repo
    const urlParts = repoUrl.split("/")
    const owner = urlParts[urlParts.length - 2]
    const repo = urlParts[urlParts.length - 1]

    // Create a URL that will automatically import the GitHub repo into Vercel
    return `https://vercel.com/new/import?s=https://github.com/${owner}/${repo}&hasTrialAvailable=1`
  }

  const handlePushToGithub = async () => {
    if (!isGithubAuthenticated) {
      setDeploymentStatus("error")
      setStatusMessage("Please connect your GitHub account first")
      addLog("Push failed: Missing GitHub authentication", "error")
      return
    }

    try {
      // Reset logs
      setLogs([])

      setDeploymentStatus("pushing")
      setStatusMessage("Creating GitHub repository...")
      setDeploymentProgress(10)
      addLog("Starting GitHub push process...", "info")
      addLog("Creating GitHub repository...", "info")

      // 1. Create GitHub repository
      const repoResult = await githubService.createRepository({
        name: repoName,
        description: `Portfolio website for ${templateData.name}`,
        private: false,
      })

      if (!repoResult.success) {
        throw new Error(repoResult.error || "Failed to create GitHub repository")
      }

      setRepoUrl(repoResult.repoUrl || "")
      addLog(`GitHub repository created: ${repoResult.repoUrl}`, "success")
      setDeploymentProgress(50)

      // 2. Push template files to repository
      setStatusMessage("Pushing template files to repository...")
      addLog("Pushing template files to repository...", "info")

      const pushResult = await githubService.pushTemplateToRepo(repoName, templateData)

      if (!pushResult.success) {
        throw new Error(pushResult.error || "Failed to push template files to repository")
      }

      addLog("Template files pushed to repository", "success")
      setDeploymentProgress(100)
      setDeploymentStatus("success")
      setStatusMessage("Code successfully pushed to GitHub!")
      setDeployWithVercel(true)
    } catch (error) {
      console.error("GitHub push error:", error)
      setDeploymentStatus("error")
      setStatusMessage(error instanceof Error ? error.message : "An unknown error occurred")
      addLog(error instanceof Error ? error.message : "An unknown error occurred", "error")
    }
  }

  const handleDeployToVercel = async (repoUrl: string) => {
    if (!isVercelAuthenticated) {
      setDeploymentStatus("error")
      setStatusMessage("Please connect your Vercel account first")
      addLog("Deployment failed: Missing Vercel authentication", "error")
      return
    }

    // Extract owner and repo name from repoUrl
    // GitHub URL format: https://github.com/owner/repo
    let owner = repoOwner
    let repo = repoName

    if (repoUrl) {
      const urlParts = repoUrl.split("/")
      owner = urlParts[urlParts.length - 2]
      repo = urlParts[urlParts.length - 1]
    }

    try {
      setDeploymentStatus("deploying")
      setStatusMessage("Connecting to Vercel...")
      setDeploymentProgress(deploymentAction === "both" ? 60 : 10)
      addLog("Initiating Vercel deployment...", "info")
      addLog(`Using GitHub repository: ${owner}/${repo}`, "info")

      const deployResult = await vercelService.createDeployment({
        name: repo,
        gitRepository: {
          type: "github",
          repo: repo,
          org: owner,
        },
      })

      if (!deployResult.success) {
        throw new Error(deployResult.error || "Failed to deploy to Vercel")
      }

      addLog("Vercel deployment initiated", "success")
      setDeploymentProgress(deploymentAction === "both" ? 70 : 30)

      // Store the deployment ID for polling
      if (deployResult.deploymentId) {
        setProjectId(deployResult.deploymentId)
        setDeploymentId(deployResult.deploymentId)

        // Start polling for deployment status
        const stopStatusPolling = await vercelService.pollDeploymentStatus(
          deployResult.deploymentId,
          (status) => {
            // Update progress based on status
            let progressValue = 0

            switch (status.readyState) {
              case "INITIALIZING":
                progressValue = deploymentAction === "both" ? 75 : 40
                setDeploymentProgress(progressValue)
                setStatusMessage("Initializing deployment...")
                addLog("Initializing deployment...", "info")
                break
              case "ANALYZING":
                progressValue = deploymentAction === "both" ? 80 : 50
                setDeploymentProgress(progressValue)
                setStatusMessage("Analyzing project...")
                addLog("Analyzing project...", "info")
                break
              case "BUILDING":
                progressValue = deploymentAction === "both" ? 85 : 70
                setDeploymentProgress(progressValue)
                setStatusMessage("Building project...")
                addLog("Building project...", "info")
                break
              case "DEPLOYING":
                progressValue = deploymentAction === "both" ? 95 : 90
                setDeploymentProgress(progressValue)
                setStatusMessage("Finalizing deployment...")
                addLog("Finalizing deployment...", "info")
                break
              case "READY":
                setDeploymentProgress(100)
                setStatusMessage("Deployment complete!")
                addLog("Deployment complete!", "success")
                break
              case "ERROR":
                setDeploymentStatus("error")
                setStatusMessage("Deployment failed")
                addLog("Deployment failed", "error")
                break
              default:
                addLog(`Deployment status: ${status.readyState}`, "info")
            }
          },
          (error) => {
            setDeploymentStatus("error")
            setStatusMessage(`Error: ${error}`)
            addLog(`Error: ${error}`, "error")
          },
          (url) => {
            setDeploymentStatus("success")
            setStatusMessage("Deployment successful!")
            setDeploymentUrl(url)
            addLog(`Deployment URL: ${url}`, "success")
          },
        )

        // Start polling for deployment logs
        const stopLogsPolling = await vercelService.pollDeploymentLogs(
          deployResult.deploymentId,
          (newLogs) => {
            // Process and add new logs
            newLogs.forEach((log) => {
              if (log.type === "stdout" || log.type === "stderr") {
                const logType = log.type === "stderr" ? "error" : "info"
                addLog(log.payload.text, logType)
              }
            })
          },
          (error) => {
            addLog(`Error fetching logs: ${error}`, "error")
          },
        )

        // Clean up polling when component unmounts
        return () => {
          stopStatusPolling()
          stopLogsPolling()
        }
      }
    } catch (error) {
      console.error("Deployment error:", error)
      setDeploymentStatus("error")
      setStatusMessage(error instanceof Error ? error.message : "An unknown error occurred")
      addLog(error instanceof Error ? error.message : "An unknown error occurred", "error")
    }
  }

  const handleAction = async () => {
    if (deploymentAction === "push") {
      await handlePushToGithub()
    } else if (deploymentAction === "deploy") {
      if (!isGithubAuthenticated && !existingRepoUrl) {
        setDeploymentStatus("error")
        setStatusMessage("Please connect your GitHub account or provide a repository URL")
        addLog("Deployment failed: Missing GitHub authentication or repository URL", "error")
        return
      }
      await handleDeployToVercel(existingRepoUrl)
    } else if (deploymentAction === "both") {
      try {
        // Reset logs
        setLogs([])

        setDeploymentStatus("pushing")
        setStatusMessage("Creating GitHub repository...")
        setDeploymentProgress(10)
        addLog("Starting deployment process...", "info")
        addLog("Creating GitHub repository...", "info")

        // 1. Create GitHub repository
        const repoResult = await githubService.createRepository({
          name: repoName,
          description: `Portfolio website for ${templateData.name}`,
          private: false,
        })

        if (!repoResult.success) {
          throw new Error(repoResult.error || "Failed to create GitHub repository")
        }

        setRepoUrl(repoResult.repoUrl || "")
        addLog(`GitHub repository created: ${repoResult.repoUrl}`, "success")
        setDeploymentProgress(30)

        // 2. Push template files to repository
        setStatusMessage("Pushing template files to repository...")
        addLog("Pushing template files to repository...", "info")

        const pushResult = await githubService.pushTemplateToRepo(repoName, templateData)

        if (!pushResult.success) {
          throw new Error(pushResult.error || "Failed to push template files to repository")
        }

        addLog("Template files pushed to repository", "success")
        setDeploymentProgress(50)

        // 3. Deploy to Vercel
        await handleDeployToVercel(repoResult.repoUrl || "")
      } catch (error) {
        console.error("Deployment error:", error)
        setDeploymentStatus("error")
        setStatusMessage(error instanceof Error ? error.message : "An unknown error occurred")
        addLog(error instanceof Error ? error.message : "An unknown error occurred", "error")
      }
    }
  }

  const resetDeployment = () => {
    setDeploymentStatus("idle")
    setStatusMessage("")
    setDeploymentUrl("")
    setRepoUrl("")
    setDeploymentProgress(0)
    setLogs([])
    setProjectId("")
    setDeploymentId("")
    setDeployWithVercel(false)
  }

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>GitHub & Vercel Integration</DialogTitle>
            <DialogDescription>Push your portfolio to GitHub and deploy to Vercel.</DialogDescription>
          </DialogHeader>

          {deploymentStatus === "idle" ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="github" disabled={isGithubAuthenticated && activeTab !== "github"}>
                  <Github className="h-4 w-4 mr-2" />
                  GitHub
                </TabsTrigger>
                <TabsTrigger value="vercel" disabled={isVercelAuthenticated && activeTab !== "vercel"}>
                  <Vercel className="h-4 w-4 mr-2" />
                  Vercel
                </TabsTrigger>
                <TabsTrigger value="deploy">Actions</TabsTrigger>
              </TabsList>

              <TabsContent value="github" className="space-y-4">
                <div className="space-y-4">
                  {isGithubAuthenticated ? (
                    <div className="space-y-4">
                      <Alert
                        variant="success"
                        className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900"
                      >
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <AlertTitle className="text-green-800 dark:text-green-300">Connected to GitHub</AlertTitle>
                        <AlertDescription className="text-green-700 dark:text-green-400">
                          You are connected as <strong>{githubUsername}</strong>
                        </AlertDescription>
                      </Alert>

                      <Button variant="destructive" onClick={handleClearGithubToken} className="w-full">
                        <LogOut className="h-4 w-4 mr-2" />
                        Disconnect GitHub Account
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="github-token">GitHub Personal Access Token</Label>
                        <Input
                          id="github-token"
                          type="password"
                          value={githubToken}
                          onChange={(e) => setGithubToken(e.target.value)}
                          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                        />
                        <p className="text-xs text-muted-foreground">
                          Create a token with 'repo' scope at{" "}
                          <a
                            href="https://github.com/settings/tokens/new"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            GitHub Settings
                          </a>
                        </p>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="github-username">GitHub Username</Label>
                        <Input
                          id="github-username"
                          value={githubUsername}
                          onChange={(e) => setGithubUsername(e.target.value)}
                          placeholder="your-username"
                        />
                      </div>

                      <Button
                        onClick={handleGithubConnect}
                        disabled={!githubToken || !githubUsername}
                        className="w-full"
                      >
                        Connect GitHub
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="vercel" className="space-y-4">
                <div className="space-y-4">
                  {isVercelAuthenticated ? (
                    <div className="space-y-4">
                      <Alert
                        variant="success"
                        className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900"
                      >
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <AlertTitle className="text-green-800 dark:text-green-300">Connected to Vercel</AlertTitle>
                        <AlertDescription className="text-green-700 dark:text-green-400">
                          Your Vercel account is connected and ready for deployments.
                        </AlertDescription>
                      </Alert>

                      <Button variant="destructive" onClick={handleClearVercelToken} className="w-full">
                        <LogOut className="h-4 w-4 mr-2" />
                        Disconnect Vercel Account
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="vercel-token">Vercel Access Token</Label>
                        <Input
                          id="vercel-token"
                          type="password"
                          value={vercelToken}
                          onChange={(e) => setVercelToken(e.target.value)}
                          placeholder="vercel_xxxxxxxxxxxxxxxxxxxx"
                        />
                        <p className="text-xs text-muted-foreground">
                          Create a token at{" "}
                          <a
                            href="https://vercel.com/account/tokens"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            Vercel Account Settings
                          </a>
                        </p>
                      </div>

                      <Button onClick={handleVercelConnect} disabled={!vercelToken} className="w-full">
                        Connect Vercel
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="deploy" className="space-y-4">
                <div className="space-y-4">
                  {!isGithubAuthenticated && !isVercelAuthenticated && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Missing connections</AlertTitle>
                      <AlertDescription>
                        {!isGithubAuthenticated && !isVercelAuthenticated
                          ? "Please connect both GitHub and Vercel accounts."
                          : !isGithubAuthenticated
                            ? "Please connect your GitHub account."
                            : "Please connect your Vercel account for deployments."}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid gap-4 pt-4">
                    <Label>Choose Action</Label>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between space-x-2">
                        <div className="flex flex-col">
                          <Label htmlFor="push-only" className="cursor-pointer">
                            Push to GitHub only
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Create a repository and push your code without deploying
                          </p>
                        </div>
                        <input
                          type="radio"
                          id="push-only"
                          name="deployment-action"
                          checked={deploymentAction === "push"}
                          onChange={() => setDeploymentAction("push")}
                          className="h-4 w-4 text-primary"
                        />
                      </div>

                      <div className="flex items-center justify-between space-x-2">
                        <div className="flex flex-col">
                          <Label htmlFor="deploy-only" className="cursor-pointer">
                            Deploy to Vercel only
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Deploy an existing GitHub repository to Vercel
                          </p>
                        </div>
                        <input
                          type="radio"
                          id="deploy-only"
                          name="deployment-action"
                          checked={deploymentAction === "deploy"}
                          onChange={() => setDeploymentAction("deploy")}
                          className="h-4 w-4 text-primary"
                        />
                      </div>

                      <div className="flex items-center justify-between space-x-2">
                        <div className="flex flex-col">
                          <Label htmlFor="push-and-deploy" className="cursor-pointer">
                            Push and Deploy
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Create a repository, push your code, and deploy to Vercel
                          </p>
                        </div>
                        <input
                          type="radio"
                          id="push-and-deploy"
                          name="deployment-action"
                          checked={deploymentAction === "both"}
                          onChange={() => setDeploymentAction("both")}
                          className="h-4 w-4 text-primary"
                        />
                      </div>
                    </div>
                  </div>

                  {deploymentAction === "push" ? (
                    <div className="grid gap-2">
                      <Label htmlFor="repo-name">Repository Name</Label>
                      <Input id="repo-name" value={repoName} onChange={(e) => setRepoName(e.target.value)} />
                    </div>
                  ) : deploymentAction === "deploy" ? (
                    <div className="grid gap-2">
                      <Label htmlFor="existing-repo">GitHub Repository URL</Label>
                      <Input
                        id="existing-repo"
                        value={existingRepoUrl}
                        onChange={(e) => setExistingRepoUrl(e.target.value)}
                        placeholder="https://github.com/username/repo"
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter the full URL of the GitHub repository you want to deploy
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      <Label htmlFor="repo-name">Repository Name</Label>
                      <Input id="repo-name" value={repoName} onChange={(e) => setRepoName(e.target.value)} />
                    </div>
                  )}

                  <div className="grid gap-2 pt-4">
                    <Label>Connection Status</Label>
                    <div className="p-4 border rounded-md bg-muted/50 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">GitHub:</span>
                        <span className="text-sm font-medium">
                          {isGithubAuthenticated ? (
                            <span className="text-green-600 flex items-center">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Connected as {githubUsername}
                            </span>
                          ) : (
                            <span className="text-red-600">Not connected</span>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Vercel:</span>
                        <span className="text-sm font-medium">
                          {isVercelAuthenticated ? (
                            <span className="text-green-600 flex items-center">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Connected
                            </span>
                          ) : (
                            <span className="text-red-600">Not connected</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleAction}
                    disabled={
                      (deploymentAction !== "deploy" && !isGithubAuthenticated) ||
                      (deploymentAction !== "push" && !isVercelAuthenticated) ||
                      (deploymentAction === "deploy" && !existingRepoUrl && !isGithubAuthenticated) ||
                      (deploymentAction !== "deploy" && !repoName)
                    }
                    className="w-full"
                  >
                    {deploymentAction === "push" ? (
                      <>
                        <Github className="h-4 w-4 mr-2" />
                        Push to GitHub
                      </>
                    ) : deploymentAction === "deploy" ? (
                      <>
                        <Vercel className="h-4 w-4 mr-2" />
                        Deploy to Vercel
                      </>
                    ) : (
                      <>
                        <Github className="h-4 w-4 mr-2" />
                        Push and Deploy
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">
                    {deploymentStatus === "pushing"
                      ? "Pushing to GitHub"
                      : deploymentStatus === "deploying"
                        ? "Deploying to Vercel"
                        : deploymentStatus === "success"
                          ? "Operation successful"
                          : "Operation failed"}
                  </h3>
                  <span className="text-sm text-muted-foreground">{statusMessage}</span>
                </div>

                <Progress value={deploymentProgress} className="h-2" />
              </div>

              {/* Deployment Logs */}
              <div className="space-y-2">
                <Label>Process Logs</Label>
                <DeploymentLogs logs={logs} />
              </div>

              {deploymentStatus === "success" && (
                <div className="space-y-4">
                  {repoUrl && (
                    <div className="p-4 border rounded-md bg-green-50 dark:bg-green-900/20">
                      <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">GitHub Repository</h4>
                      <p className="text-sm text-green-700 dark:text-green-400 mb-3">Your code is available at:</p>
                      <div className="flex items-center">
                        <a
                          href={repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 block p-2 bg-white dark:bg-black border rounded text-primary hover:underline text-sm break-all"
                        >
                          {repoUrl}
                        </a>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="ml-2"
                              onClick={() => copyToClipboard(repoUrl)}
                            >
                              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{copied ? "Copied!" : "Copy URL"}</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  )}

                  {deploymentUrl && (
                    <div className="p-4 border rounded-md bg-green-50 dark:bg-green-900/20">
                      <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">Vercel Deployment</h4>
                      <p className="text-sm text-green-700 dark:text-green-400 mb-3">Your portfolio is now live at:</p>
                      <div className="flex items-center">
                        <a
                          href={deploymentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 block p-2 bg-white dark:bg-black border rounded text-primary hover:underline text-sm break-all"
                        >
                          {deploymentUrl}
                        </a>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="ml-2"
                              onClick={() => copyToClipboard(deploymentUrl)}
                            >
                              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{copied ? "Copied!" : "Copy URL"}</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  )}

                  {repoUrl && deployWithVercel && !deploymentUrl && (
                    <div className="p-4 border rounded-md bg-blue-50 dark:bg-blue-900/20">
                      <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">One-Click Vercel Deployment</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-400 mb-3">
                        Deploy your GitHub repository to Vercel with one click:
                      </p>
                      <div className="flex flex-col space-y-3">
                        <a
                          href={createVercelDeployUrl()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 p-3 bg-black hover:bg-gray-900 text-white font-medium rounded-md text-sm"
                        >
                          <Vercel className="h-4 w-4" />
                          Deploy with Vercel
                        </a>

                        <p className="text-xs text-blue-600 dark:text-blue-300 text-center">
                          You'll be redirected to Vercel to complete the deployment process
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {deploymentStatus === "idle" ? (
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            ) : deploymentStatus === "success" || deploymentStatus === "error" ? (
              <div className="flex gap-2 w-full">
                <Button variant="outline" onClick={resetDeployment} className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={onClose} className="flex-1">
                  {deploymentStatus === "success" ? "Done" : "Close"}
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={onClose} disabled>
                Cancel
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}

