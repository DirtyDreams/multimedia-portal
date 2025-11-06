"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CallToAction() {
  return (
    <section className="py-24 md:py-32 bg-gradient-to-br from-blue-600 to-purple-600">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-8"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
            Ready to Start Creating?
          </h2>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto">
            Join thousands of creators who are already sharing their stories,
            knowledge, and creativity with the world.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/register">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent border-white text-white hover:bg-white hover:text-purple-600"
              asChild
            >
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
