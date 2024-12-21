import Link from 'next/link'

const Footer = () => {
  return (
    <footer className="relative w-full bg-purple-900 shadow-lg shadow-purple-900/50 border-t border-purple-800 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-16 text-white">
          <p className="text-sm">
            © 2024 Created by{' '}
            <Link 
              href="https://www.linkedin.com/in/yeshaswiprakash/" 
              target="_blank"
              className="text-purple-300 hover:text-purple-200 underline decoration-purple-300 hover:decoration-purple-200 transition-colors"
            >
              Yeshaswi Prakash
            </Link>
            {' '}and{' '}
            <Link 
              href="https://www.linkedin.com/in/imgaya3/" 
              target="_blank"
              className="text-purple-300 hover:text-purple-200 underline decoration-purple-300 hover:decoration-purple-200 transition-colors"
            >
              Gayathri J
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer