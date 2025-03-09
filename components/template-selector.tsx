"use client"

import Image from "next/image"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface TemplateSelectorProps {
  onSelect: (templateId: number) => void
}

export default function TemplateSelector({ onSelect }: TemplateSelectorProps) {
  return (
    <div className="container mx-auto py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose a Portfolio Template</h1>
        <p className="text-xl text-muted-foreground">
          Select one of our professionally designed templates to get started
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <Card className="overflow-hidden">
          <div className="relative h-[300px] overflow-hidden">
            <Image
              src="/placeholder.svg?height=300&width=400"
              alt="Minimal template preview"
              fill
              className="object-cover transition-transform hover:scale-105"
            />
          </div>
          <CardHeader>
            <CardTitle>Minimal</CardTitle>
            <CardDescription>A clean, minimalist design that puts your work front and center</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" onClick={() => onSelect(1)}>
              Select Template
            </Button>
          </CardFooter>
        </Card>

        <Card className="overflow-hidden">
          <div className="relative h-[300px] overflow-hidden">
            <Image
              src="/placeholder.svg?height=300&width=400"
              alt="Creative template preview"
              fill
              className="object-cover transition-transform hover:scale-105"
            />
          </div>
          <CardHeader>
            <CardTitle>Creative</CardTitle>
            <CardDescription>An artistic layout showcasing your personality and creative skills</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" onClick={() => onSelect(2)}>
              Select Template
            </Button>
          </CardFooter>
        </Card>

        <Card className="overflow-hidden">
          <div className="relative h-[300px] overflow-hidden">
            <Image
              src="/placeholder.svg?height=300&width=400"
              alt="Professional template preview"
              fill
              className="object-cover transition-transform hover:scale-105"
            />
          </div>
          <CardHeader>
            <CardTitle>Professional</CardTitle>
            <CardDescription>A sophisticated, business-focused design that exudes professionalism</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" onClick={() => onSelect(3)}>
              Select Template
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

