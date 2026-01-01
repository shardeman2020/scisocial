'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useBranding } from '../contexts/BrandingContext'

import { API_BASE_URL } from '../config/api'
type OnboardingStep = 'welcome' | 'profile' | 'tour' | 'complete'

const RESEARCH_INTERESTS_OPTIONS = [
  'Machine Learning',
  'Neuroscience',
  'Climate Science',
  'Quantum Computing',
  'Genomics',
  'Astrophysics',
  'Materials Science',
  'Immunology',
  'Artificial Intelligence',
  'Biochemistry',
  'Psychology',
  'Ecology',
]

const MODEL_OPTIONS = [
  { value: 'general', label: 'General', description: 'All-purpose academic model' },
  { value: 'biomed', label: 'Biomedical', description: 'Optimized for life sciences' },
  { value: 'legal', label: 'Legal', description: 'Optimized for legal research' },
  { value: 'physics', label: 'Physics', description: 'Optimized for physical sciences' },
]

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { branding, fetchBranding } = useBranding()

  const [step, setStep] = useState<OnboardingStep>('welcome')
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [preferredModel, setPreferredModel] = useState('general')
  const [digestOptIn, setDigestOptIn] = useState(true)
  const [userId, setUserId] = useState<string>('')
  const [institutionId, setInstitutionId] = useState<string>('')
  const [tourHighlight, setTourHighlight] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    // Get userId and institutionId from query params
    const userIdParam = searchParams.get('userId')
    const institutionIdParam = searchParams.get('institutionId')

    if (userIdParam) setUserId(userIdParam)
    if (institutionIdParam) {
      setInstitutionId(institutionIdParam)
      fetchBranding(institutionIdParam)
    }
  }, [searchParams, fetchBranding])

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    )
  }

  const handleProfileSave = async () => {
    try {
      await fetch(`http://localhost:3001/onboarding/researchers/${userId}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          researchInterests: selectedInterests,
          preferredModel,
          digestOptIn,
        }),
      })
      setStep('tour')
    } catch (error) {
      console.error('Failed to save profile:', error)
    }
  }

  const handleTourComplete = async () => {
    try {
      await fetch(`http://localhost:3001/onboarding/researchers/${userId}/complete`, {
        method: 'POST',
      })
      setStep('complete')
      setShowConfetti(true)

      // Confetti effect duration
      setTimeout(() => setShowConfetti(false), 3000)
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
    }
  }

  const renderWelcome = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-12 text-center">
        {branding.logoUrl && (
          <img
            src={branding.logoUrl}
            alt="Institution logo"
            className="h-24 mx-auto mb-6"
          />
        )}

        <h1 className="text-4xl font-bold mb-4" style={{ color: branding.accentColor }}>
          {branding.welcomeMessage}
        </h1>

        <p className="text-xl text-gray-600 mb-8">
          {branding.tagline}
        </p>

        <p className="text-gray-700 mb-8 leading-relaxed">
          SciSocial is your citation-backed research platform. Discover papers, engage in
          evidence-based discussions, and connect with researchers in your field.
        </p>

        <button
          onClick={() => setStep('profile')}
          className="px-8 py-4 rounded-xl text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          style={{ backgroundColor: branding.accentColor }}
        >
          Begin Onboarding
        </button>
      </div>
    </div>
  )

  const renderProfile = () => (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-3xl font-bold mb-2" style={{ color: branding.accentColor }}>
            Set Up Your Profile
          </h2>
          <p className="text-gray-600 mb-8">
            Tell us about your research interests to personalize your experience
          </p>

          {/* Research Interests */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-800 mb-4">
              Research Interests
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {RESEARCH_INTERESTS_OPTIONS.map(interest => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    selectedInterests.includes(interest)
                      ? 'border-purple-600 bg-purple-50 text-purple-700 font-semibold'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                  style={selectedInterests.includes(interest) ? {
                    borderColor: branding.accentColor,
                    backgroundColor: `${branding.accentColor}15`,
                    color: branding.accentColor,
                  } : {}}
                >
                  {interest}
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Selected: {selectedInterests.length} interest{selectedInterests.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Preferred Model */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-800 mb-4">
              Preferred Search Model
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MODEL_OPTIONS.map(model => (
                <button
                  key={model.value}
                  onClick={() => setPreferredModel(model.value)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    preferredModel === model.value
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                  style={preferredModel === model.value ? {
                    borderColor: branding.accentColor,
                    backgroundColor: `${branding.accentColor}15`,
                  } : {}}
                >
                  <div className="font-semibold text-gray-900">{model.label}</div>
                  <div className="text-sm text-gray-600 mt-1">{model.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Digest Preferences */}
          <div className="mb-8">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={digestOptIn}
                onChange={(e) => setDigestOptIn(e.target.checked)}
                className="w-5 h-5 rounded mr-3"
                style={{ accentColor: branding.accentColor }}
              />
              <div>
                <span className="text-lg font-semibold text-gray-800">
                  Subscribe to weekly digest emails
                </span>
                <p className="text-sm text-gray-600">
                  Get weekly summaries of trending research and platform activity
                </p>
              </div>
            </label>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep('welcome')}
              className="px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleProfileSave}
              disabled={selectedInterests.length === 0}
              className="flex-1 px-6 py-3 rounded-lg text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: branding.accentColor }}
            >
              Save & Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const tourSteps = [
    {
      title: 'Search Bar',
      description: 'Search across millions of papers using natural language or DOI',
      highlight: 'Use hybrid search to combine keyword and semantic matching',
    },
    {
      title: 'Model Selector',
      description: 'Choose specialized models optimized for different research domains',
      highlight: 'Your preferred model has been pre-selected based on your profile',
    },
    {
      title: 'Saved Searches',
      description: 'Save your queries and track new papers matching your interests',
      highlight: 'Get notified when new relevant papers are published',
    },
    {
      title: 'Follow Topics & Journals',
      description: 'Curate your feed by following journals and research topics',
      highlight: 'Build a personalized feed based on what matters to you',
    },
    {
      title: 'Create Posts',
      description: 'Share papers with citation-backed commentary and images',
      highlight: 'Every post is linked to a verified DOI for credibility',
    },
  ]

  const renderTour = () => {
    const currentStep = tourSteps[tourHighlight]

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold" style={{ color: branding.accentColor }}>
                  Platform Tour
                </h2>
                <span className="text-sm text-gray-500">
                  Step {tourHighlight + 1} of {tourSteps.length}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: branding.accentColor,
                    width: `${((tourHighlight + 1) / tourSteps.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {currentStep.title}
              </h3>
              <p className="text-lg text-gray-700 mb-4">
                {currentStep.description}
              </p>
              <div
                className="p-4 rounded-lg"
                style={{ backgroundColor: `${branding.accentColor}10` }}
              >
                <p className="text-gray-800">
                  <span className="font-semibold" style={{ color: branding.accentColor }}>
                    Tip:
                  </span>{' '}
                  {currentStep.highlight}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => handleTourComplete()}
                className="px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                Skip Tour
              </button>

              {tourHighlight < tourSteps.length - 1 ? (
                <button
                  onClick={() => setTourHighlight(prev => prev + 1)}
                  className="flex-1 px-6 py-3 rounded-lg text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                  style={{ backgroundColor: branding.accentColor }}
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleTourComplete}
                  className="flex-1 px-6 py-3 rounded-lg text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                  style={{ backgroundColor: branding.accentColor }}
                >
                  Finish Tour
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderComplete = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-6 relative overflow-hidden">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-10%`,
                width: '10px',
                height: '10px',
                backgroundColor: ['#9333ea', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'][i % 5],
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-12 text-center relative z-10">
        <div className="mb-6">
          <svg
            className="mx-auto h-24 w-24 mb-4"
            style={{ color: branding.accentColor }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h1 className="text-4xl font-bold mb-4" style={{ color: branding.accentColor }}>
          You're All Set!
        </h1>

        <p className="text-xl text-gray-700 mb-8">
          You're ready to explore SciSocial and connect with researchers in your field.
        </p>

        <button
          onClick={() => router.push('/dashboard')}
          className="px-8 py-4 rounded-xl text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          style={{ backgroundColor: branding.accentColor }}
        >
          Go to Dashboard
        </button>
      </div>

      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        .animate-confetti {
          animation: confetti linear forwards;
        }
      `}</style>
    </div>
  )

  return (
    <>
      {step === 'welcome' && renderWelcome()}
      {step === 'profile' && renderProfile()}
      {step === 'tour' && renderTour()}
      {step === 'complete' && renderComplete()}
    </>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading onboarding...</p>
        </div>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  )
}
