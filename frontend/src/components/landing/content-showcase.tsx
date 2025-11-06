"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, FileText, Image, Book } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const contentTypes = [
  {
    id: "articles",
    label: "Articles",
    icon: FileText,
    description: "In-depth articles on various topics",
    items: [
      {
        title: "Getting Started with Web Development",
        description: "A comprehensive guide for beginners to start their journey in web development.",
        category: "Technology",
      },
      {
        title: "The Art of Photography",
        description: "Learn the fundamentals of photography and capture stunning images.",
        category: "Creative",
      },
    ],
  },
  {
    id: "blog",
    label: "Blog Posts",
    icon: BookOpen,
    description: "Regular updates and insights",
    items: [
      {
        title: "10 Tips for Better Writing",
        description: "Improve your writing skills with these practical tips and techniques.",
        category: "Writing",
      },
      {
        title: "Productivity Hacks for 2024",
        description: "Boost your productivity with these proven strategies and tools.",
        category: "Lifestyle",
      },
    ],
  },
  {
    id: "gallery",
    label: "Gallery",
    icon: Image,
    description: "Visual stories and collections",
    items: [
      {
        title: "Urban Architecture Collection",
        description: "Stunning photographs of modern architecture from around the world.",
        category: "Photography",
      },
      {
        title: "Nature's Beauty",
        description: "Breathtaking landscapes and wildlife photography.",
        category: "Nature",
      },
    ],
  },
  {
    id: "wiki",
    label: "Wiki",
    icon: Book,
    description: "Knowledge base and documentation",
    items: [
      {
        title: "JavaScript Fundamentals",
        description: "Complete guide to JavaScript basics and advanced concepts.",
        category: "Programming",
      },
      {
        title: "Design Principles",
        description: "Essential design principles every designer should know.",
        category: "Design",
      },
    ],
  },
];

export function ContentShowcase() {
  const [activeTab, setActiveTab] = useState(contentTypes[0].id);

  const activeContent = contentTypes.find((type) => type.id === activeTab);

  return (
    <section className="py-24 md:py-32 bg-zinc-50 dark:bg-zinc-950">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Explore Our
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {" "}
              Content Types
            </span>
          </h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Discover the variety of content you can create and share on our platform.
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {contentTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setActiveTab(type.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === type.id
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                    : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{type.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Cards */}
        <AnimatePresence mode="wait">
          {activeContent && (
            <motion.div
              key={activeContent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto"
            >
              {activeContent.items.map((item, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">
                      {item.category}
                    </div>
                    <CardTitle>{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {item.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
