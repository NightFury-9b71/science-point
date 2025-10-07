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
import Button from '../components/Button'
import Card from '../components/Card'

const DeveloperPage = () => {
  const navigate = useNavigate()

  const skills = [
    'React.js', 'JavaScript', 'Python', 'FastAPI', 'Node.js', 
    'SQL', 'Git', 'HTML/CSS', 'Tailwind CSS', 'SQLModel'
  ]

  const projects = [
    {
      name: 'Science Point - Coaching Center Management',
      description: 'Full-stack web application for managing coaching centers with role-based authentication, scheduling, and student management.',
      tech: ['React.js', 'FastAPI', 'SQLModel', 'JWT Auth']
    },
    {
      name: 'Student Information System',
      description: 'Comprehensive system for tracking student progress, attendance, and academic performance.',
      tech: ['Python', 'React', 'PostgreSQL']
    },
    {
      name: 'Class Scheduling System',
      description: 'Intelligent scheduling system with conflict detection and teacher-student management.',
      tech: ['FastAPI', 'SQLAlchemy', 'React']
    }
  ]

  const achievements = [
    'Full-Stack Developer specializing in Education Technology',
    'Expert in Modern Web Development Technologies',
    'Database Design and API Development Specialist',
    'UI/UX Design and User Experience Enthusiast'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
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
                  {/* Placeholder avatar - you can replace this with actual image */}
                  <div className="w-28 h-28 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                    <img src="noman.png" alt="Profile" className="rounded-full" />
                    {/* <img src="nomanstine.jpg" alt="Profile" className="rounded-full" /> */}
                  </div>
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
                I'm Abdullah Al Noman, a passionate full-stack developer currently pursuing my studies in Computer Science. 
                I specialize in building modern web applications with a focus on education technology and management systems.
              </p>
              <p className="text-gray-700 leading-relaxed">
                With expertise in React.js, Python, and FastAPI, I create scalable and user-friendly applications that solve 
                real-world problems. I'm particularly interested in developing systems that improve educational processes and 
                enhance learning experiences.
              </p>
              <p className="text-gray-700 leading-relaxed">
                When I'm not coding, I enjoy learning new technologies, contributing to open-source projects, and exploring 
                innovative solutions in the field of educational technology.
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
                    href="mailto:nomanstine@gmail.com" 
                    className="flex items-center gap-3 text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <Globe className="h-4 w-4" />
                    <span className="text-sm">Contact Portfolio</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>

        {/* Skills Section */}
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Technical Skills
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors"
                >
                  {skill}
                </span>
              ))}
            </div>
          </Card.Content>
        </Card>

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
                <div className="flex flex-wrap gap-2">
                  {project.tech.map((tech, techIndex) => (
                    <span
                      key={techIndex}
                      className="px-2 py-1 bg-white text-blue-700 rounded text-xs font-medium border border-blue-200"
                    >
                      {tech}
                    </span>
                  ))}
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