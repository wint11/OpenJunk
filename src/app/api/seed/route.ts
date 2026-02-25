import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Create users
    const user = await prisma.user.upsert({
      where: { email: 'demo@example.com' },
      update: {},
      create: {
        email: 'demo@example.com',
        name: 'Demo User',
      },
    })

    // Create novels
    const novel1 = await prisma.novel.create({
      data: {
        title: 'The Beginning After The End',
        author: 'TurtleMe',
        description: 'King Grey has unrivaled strength, wealth, and prestige in a world governed by martial ability. However, solitude lingers closely behind those with great power.',
        category: 'Fantasy',
        coverUrl: 'https://placehold.co/400x600/png?text=TBATE',
        chapters: {
          create: [
            {
              title: 'Chapter 1: The King',
              content: 'This is the content of chapter 1. It was a dark and stormy night...',
              order: 1,
            },
            {
              title: 'Chapter 2: Reborn',
              content: 'This is the content of chapter 2. I opened my eyes...',
              order: 2,
            },
          ],
        },
      },
    })

    const novel2 = await prisma.novel.create({
      data: {
        title: 'Solo Leveling',
        author: 'Chugong',
        description: 'In a world where hunters, humans who possess magical abilities, must battle deadly monsters to protect the human race from certain annihilation, a notoriously weak hunter named Sung Jinwoo finds himself in a seemingly endless struggle for survival.',
        category: 'Action',
        coverUrl: 'https://placehold.co/400x600/png?text=Solo+Leveling',
        chapters: {
          create: [
            {
              title: 'Chapter 1: E-Rank Hunter',
              content: 'The E-Rank Hunter Sung Jinwoo. That was his title...',
              order: 1,
            },
          ],
        },
      },
    })

    return NextResponse.json({ success: true, data: { user, novel1, novel2 } })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
