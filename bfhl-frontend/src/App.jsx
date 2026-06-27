import { useState } from 'react'
import './App.css'

const sampleInput = `A->B
B->C
C->D`

function App() {
  const [input, setInput] = useState(sampleInput)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/bfhl'

  const parseInput = (value) =>
    value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: parseInput(input) }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong while contacting the API.')
      }

      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="app-shell">
      <section className="card">
        <p className="eyebrow">Hierarchy Processor</p>
        <h1>Analyze family hierarchy data instantly</h1>
        <p className="subtitle">
          Enter parent-child relationships, submit them to the API, and inspect the parsed hierarchy output.
        </p>

        <form onSubmit={handleSubmit} className="form-panel">
          <label htmlFor="hierarchy-input">Enter relationships</label>
          <textarea
            id="hierarchy-input"
            rows="8"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="A->B
B->C"
          />

          <div className="actions">
            <button type="submit" disabled={loading}>
              {loading ? 'Processing…' : 'Submit'}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => setInput(sampleInput)}
            >
              Load sample
            </button>
          </div>
        </form>

        {error ? <div className="message error">{error}</div> : null}

        {result ? (
          <div className="result-panel">
            <h2>Response</h2>
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        ) : null}
      </section>
    </main>
  )
}

export default App
