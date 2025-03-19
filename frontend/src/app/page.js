'use client'
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Mail, Database, Shield, Cloud, Zap, Check, Sparkles, BarChart, ChevronRight, Play, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence, useScroll, useTransform, useMotionTemplate, useSpring } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'

// Modern Light Mode Components
const GradientCard = ({ children, className = "" }) => (
  <div className={`relative rounded-3xl p-0.5 overflow-hidden group ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-purple-100 opacity-70 group-hover:opacity-100 transition-opacity duration-300"></div>
    <div className="relative bg-white rounded-[1.45rem] p-8 h-full z-10 shadow-lg">
      {children}
    </div>
  </div>
);

const Pill = ({ children, className = "" }) => (
  <div className={`inline-flex items-center rounded-full bg-gray-100 px-4 py-1.5 text-sm border border-gray-200 ${className}`}>
    {children}
  </div>
);

const ShimmerButton = ({ children, className = "", href = "#" }) => (
  <Link href={href}>
    <button className={`relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-indigo-200 ${className}`}>
      <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E0E7FF_0%,#6366F1_50%,#E0E7FF_100%)]" />
      <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-indigo-600 px-6 py-1 text-sm font-medium text-white backdrop-blur-3xl hover:bg-indigo-700 transition-colors">
        {children}
      </span>
    </button>
  </Link>
);

const GradientText = ({ children, className = "" }) => (
  <span className={`bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 ${className}`}>
    {children}
  </span>
);

const FeatureCard = ({ icon, title, description }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    viewport={{ once: true }}
    className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
  >
    <div className="mb-4 rounded-full bg-indigo-50 p-3 w-fit text-indigo-600">
      {icon}
    </div>
    <h3 className="text-xl font-semibold mb-2 text-gray-900">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </motion.div>
);

// Animated Cursor
const AnimatedCursor = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [cursorHidden, setCursorHidden] = useState(true);

  useEffect(() => {
    const updateMousePosition = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      setCursorHidden(false);
    };

    const handleMouseLeave = () => setCursorHidden(true);
    const handleMouseEnter = () => setCursorHidden(false);

    window.addEventListener("mousemove", updateMousePosition);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      window.removeEventListener("mousemove", updateMousePosition);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, []);

  const springConfig = { damping: 25, stiffness: 150 };
  const xSpring = useSpring(mousePosition.x, springConfig);
  const ySpring = useSpring(mousePosition.y, springConfig);

  return (
    <AnimatePresence>
      {!cursorHidden && (
        <motion.div
          className="fixed top-0 left-0 w-8 h-8 pointer-events-none mix-blend-difference z-50"
          style={{
            x: xSpring,
            y: ySpring,
            translateX: "-50%",
            translateY: "-50%",
          }}
        >
          <motion.div 
            className="w-full h-full rounded-full bg-gray-800 opacity-30"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.3 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// 3D Tilt Card
const TiltCard = ({ children, className = "" }) => {
  const cardRef = useRef(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateXValue = (y - centerY) / 10;
    const rotateYValue = -(x - centerX) / 10;
    
    setRotateX(rotateXValue);
    setRotateY(rotateYValue);
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      ref={cardRef}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: "preserve-3d",
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transition: isHovering ? "none" : "transform 0.5s ease-out",
      }}
    >
      <motion.div
        style={{
          transformStyle: "preserve-3d",
          transform: `translateZ(${isHovering ? 20 : 0}px)`,
          transition: isHovering ? "none" : "transform 0.5s ease-out",
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

// Marquee Text
const MarqueeText = ({ children, className = "", direction = "left", speed = 30 }) => {
  const marqueeVariants = {
    animate: {
      x: direction === "left" ? [0, -1000] : [-1000, 0],
      transition: {
        x: {
          repeat: Infinity,
          repeatType: "loop",
          duration: 1000 / speed,
          ease: "linear",
        },
      },
    },
  };

  return (
    <div className={`overflow-hidden whitespace-nowrap ${className}`}>
      <motion.div
        variants={marqueeVariants}
        animate="animate"
        className="inline-block"
      >
        {children}
        <span className="inline-block mx-4">•</span>
        {children}
        <span className="inline-block mx-4">•</span>
      </motion.div>
    </div>
  );
};

// Sticky Scroll Section Component
const StickyScrollSection = ({ children, title, description }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ 
    target: ref,
    offset: ["start start", "end start"] 
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5, 0.9], [0, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.95, 1]);
  const position = useTransform(scrollYProgress, (pos) => Math.min(pos * 300, 300));

  return (
    <section ref={ref} className="min-h-[150vh] relative">
      <div className="sticky top-0 pt-32 pb-20 h-screen overflow-hidden bg-white">
        <motion.div 
          className="max-w-screen-xl mx-auto px-6"
          style={{ opacity, scale, y: position }}
        >
          <div className="mb-12 max-w-3xl">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">{title}</h2>
            <p className="text-xl text-gray-600">{description}</p>
          </div>
          {children}
        </motion.div>
      </div>
    </section>
  );
};

// Floating Icons Animation - Light Mode (Fixed for Hydration)
const FloatingIcons = () => {
  // Predefined positions to prevent hydration errors
  const positions = [
    { x: "10%", y: "20%" },
    { x: "-15%", y: "35%" },
    { x: "25%", y: "-15%" },
    { x: "-20%", y: "-25%" }, 
    { x: "30%", y: "25%" },
    { x: "-25%", y: "-10%" }
  ];

  const icons = [
    <Mail key="mail" className="h-8 w-8 text-indigo-400" />,
    <Database key="database" className="h-8 w-8 text-purple-400" />,
    <Shield key="shield" className="h-8 w-8 text-indigo-300" />,
    <Cloud key="cloud" className="h-8 w-8 text-purple-300" />,
    <Zap key="zap" className="h-8 w-8 text-indigo-400" />,
    <BarChart key="chart" className="h-8 w-8 text-purple-400" />
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {icons.map((icon, index) => {
        const pos = positions[index % positions.length];
        
        return (
          <motion.div
            key={index}
            className="absolute rounded-full bg-white p-3 shadow-md"
            initial={{ 
              x: pos.x, 
              y: pos.y, 
              opacity: 0 
            }}
            animate={{ 
              x: [pos.x, `calc(${pos.x} + 10%)`, `calc(${pos.x} - 5%)`],
              y: [pos.y, `calc(${pos.y} - 10%)`, `calc(${pos.y} + 15%)`],
              opacity: [0.3, 0.8, 0.3]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 20 + (index * 2),
              delay: index * 2 
            }}
          >
            {icon}
          </motion.div>
        );
      })}
    </div>
  );
};

export default function Home() {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const scrollRef = useRef(null);
  const { scrollYProgress } = useScroll();
  
  // Progress bar at the top of the page
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Stats data
  const stats = [
    { number: "500+", label: "Manufacturers Connected" },
    { number: "1M+", label: "Orders Processed" },
    { number: "10x", label: "Faster Processing" }
  ];

  // Features data
  const features = [
    {
      icon: <Mail className="h-6 w-6 text-indigo-600" />,
      title: "AI Email Processing",
      description: "Extract order details automatically with natural language processing"
    },
    {
      icon: <Database className="h-6 w-6 text-indigo-600" />,
      title: "Real-time Sync",
      description: "Instant data synchronization between manufacturers and retailers"
    },
    {
      icon: <Shield className="h-6 w-6 text-indigo-600" />,
      title: "Bank-grade Security",
      description: "End-to-end encryption with industry-standard compliance"
    },
    {
      icon: <Cloud className="h-6 w-6 text-indigo-600" />,
      title: "Cloud Native",
      description: "Access your data securely from anywhere in the world"
    },
    {
      icon: <BarChart className="h-6 w-6 text-indigo-600" />,
      title: "Advanced Analytics",
      description: "Real-time insights into your order processing pipeline"
    },
    {
      icon: <Zap className="h-6 w-6 text-indigo-600" />,
      title: "Visual Workflow Builder",
      description: "Create custom automation workflows with drag-and-drop ease"
    }
  ];

  // Testimonials data
  const testimonials = [
    {
      quote: "This platform has transformed our order processing workflow. We've reduced processing time by 75% and virtually eliminated errors.",
      author: "Sarah Johnson",
      role: "Operations Director",
      company: "GlobalTech Manufacturing"
    },
    {
      quote: "The AI capabilities have automated tasks we never thought possible. Implementation was seamless and the results have been remarkable.",
      author: "Michael Chen",
      role: "CTO",
      company: "Precision Electronics"
    },
    {
      quote: "Working with dozens of manufacturers is now seamless. This platform has unified our communications and improved our supply chain.",
      author: "Emma Rodriguez",
      role: "Supply Chain Manager",
      company: "Metro Retail Group"
    }
  ];

  return (
    <div className="relative bg-white text-gray-900">
      <AnimatedCursor />
      
      {/* Progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-indigo-600 z-50 origin-left"
        style={{ scaleX }}
      />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <FloatingIcons />
        
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-indigo-50 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 h-[400px] bg-gradient-to-t from-white to-transparent"></div>
        </div>
        
        <div className="container mx-auto px-6 relative z-10 pt-32 pb-20">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <Pill className="mb-6 bg-indigo-50 border-indigo-100 text-indigo-600">
              <Sparkles className="h-4 w-4 mr-2" />
              <span>Revolutionizing Email Workflow</span>
            </Pill>
            
            <motion.h1
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 tracking-tight text-gray-900"
            >
              Transform Your <GradientText>Email Processing</GradientText>
              <br />With AI-Powered <GradientText>Automation</GradientText>
            </motion.h1>
            
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-12"
            >
              Intelligent email processing for manufacturers and retailers. 
              Speed up order processing, eliminate errors, and streamline communication.
            </motion.p>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="flex flex-wrap justify-center gap-4"
            >
              <ShimmerButton href="/signup">
                Start Free Trial
              </ShimmerButton>
              
              <Button 
                className="flex items-center h-12 px-6 rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-gray-700"
                onClick={() => setIsVideoPlaying(true)}
              >
                <Play className="h-5 w-5 mr-2 text-indigo-600" />
                Watch Demo
              </Button>
              
              <Link href="/retailers/register">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative group"
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-green-400 to-blue-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-200"></div>
                  <Button className="relative h-12 px-6 rounded-full flex items-center bg-gradient-to-r from-green-500 to-blue-600 text-white border-0">
                    <Users className="h-5 w-5 mr-2" />
                    Register as Retailer
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>

          <div className="flex justify-center">
            <TiltCard className="w-full max-w-5xl">
              <GradientCard>
                <div className="rounded-xl overflow-hidden border border-gray-100">
                  <img 
                    src="/canvas-preview.png" 
                    alt="Platform Preview" 
                    className="w-full h-auto object-cover"
                  />
                </div>
              </GradientCard>
            </TiltCard>
          </div>
        </div>
        
        <MarqueeText className="absolute bottom-12 left-0 right-0 text-gray-400 text-lg font-medium" speed={15}>
          AI-POWERED — REAL-TIME — SECURE — CLOUD NATIVE — AUTOMATED — INTELLIGENT — COLLABORATIVE
        </MarqueeText>
      </section>
      
      {/* Stats Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-white to-indigo-50">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className="flex flex-col items-center justify-center p-8 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <span className="text-5xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                  {stat.number}
                </span>
                <span className="text-gray-600">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <StickyScrollSection 
        title={<>Our <GradientText>Powerful</GradientText> Platform</>}
        description="A comprehensive solution designed to transform how manufacturers and retailers process emails and orders."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard 
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </StickyScrollSection>
      
      {/* Workflow Builder Section */}
      <section className="py-32 px-6 relative bg-gradient-to-b from-indigo-50 to-white overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-[50%] -left-[10%] w-[70%] h-[70%] rounded-full bg-indigo-100/50 blur-3xl"></div>
          <div className="absolute -bottom-[30%] -right-[10%] w-[60%] h-[60%] rounded-full bg-purple-100/50 blur-3xl"></div>
        </div>
        
        <div className="container mx-auto relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <Pill className="mb-6 bg-indigo-50 border-indigo-100 text-indigo-600">
                <Sparkles className="h-4 w-4 mr-2" />
                <span>Visual Builder</span>
              </Pill>
              
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-4xl md:text-5xl font-bold mb-6 text-gray-900"
              >
                Create <GradientText>Complex Workflows</GradientText> Without Coding
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                viewport={{ once: true }}
                className="text-xl text-gray-600 mb-8"
              >
                Our intuitive visual builder lets you automate your email processing with
                drag-and-drop simplicity. Connect actions, create conditions, and design
                workflows that match your business needs.
              </motion.p>
              
              <div className="space-y-4 mb-10">
                {[
                  "Drag-and-drop interface for custom workflows",
                  "Pre-built templates for common scenarios",
                  "Real-time collaboration with your team",
                  "Version control and rollback options"
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index + 0.4, duration: 0.5 }}
                    viewport={{ once: true }}
                    className="flex items-start"
                  >
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center mr-3">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-gray-700">{item}</span>
                  </motion.div>
                ))}
              </div>
              
              <ShimmerButton href="/workflow">
                <span className="flex items-center">
                  Try Visual Builder
                  <ChevronRight className="ml-2 h-4 w-4" />
                </span>
              </ShimmerButton>
            </div>
            
            <TiltCard>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="rounded-2xl overflow-hidden border border-gray-200 shadow-xl"
              >
                <img 
                  src="/canvas-preview.png" 
                  alt="Workflow Canvas" 
                  className="w-full h-auto"
                />
              </motion.div>
            </TiltCard>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 px-6 relative bg-gray-50">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[300px] bg-gradient-to-b from-white to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 h-[300px] bg-gradient-to-t from-gray-50 to-transparent"></div>
        </div>
        
        <div className="container mx-auto relative">
          <div className="text-center mb-20">
            <Pill className="mb-6 bg-indigo-50 border-indigo-100 text-indigo-600">
              <Sparkles className="h-4 w-4 mr-2" />
              <span>Client Success</span>
            </Pill>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold mb-6 text-gray-900"
            >
              Trusted by <GradientText>Industry Leaders</GradientText>
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              viewport={{ once: true }}
              className="text-xl text-gray-600 max-w-3xl mx-auto"
            >
              See how our platform is transforming businesses across industries
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="mb-6">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="inline-block mr-1 text-indigo-400">★</span>
                  ))}
                </div>
                <p className="text-gray-700 mb-8 italic">"{testimonial.quote}"</p>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 mr-4"></div>
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.author}</h4>
                    <p className="text-sm text-gray-500">{testimonial.role}, {testimonial.company}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 relative bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="container mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <GradientCard className="p-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
                Ready to Transform Your <GradientText>Workflow?</GradientText>
            </h2>
              
              <p className="text-xl text-gray-600 mb-10">
                Join hundreds of forward-thinking companies already using our platform to streamline their operations.
              </p>
              
              <div className="flex flex-wrap justify-center gap-6">
                <ShimmerButton href="/signup">
                  Start Free Trial
                </ShimmerButton>
                
                <Link href="/contact">
                  <button className="h-12 px-6 rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-gray-700">
                    Schedule a Demo
                  </button>
                </Link>
              </div>
            </GradientCard>
          </motion.div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-20 px-6 bg-gray-50">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div>
              <h3 className="text-xl font-bold mb-6 text-gray-900">Company</h3>
              <ul className="space-y-3">
                <li><Link href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">About Us</Link></li>
                <li><Link href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Careers</Link></li>
                <li><Link href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-6 text-gray-900">Product</h3>
              <ul className="space-y-3">
                <li><Link href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Features</Link></li>
                <li><Link href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Pricing</Link></li>
                <li><Link href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Integrations</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-6 text-gray-900">Resources</h3>
              <ul className="space-y-3">
                <li><Link href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Documentation</Link></li>
                <li><Link href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Support</Link></li>
                <li><Link href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">API</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-6 text-gray-900">Legal</h3>
              <ul className="space-y-3">
                <li><Link href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Terms of Service</Link></li>
                <li><Link href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-gray-200 text-center">
            <p className="text-gray-500">© {new Date().getFullYear()} Your Company. All rights reserved.</p>
          </div>
        </div>
      </footer>
      
      {/* Video Modal */}
      <AnimatePresence>
        {isVideoPlaying && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/90 flex items-center justify-center z-50 p-6"
            onClick={() => setIsVideoPlaying(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl bg-white"
              onClick={e => e.stopPropagation()}
            >
              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                <p className="text-gray-500">Video Player Placeholder</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

