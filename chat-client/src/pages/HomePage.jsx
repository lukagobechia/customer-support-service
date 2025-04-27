import { Link } from "react-router-dom"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="header">
        <div className="container header-content">
          <h1 className="header-title">Support Portal</h1>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <div className="container max-w-md mx-auto p-6">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Welcome to Support Portal</h2>
            </div>
            <div className="card-content space-y-4">
              <p>Please select your role to continue:</p>
              <div className="flex flex-col gap-3">
                <Link to="/customer" className="button button-default w-full text-center">
                  I am a Customer
                </Link>
                <Link to="/agent" className="button button-outline w-full text-center">
                  I am a Support Agent
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

