"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { BookOpen, Flame } from "lucide-react"
import Autoplay from "embla-carousel-autoplay"

import { Button } from "@/components/ui/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Novel } from "@prisma/client"

interface HeroCarouselProps {
  novels: Novel[]
}

export function HeroCarousel({ novels }: HeroCarouselProps) {
  if (!novels || novels.length === 0) return null

  return (
    <Carousel
      opts={{
        align: "start",
        loop: true,
      }}
      plugins={[
        Autoplay({
          delay: 5000,
        }),
      ]}
      className="w-full"
    >
      <CarouselContent>
        {novels.map((novel) => (
          <CarouselItem key={novel.id}>
            <section className="relative w-full overflow-hidden bg-muted/40 py-12 md:py-20 lg:py-24">
              <div className="absolute inset-0 z-0">
                <Image
                  src={novel.coverUrl || "/placeholder.png"}
                  alt="Background"
                  fill
                  className="object-cover opacity-10 blur-3xl"
                  priority
                />
              </div>
              <div className="container mx-auto relative z-10 grid gap-8 md:grid-cols-2 md:gap-12 lg:gap-16">
                <div className="flex flex-col justify-center space-y-6">
                  <div className="inline-flex w-fit items-center rounded-full border bg-background px-3 py-1 text-sm font-medium text-primary shadow-sm">
                    <Flame className="mr-2 h-4 w-4 fill-orange-500 text-orange-500" />
                    本期推荐
                  </div>
                  <div className="space-y-4">
                    <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl line-clamp-2">
                      {novel.title}
                    </h1>
                    <p className="max-w-[600px] text-lg text-muted-foreground md:text-xl line-clamp-3">
                      {novel.description}
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 min-[400px]:flex-row">
                    <Button size="lg" className="h-12 px-8 text-base" asChild>
                      <Link href={`/novel/${novel.id}`}>
                        <BookOpen className="mr-2 h-5 w-5" />
                        阅读全文
                      </Link>
                    </Button>
                    <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
                      <Link href={`/novel/${novel.id}`}>
                        查看详情
                      </Link>
                    </Button>
                  </div>
                </div>
                <div className="hidden md:flex items-center justify-center">
                  <div className="relative aspect-[2/3] w-[260px] rotate-3 rounded-lg shadow-2xl transition-transform hover:rotate-0 md:w-[320px]">
                    <Image
                      src={novel.coverUrl || "/placeholder.png"}
                      alt={novel.title}
                      fill
                      className="rounded-lg object-cover shadow-2xl"
                      priority
                    />
                  </div>
                </div>
              </div>
            </section>
          </CarouselItem>
        ))}
      </CarouselContent>
      {novels.length > 1 && (
        <>
          <CarouselPrevious className="left-4 md:left-8" />
          <CarouselNext className="right-4 md:right-8" />
        </>
      )}
    </Carousel>
  )
}
