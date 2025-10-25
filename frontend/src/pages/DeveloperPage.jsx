import React from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Github, 
  Linkedin, 
  Globe, 
  GraduationCap,
  Code,
  Calendar,
  Award,
  Coffee,
  Heart,
  ExternalLink
} from 'lucide-react'
import { useSafeNavigation } from '../hooks/useSafeNavigation'
import Button from '../components/Button'
import Card from '../components/Card'

const DeveloperPage = () => {
  const navigate = useNavigate()
  const { goBack } = useSafeNavigation()

  const skills = [
    'React.js', 'JavaScript', 'Python', 'FastAPI', 'Node.js', 
    'SQL', 'Git', 'HTML/CSS', 'Tailwind CSS', 'SQLModel'
  ]

  const projects = [
    {
      name: 'Science Point - Coaching Center Management',
      description: 'Full-stack web application for managing coaching centers with role-based authentication, scheduling, and student management.',
      tech: ['React.js', 'FastAPI', 'SQLModel', 'JWT Auth'],
      github: 'https://github.com/NightFury-9b71/science-point',
      live: 'https://science-point.vercel.app'
    },
    {
      name: 'Personal Portfolio Website',
      description: 'Modern, responsive portfolio website showcasing projects, achievements, certifications, and club activities. Built with React and designed following SOLID principles.',
      tech: ['React.js', 'Vite', 'Tailwind CSS', 'JavaScript'],
      github: 'https://github.com/NightFury-9b71/portfolio',
      live: 'https://nomanstine.vercel.app'
    },
    {
      name: 'Boi-Adda - Book Exchange Platform',
      description: 'Full-stack web application for book lovers to exchange, share, and discover books. Features user authentication, book listings, and exchange management.',
      tech: ['Python', 'JavaScript', 'FastAPI', 'React.js'],
      github: 'https://github.com/NightFury-9b71/Boi-Adda'
    },
    {
      name: 'JUST Inventory Management System',
      description: 'University inventory management system for Jashore University of Science and Technology. Monorepo with Spring Boot backend and Next.js frontend.',
      tech: ['Java', 'Spring Boot', 'Next.js', 'TypeScript'],
      github: 'https://github.com/NightFury-9b71/Inventory'
    }
  ]

  const achievements = [
    'Computer Science Student at Jashore University of Science and Technology (JUST)',
    'Active participant in competitive programming and hackathons',
    'Full-Stack Developer with expertise in React, Python, and modern web technologies',
    'Experience in building educational technology solutions and management systems',
    'Contributor to open-source projects and collaborative development',
    'Skilled in both frontend (React/Next.js) and backend (FastAPI/Spring Boot) development'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goBack()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Main Profile Card */}
        <Card className="overflow-hidden">
          <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-white">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Profile Image */}
              <div className="relative">
                <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-lg">
                  {/* Profile Image */}
                  <img src="/me.jpg" alt="Abdullah Al Noman" className="w-28 h-28 rounded-full object-cover" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full flex items-center justify-center">
                  <Code className="h-4 w-4 text-white" />
                </div>
              </div>

              {/* Profile Info */}
              <div className="text-center md:text-left flex-1">
                <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                  Abdullah Al Noman
                </h1>
                <p className="text-xl text-blue-100 mb-4">
                  Full-Stack Developer & Software Engineer
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-blue-100">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>Bangladesh</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <GraduationCap className="h-4 w-4" />
                    <span>Computer Science Student</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Available for Projects</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* About & Contact Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* About Me */}
          <Card className="lg:col-span-2">
            <Card.Header>
              <Card.Title className="flex items-center gap-2">
                <Coffee className="h-5 w-5" />
                About Me
              </Card.Title>
            </Card.Header>
            <Card.Content className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                I'm Abdullah Al Noman, a Computer Science student at Jashore University of Science and Technology (JUST) 
                with a passion for full-stack development. I specialize in building modern web applications with a focus 
                on education technology and management systems.
              </p>
              <p className="text-gray-700 leading-relaxed">
                With expertise in React.js, Python, FastAPI, and Spring Boot, I create scalable and user-friendly 
                applications that solve real-world problems. I'm particularly interested in developing systems that 
                improve educational processes and enhance learning experiences.
              </p>
              <p className="text-gray-700 leading-relaxed">
                When I'm not coding, I enjoy participating in competitive programming, contributing to open-source 
                projects, and exploring innovative solutions in the field of educational technology.
              </p>
            </Card.Content>
          </Card>

          {/* Contact Information */}
          <Card>
            <Card.Header>
              <Card.Title className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Get in Touch
              </Card.Title>
            </Card.Header>
            <Card.Content className="space-y-4">
                <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-700">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <a 
                    href="mailto:nomanstine@gmail.com"
                    className="text-sm hover:text-blue-600 transition-colors"
                  >
                    nomanstine@gmail.com
                  </a>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Phone className="h-4 w-4 text-green-600" />
                  <a 
                    href="tel:+8801234567890"
                    className="text-sm hover:text-green-600 transition-colors"
                  >
                    +880 1839743638
                  </a>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <MapPin className="h-4 w-4 text-red-600" />
                  <span className="text-sm">Chittagong, Bangladesh</span>
                </div>
              </div>              <div className="border-t pt-4 space-y-3">
                <h4 className="font-medium text-gray-900">Social & Professional</h4>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('/resume.pdf', '_blank')}
                    className="w-full flex items-center gap-2 justify-start"
                  >
                    <Award className="h-4 w-4" />
                    Download Resume (PDF)
                  </Button>
                  <a 
                    href="https://github.com/NightFury-9b71" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <Github className="h-4 w-4" />
                    <span className="text-sm">GitHub Profile</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <a 
                    href="https://linkedin.com/in/nomanstine" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <Linkedin className="h-4 w-4" />
                    <span className="text-sm">LinkedIn</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <a 
                    href="https://nomanstine.vercel.app" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <Globe className="h-4 w-4" />
                    <span className="text-sm">Portfolio Website</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>

        {/* Projects Section */}
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Featured Projects
            </Card.Title>
          </Card.Header>
          <Card.Content className="space-y-4">
            {projects.map((project, index) => (
              <div key={index} className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
                <h3 className="font-semibold text-gray-900 mb-2">{project.name}</h3>
                <p className="text-gray-700 text-sm mb-3">{project.description}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {project.tech.map((tech, techIndex) => (
                    <span
                      key={techIndex}
                      className="px-2 py-1 bg-white text-blue-700 rounded text-xs font-medium border border-blue-200"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  {project.github && (
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <Github className="h-3 w-3" />
                      GitHub
                    </a>
                  )}
                  {project.live && (
                    <a
                      href={project.live}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-green-600 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Live Demo
                    </a>
                  )}
                </div>
              </div>
            ))}
          </Card.Content>
        </Card>

        {/* Achievements */}
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Achievements & Expertise
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <ul className="space-y-2">
              {achievements.map((achievement, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700">{achievement}</span>
                </li>
              ))}
            </ul>
          </Card.Content>
        </Card>

        {/* Footer Message */}
        <Card className="text-center bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <Card.Content className="py-6">
            <div className="flex items-center justify-center gap-2 text-gray-700 mb-2">
              <Heart className="h-4 w-4 text-red-500" />
              <span>Built with passion for education technology</span>
            </div>
            <p className="text-sm text-gray-600">
              Thank you for exploring the Science Point system. This project represents my commitment to 
              creating innovative solutions for educational institutions.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
              >
                <Globe className="h-4 w-4" />
                Visit Homepage
              </Button>
              <Button
                size="sm"
                onClick={() => window.open('mailto:nomanstine@gmail.com', '_blank')}
                className="flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Contact Me
              </Button>
            </div>
          </Card.Content>
        </Card>
      </div>
    </div>
  )
}

export default DeveloperPage