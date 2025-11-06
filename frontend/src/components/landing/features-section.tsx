"use client";

import { motion } from "framer-motion";
import {
  FileText,
  MessageSquare,
  Star,
  Smartphone,
  Search,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: FileText,
    title: "Rich Content Management",
    description:
      "Create and manage articles, blog posts, wiki pages, galleries, and stories all in one place.",
  },
  {
    icon: MessageSquare,
    title: "Comments & Engagement",
    description:
      "Foster community discussions with threaded comments and real-time interactions across all content types.",
  },
  {
    icon: Star,
    title: "Ratings & Reviews",
    description:
      "Let your audience rate and review content with our intuitive rating system.",
  },
  {
    icon: Smartphone,
    title: "Responsive Design",
    description:
      "Beautiful, mobile-first design that works seamlessly across all devices and screen sizes.",
  },
  {
    icon: Search,
    title: "SEO Optimized",
    description:
      "Built-in SEO best practices to help your content rank higher in search results.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Track your content performance with comprehensive analytics and insights.",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function FeaturesSection() {
  return (
    <section className="py-24 md:py-32 bg-white dark:bg-zinc-900">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need to
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {" "}
              Create and Share
            </span>
          </h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Powerful features designed to help you create, manage, and grow your content platform.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div key={feature.title} variants={item}>
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="mb-4 w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
