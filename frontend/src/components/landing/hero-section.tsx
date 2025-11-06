"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-blue-950">
      <div className="container mx-auto px-4 py-24 md:py-32 lg:py-40">
        <div className="flex flex-col items-center text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Welcome to
              </span>
              <br />
              <span className="text-zinc-900 dark:text-zinc-50">
                Multimedia Portal
              </span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto">
              Your ultimate destination for articles, blogs, wiki knowledge,
              stunning galleries, and creative stories. Join our community of
              content creators and readers today.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button size="lg" asChild>
              <Link href="/register">Get Started Free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/blog">Explore Content</Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="pt-8"
          >
            <div className="grid grid-cols-3 gap-8 md:gap-16 text-center">
              <div>
                <div className="text-3xl md:text-4xl font-bold text-blue-600">
                  1000+
                </div>
                <div className="text-sm md:text-base text-zinc-600 dark:text-zinc-400">
                  Articles
                </div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-purple-600">
                  500+
                </div>
                <div className="text-sm md:text-base text-zinc-600 dark:text-zinc-400">
                  Authors
                </div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-pink-600">
                  5000+
                </div>
                <div className="text-sm md:text-base text-zinc-600 dark:text-zinc-400">
                  Readers
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />
      </div>
    </section>
  );
}
