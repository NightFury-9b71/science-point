import React from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, Users, BookOpen, Calendar, Award, BarChart3, Shield, CheckCircle, ArrowRight } from 'lucide-react'
import Button from '../components/Button'
import Card from '../components/Card'
import { useAuth } from '../contexts/AuthContext'
import { usePublicNotices } from '../services/queries'

// Add marquee animation styles
const marqueeStyle = `
  @keyframes marquee {
    0% { transform: translateX(100%); }
    100% { transform: translateX(-100%); }
  }
`

const LandingPage = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { data: notices } = usePublicNotices()

  // Filter notices that should show on landing page
  const landingNotices = notices?.filter(notice => 
    notice.show_on_landing && 
    notice.is_active &&
    (!notice.expires_at || new Date(notice.expires_at) > new Date())
  ) || []

  // Fallback Bengali notices if no landing notices are available
  const fallbackNotices = [
    // "🎉 নতুন ব্যাচ শুরু হবে ১৫ অক্টোবর থেকে - সীমিত আসন!",
    "📚 HSC ২০২৬ ব্যাচের ভর্তি চলছে - বিশেষ ছাড়ে!",
    // "🏆 আমাদের ৫০+ শিক্ষার্থী এবছর A+ পেয়েছে!",
    // "📝 বিনামূল্যে মডেল টেস্ট প্রতি শনিবার",
    // "🎯 গণিত ও পদার্থবিজ্ঞানে বিশেষ ক্লাস শুরু"
  ]

  // Use landing notices if available, otherwise use fallback
  const displayNotices = landingNotices.length > 0 ? landingNotices : fallbackNotices

  const features = [
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: "বিষয়ভিত্তিক কোচিং",
      description: "গণিত, পদার্থ, রসায়ন, জীববিজ্ঞান এবং ইংরেজিতে বিশেষজ্ঞ শিক্ষক"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "ছোট ব্যাচ সাইজ",
      description: "প্রতি ব্যাচে সর্বোচ্চ ১৫ জন শিক্ষার্থী - ব্যক্তিগত মনোযোগের জন্য"
    },
    {
      icon: <Calendar className="h-6 w-6" />,
      title: "নিয়মিত পরীক্ষা",
      description: "সাপ্তাহিক পরীক্ষা এবং মাসিক মূল্যায়নের মাধ্যমে অগ্রগতি পর্যবেক্ষণ"
    },
    {
      icon: <Award className="h-6 w-6" />,
      title: "বোর্ড পরীক্ষার প্রস্তুতি",
      description: "JSC, SSC এবং HSC পরীক্ষার জন্য বিশেষ প্রস্তুতিমূলক ক্লাস"
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "ফলাফল ট্র্যাকিং",
      description: "প্রতিটি শিক্ষার্থীর অগ্রগতি রিপোর্ট এবং অভিভাবক মিটিং"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "অভিজ্ঞ শিক্ষকমণ্ডলী",
      description: "স্থানীয় স্কুল-কলেজের অভিজ্ঞ এবং যোগ্য শিক্ষকদের তত্ত্বাবধান"
    }
  ]

  const testimonials = [
    {
      name: "নাহিদা খাতুন",
      role: "অভিভাবক, মীরসরাই",
      content: "আমার মেয়ে ৯ম শ্রেণীতে পড়ে। সায়েন্স পয়েন্টে আসার পর তার গণিতে অনেক উন্নতি হয়েছে। শিক্ষকরা খুবই যত্নশীল।"
    },
    {
      name: "রাহুল চাকমা",
      role: "HSC ব্যাচ ২০২৪ - চট্টগ্রাম কলেজ",
      content: "সায়েন্স পয়েন্টের পদার্থবিজ্ঞান ক্লাস আমার HSC তে A+ পেতে সাহায্য করেছে। ধন্যবাদ স্যারদের!"
    },
    {
      name: "মোঃ জাহাঙ্গীর আলম",
      role: "অভিভাবক ও স্থানীয় ব্যবসায়ী",
      content: "আমার ছেলে ৮ম শ্রেণীতে পড়ে। এখানে ছোট ব্যাচ সাইজের কারণে প্রতিটি বাচ্চার প্রতি আলাদা মনোযোগ দেওয়া হয়।"
    }
  ]

  return (
    <>
      <style>{marqueeStyle}</style>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50">
      {/* Latest Notices Marquee */}
      <div className="bg-slate-600 text-white py-2 overflow-hidden">
        <div className="flex items-center">
          <span className="bg-red-600 px-3 py-1 text-xs font-bold rounded-r-full flex-shrink-0">
            📢 সর্বশেষ ঘোষণা
          </span>
          <div className="ml-4 flex-1 overflow-hidden">
            <div className="whitespace-nowrap" style={{
              animation: 'marquee 30s linear infinite'
            }}>
              {displayNotices.map((notice, index) => (
                <span key={notice.id || index} className="mx-8">
                  ✨ {typeof notice === 'string' ? notice : notice.content}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-slate-600" />
              <span className="text-xl font-bold text-gray-900">Science Point</span>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    Welcome back, <span className="font-semibold">{user?.full_name || user?.username}</span>
                  </span>
                  <Button 
                    onClick={() => {
                      const roleRoutes = {
                        admin: '/admin-dashboard',
                        teacher: '/teacher',
                        student: '/student'
                      }
                      navigate(roleRoutes[user?.role] || '/login')
                    }}
                  >
                    Go to Dashboard
                  </Button>
                </div>
              ) : (
                <>
                  <Button variant="outline" onClick={() => navigate('/login')}>
                    Sign In
                  </Button>
                  <Button onClick={() => navigate('/login')}>
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-6">
            <p className="text-lg text-slate-600 font-semibold mb-2">মীরসরাই, চট্টগ্রাম</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              <span className="text-slate-700">সায়েন্স পয়েন্ট</span>
              <span className="block text-3xl sm:text-4xl lg:text-5xl mt-2">কোচিং সেন্টার</span>
            </h1>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg max-w-4xl mx-auto mb-8">
            <p className="text-xl text-gray-700 mb-6">
              <span className="font-semibold text-slate-600">৬ষ্ঠ থেকে ১০ম শ্রেণী</span> (মাধ্যমিক) এবং 
              <span className="font-semibold text-slate-600"> ১১শ থেকে ১২শ শ্রেণী</span> (উচ্চ মাধ্যমিক) শিক্ষার্থীদের জন্য
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center mb-8">
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-bold text-slate-700">গণিত ও বিজ্ঞান</h3>
                <p className="text-sm text-slate-500">বিশেষজ্ঞ শিক্ষক</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-bold text-slate-700">বোর্ড পরীক্ষার প্রস্তুতি</h3>
                <p className="text-sm text-slate-500">JSC, SSC, HSC</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-bold text-slate-700">ছোট ব্যাচ সাইজ</h3>
                <p className="text-sm text-slate-500">ব্যক্তিগত মনোযোগ</p>
              </div>
            </div>
          </div>
          {isAuthenticated ? (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 shadow-lg max-w-4xl mx-auto mb-8 border border-blue-100">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  স্বাগতম, {user?.full_name || user?.username}! 🎉
                </h3>
                <p className="text-lg text-gray-700 mb-6">
                  {user?.role === 'admin' && 'আপনার এডমিন ড্যাশবোর্ডে যেতে নিচের বাটনে ক্লিক করুন।'}
                  {user?.role === 'teacher' && 'আপনার শিক্ষক ড্যাশবোর্ডে যেতে নিচের বাটনে ক্লিক করুন।'}
                  {user?.role === 'student' && 'আপনার স্টুডেন্ট ড্যাশবোর্ডে যেতে নিচের বাটনে ক্লিক করুন।'}
                </p>
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-4"
                  onClick={() => {
                    const roleRoutes = {
                      admin: '/admin-dashboard',
                      teacher: '/teacher',
                      student: '/student'
                    }
                    navigate(roleRoutes[user?.role] || '/login')
                  }}
                >
                  ড্যাশবোর্ডে যান
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="text-lg px-8 py-4"
                onClick={() => navigate('/admission')}
              >
                ভর্তির জন্য যোগাযোগ
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-4"
              >
                ক্লাসের তথ্য দেখুন
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Quick Access Section for Signed-in Users */}
      {isAuthenticated && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                দ্রুত অ্যাক্সেস
              </h2>
              <p className="text-lg text-gray-600">
                আপনার প্রয়োজনীয় তথ্য এবং সেবা এক ক্লিকেই
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {user?.role === 'admin' && (
                <>
                  <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin-dashboard/students')}>
                    <Users className="h-8 w-8 text-blue-600 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">শিক্ষার্থী পরিচালনা</h3>
                    <p className="text-gray-600 text-sm">নতুন ভর্তি, তথ্য আপডেট এবং পারফরমেন্স ট্র্যাকিং</p>
                  </Card>
                  <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin-dashboard/teachers')}>
                    <Shield className="h-8 w-8 text-green-600 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">শিক্ষক পরিচালনা</h3>
                    <p className="text-gray-600 text-sm">শিক্ষক তথ্য, ক্লাস বরাদ্দ এবং পারফরমেন্স পর্যবেক্ষণ</p>
                  </Card>
                  <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin-dashboard/performance')}>
                    <BarChart3 className="h-8 w-8 text-purple-600 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">পারফরমেন্স রিপোর্ট</h3>
                    <p className="text-gray-600 text-sm">সামগ্রিক প্রতিষ্ঠানের পারফরমেন্স এবং পরিসংখ্যান</p>
                  </Card>
                </>
              )}
              
              {user?.role === 'teacher' && (
                <>
                  <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/teacher/classes')}>
                    <BookOpen className="h-8 w-8 text-blue-600 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">আমার ক্লাসসমূহ</h3>
                    <p className="text-gray-600 text-sm">আপনার দায়িত্বে থাকা ক্লাস এবং বিষয়সমূহ</p>
                  </Card>
                  <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/teacher/attendance')}>
                    <Calendar className="h-8 w-8 text-green-600 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">উপস্থিতি নিয়ন্ত্রণ</h3>
                    <p className="text-gray-600 text-sm">শিক্ষার্থীদের দৈনিক উপস্থিতি গ্রহণ ও পর্যবেক্ষণ</p>
                  </Card>
                  <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/teacher/results')}>
                    <Award className="h-8 w-8 text-purple-600 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">পরীক্ষার ফলাফল</h3>
                    <p className="text-gray-600 text-sm">পরীক্ষার নম্বর প্রদান এবং ফলাফল প্রকাশ</p>
                  </Card>
                </>
              )}
              
              {user?.role === 'student' && (
                <>
                  <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/student/results')}>
                    <Award className="h-8 w-8 text-blue-600 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">আমার ফলাফল</h3>
                    <p className="text-gray-600 text-sm">সকল পরীক্ষার ফলাফল এবং পারফরমেন্স রিপোর্ট</p>
                  </Card>
                  <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/student/schedule')}>
                    <Calendar className="h-8 w-8 text-green-600 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">ক্লাসের সময়সূচী</h3>
                    <p className="text-gray-600 text-sm">আপনার নিয়মিত ক্লাসের সময় এবং পরীক্ষার তারিখ</p>
                  </Card>
                  <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/student/materials')}>
                    <BookOpen className="h-8 w-8 text-purple-600 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">অধ্যয়ন সামগ্রী</h3>
                    <p className="text-gray-600 text-sm">শিক্ষকদের প্রদান করা নোট এবং অধ্যয়ন সামগ্রী</p>
                  </Card>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              কেন সায়েন্স পয়েন্ট বেছে নিবেন?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              মীরসরাইয়ের শিক্ষার্থীদের জন্য বিশেষভাবে ডিজাইন করা শিক্ষা সেবা
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="text-slate-600 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Class-specific Sections */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              আমাদের কোর্স সমূহ
            </h2>
            <p className="text-xl text-gray-600">
              প্রতিটি শ্রেণীর জন্য বিশেষভাবে তৈরি পাঠ্যক্রম
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            {/* High School Section */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border-l-4 border-green-400">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <BookOpen className="h-6 w-6 text-green-600 mr-2" />
                মাধ্যমিক (৬ষ্ঠ - ১০ম শ্রেণী)
              </h3>
              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>গণিত ও বিজ্ঞানে বিশেষ গুরুত্ব</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>JSC ও SSC পরীক্ষার প্রস্তুতি</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>সাপ্তাহিক পরীক্ষা ও মূল্যায়ন</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>হোমওয়ার্ক ও প্র্যাকটিস শিট</span>
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600">
                  <strong>ক্লাসের সময়:</strong> সকাল ৮টা - বিকাল ৪টা<br/>
                  <strong>ব্যাচ সাইজ:</strong> সর্বোচ্চ ১৫ জন
                </p>
              </div>
            </div>

            {/* Intermediate Section */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border-l-4 border-blue-500">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Award className="h-6 w-6 text-blue-600 mr-2" />
                উচ্চ মাধ্যমিক (১১শ - ১২শ শ্রেণী)
              </h3>
              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  <span>বিজ্ঞান বিভাগের সকল বিষয়</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  <span>HSC পরীক্ষার বিশেষ প্রস্তুতি</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  <span>বিশ্ববিদ্যালয় ভর্তি পরীক্ষার গাইড</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  <span>মডেল টেস্ট ও পূর্ণাঙ্গ মূল্যায়ন</span>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>ক্লাসের সময়:</strong> বিকাল ৩টা - রাত ৮টা<br/>
                  <strong>ব্যাচ সাইজ:</strong> সর্বোচ্চ ১২ জন
                </p>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          {/* <div className="bg-gradient-to-r from-slate-600 to-slate-700 p-8 rounded-2xl text-white text-center">
            <h3 className="text-2xl font-bold mb-4">ভর্তির জন্য আজই যোগাযোগ করুন!</h3>
            <p className="text-slate-100 mb-6">
              সীমিত আসন। প্রতি ব্যাচে মাত্র ১৫ জন শিক্ষার্থী নেওয়া হয়।
            </p>
            <Button 
              className="bg-white text-slate-600 hover:bg-gray-100 text-lg py-3 px-8"
              onClick={() => navigate('/login')}
            >
              এখনই ভর্তি হন
            </Button>
          </div> */}

        </div>
      </section>      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              আমাদের শিক্ষার্থী ও অভিভাবকরা কী বলছেন
            </h2>
            <p className="text-xl text-gray-600">
              মীরসরাইয়ের পরিবারগুলোর আস্থার জায়গা
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6">
                <p className="text-gray-600 mb-4 italic">
                  "{testimonial.content}"
                </p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            আপনার সন্তানের উজ্জ্বল ভবিষ্যৎ গড়ুন
          </h2>
          <p className="text-xl text-slate-200 mb-8">
            মীরসরাইয়ের সেরা কোচিং সেন্টারে আজই ভর্তি করান
          </p>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8 max-w-2xl mx-auto">
            <p className="text-white font-semibold mb-2">যোগাযোগ:</p>
            <p className="text-slate-200">📍 মীরসরাই বাজার, চট্টগ্রাম</p>
            <p className="text-slate-200">📞 ০১৭xxxxxxxx</p>
            <p className="text-slate-200">🕒 রোজ সকাল ৮টা - রাত ৮টা</p>
          </div>
          <Button 
            size="lg" 
            variant="outline"
            className="text-lg px-8 py-4 bg-white text-slate-600 hover:bg-gray-100"
            onClick={() => navigate('/admission')}
          >
            ভর্তির ফর্ম পূরণ করুন
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start space-x-2 mb-4">
                <GraduationCap className="h-8 w-8 text-slate-400" />
                <span className="text-xl font-bold">Science Point</span>
              </div>
              <p className="text-gray-400">
                মীরসরাইয়ের বিশ্বস্ত কোচিং সেন্টার<br/>
                ৬ষ্ঠ থেকে ১২শ শ্রেণীর শিক্ষার্থীদের জন্য
              </p>
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4 text-slate-400">যোগাযোগ</h3>
              <p className="text-gray-400 text-sm">
                📍 মীরসরাই বাজার, চট্টগ্রাম<br/>
                📞 ০১৭xxxxxxxx<br/>
                ✉️ info@sciencepoint.bd<br/>
                🕒 রোজ সকাল ৮টা - রাত ৮টা
              </p>
            </div>

            <div className="text-center md:text-right">
              <h3 className="text-lg font-semibold mb-4 text-slate-400">কোর্স সমূহ</h3>
              <p className="text-gray-400 text-sm">
                ৬ষ্ঠ - ১০ম শ্রেণী (মাধ্যমিক)<br/>
                ১১শ - ১২শ শ্রেণী (উচ্চ মাধ্যমিক)<br/>
                গণিত ও বিজ্ঞানে বিশেষত্ব<br/>
                বোর্ড পরীক্ষার প্রস্তুতি
              </p>
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-6 text-center">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-gray-500 text-sm">
                © ২০২৪ সায়েন্স পয়েন্ট কোচিং সেন্টার। সকল অধিকার সংরক্ষিত।
              </p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/developer')}
                  className="text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium flex items-center gap-1"
                >
                  👨‍💻 Meet the Developer
                </button>
                <span className="text-gray-600 text-sm">Built with ❤️ by Abdullah Al Noman</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </>
  )
}

export default LandingPage