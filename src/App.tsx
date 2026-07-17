import { useEffect, useMemo, useRef, useState } from 'react'

type Difficulty = 'easy' | 'medium' | 'hard'
type CellValue = number | null
type Notes = Record<number, number[]>

type Puzzle = {
  puzzle: string
  solution: string
}

type HistoryEntry = {
  board: CellValue[]
  notes: Notes
}

const PUZZLES: Record<Difficulty, Puzzle> = {
  easy: {
    puzzle: '530070000600195000098000060800060003400803001700020006060000280000419005000080079',
    solution: '534678912672195348198342567859761423426853791713924856961537284287419635345286179',
  },
  medium: {
    puzzle: '000260701680070090190004500820100040004602900050003028009300074040050036703018000',
    solution: '435269781682571493197834562826195347374682915951743628519326874248957136763418259',
  },
  hard: {
    puzzle: '005300000800000020070010500400005300010070006003200080060500009004000030000009700',
    solution: '145327698839654127672918543496185372218473956753296481367542819984761235521839764',
  },
}

const STORAGE_KEY = 'sudo.game.v1'

const difficultyLabels: Record<Difficulty, string> = {
  easy: 'easy',
  medium: 'medium',
  hard: 'hard',
}

function stringToBoard(value: string): CellValue[] {
  return value.split('').map((digit) => (digit === '0' ? null : Number(digit)))
}

function shuffled<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function makeVariant(source: Puzzle): Puzzle {
  const digits = shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9])
  const map = new Map<number, number>()
  digits.forEach((digit, index) => map.set(index + 1, digit))

  const transform = (input: string) =>
    input
      .split('')
      .map((char) => (char === '0' ? '0' : String(map.get(Number(char)))))
      .join('')

  let puzzle = transform(source.puzzle)
  let solution = transform(source.solution)

  if (Math.random() > 0.5) {
    const transpose = (input: string) => {
      const out = Array<string>(81)
      for (let row = 0; row < 9; row += 1) {
        for (let col = 0; col < 9; col += 1) {
          out[col * 9 + row] = input[row * 9 + col]
        }
      }
      return out.join('')
    }
    puzzle = transpose(puzzle)
    solution = transpose(solution)
  }

  return { puzzle, solution }
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`
}

function sameUnit(a: number, b: number) {
  const rowA = Math.floor(a / 9)
  const rowB = Math.floor(b / 9)
  const colA = a % 9
  const colB = b % 9
  const boxA = Math.floor(rowA / 3) * 3 + Math.floor(colA / 3)
  const boxB = Math.floor(rowB / 3) * 3 + Math.floor(colB / 3)
  return rowA === rowB || colA === colB || boxA === boxB
}

function IconUndo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 7H5v-4M5.4 7.2A8 8 0 1 1 4 14" />
    </svg>
  )
}

function IconNotes() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.2 15.8 15.8 8.2" />
    </svg>
  )
}

function IconErase() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m7 7 10 10M17 7 7 17" />
    </svg>
  )
}

export default function App() {
  const initial = useMemo(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
      if (saved?.puzzle?.length === 81 && saved?.solution?.length === 81) {
        return saved
      }
    } catch {
      // A broken local save should not block the app.
    }

    const variant = makeVariant(PUZZLES.easy)
    return {
      difficulty: 'easy' as Difficulty,
      puzzle: variant.puzzle,
      solution: variant.solution,
      board: stringToBoard(variant.puzzle),
      notes: {} as Notes,
      elapsed: 0,
      completed: false,
    }
  }, [])

  const [difficulty, setDifficulty] = useState<Difficulty>(initial.difficulty)
  const [puzzle, setPuzzle] = useState(initial.puzzle)
  const [solution, setSolution] = useState(initial.solution)
  const [board, setBoard] = useState<CellValue[]>(initial.board)
  const [notes, setNotes] = useState<Notes>(initial.notes)
  const [selected, setSelected] = useState<number | null>(null)
  const [notesMode, setNotesMode] = useState(false)
  const [elapsed, setElapsed] = useState(initial.elapsed)
  const [completed, setCompleted] = useState(initial.completed)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const completedRef = useRef(completed)

  const fixed = useMemo(() => puzzle.split('').map((char: string) => char !== '0'), [puzzle])

  useEffect(() => {
    completedRef.current = completed
  }, [completed])

  useEffect(() => {
    if (completed) return undefined
    const timer = window.setInterval(() => setElapsed((value: number) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [completed])

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ difficulty, puzzle, solution, board, notes, elapsed, completed }),
    )
  }, [difficulty, puzzle, solution, board, notes, elapsed, completed])

  const chooseDifficulty = () => {
    const order: Difficulty[] = ['easy', 'medium', 'hard']
    const next = order[(order.indexOf(difficulty) + 1) % order.length]
    startNew(next)
  }

  const startNew = (nextDifficulty = difficulty) => {
    const variant = makeVariant(PUZZLES[nextDifficulty])
    setDifficulty(nextDifficulty)
    setPuzzle(variant.puzzle)
    setSolution(variant.solution)
    setBoard(stringToBoard(variant.puzzle))
    setNotes({})
    setSelected(null)
    setNotesMode(false)
    setElapsed(0)
    setCompleted(false)
    setHistory([])
  }

  const saveHistory = () => {
    setHistory((items) => [...items.slice(-39), { board: [...board], notes: structuredClone(notes) }])
  }

  const enterNumber = (value: number) => {
    if (selected === null || fixed[selected] || completedRef.current) return
    saveHistory()

    if (notesMode) {
      if (board[selected] !== null) return
      setNotes((current) => {
        const existing = current[selected] ?? []
        const next = existing.includes(value)
          ? existing.filter((item) => item !== value)
          : [...existing, value].sort((a, b) => a - b)
        return { ...current, [selected]: next }
      })
      return
    }

    const nextBoard = [...board]
    nextBoard[selected] = value
    setBoard(nextBoard)
    setNotes((current) => ({ ...current, [selected]: [] }))

    const target = solution[selected]
    if (String(value) === target) {
      const related = { ...notes }
      Object.keys(related).forEach((key) => {
        const index = Number(key)
        if (sameUnit(index, selected)) {
          related[index] = (related[index] ?? []).filter((item) => item !== value)
        }
      })
      setNotes(related)
    }

    const isComplete = nextBoard.every((cell, index) => String(cell ?? 0) === solution[index])
    if (isComplete) setCompleted(true)
  }

  const erase = () => {
    if (selected === null || fixed[selected] || completed) return
    saveHistory()
    const nextBoard = [...board]
    nextBoard[selected] = null
    setBoard(nextBoard)
    setNotes((current) => ({ ...current, [selected]: [] }))
  }

  const undo = () => {
    const previous = history.at(-1)
    if (!previous || completed) return
    setBoard(previous.board)
    setNotes(previous.notes)
    setHistory((items) => items.slice(0, -1))
  }

  const selectedValue = selected === null ? null : board[selected]

  return (
    <main className="app-shell">
      <section className="game" aria-label="sudo sudoku game">
        <header className="topbar">
          <div>
            <p className="eyebrow">a small sudoku</p>
            <h1>sudo</h1>
          </div>
          <button className="new-button" type="button" onClick={() => startNew()}>
            new
          </button>
        </header>

        <div className="status-row" aria-label="game status">
          <button className="status-pill" type="button" onClick={chooseDifficulty}>
            {difficultyLabels[difficulty]}
          </button>
          <span className={`completion-text ${completed ? 'is-visible' : ''}`}>
            solved. suspiciously competent.
          </span>
          <time className="timer">{formatTime(elapsed)}</time>
        </div>

        <div className="board" role="grid" aria-label="Sudoku board">
          {board.map((value, index) => {
            const row = Math.floor(index / 9)
            const col = index % 9
            const isSelected = selected === index
            const isRelated = selected !== null && sameUnit(index, selected)
            const isSameValue = selectedValue !== null && value === selectedValue
            const isWrong = value !== null && !fixed[index] && String(value) !== solution[index]
            const cellNotes = notes[index] ?? []

            return (
              <button
                key={index}
                type="button"
                role="gridcell"
                aria-label={`row ${row + 1}, column ${col + 1}${value ? `, ${value}` : ', empty'}`}
                className={[
                  'cell',
                  fixed[index] ? 'is-fixed' : '',
                  isRelated ? 'is-related' : '',
                  isSameValue ? 'is-same' : '',
                  isSelected ? 'is-selected' : '',
                  isWrong ? 'is-wrong' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => setSelected(index)}
              >
                {value !== null ? (
                  <span className="cell-value">{value}</span>
                ) : (
                  <span className="notes-grid" aria-hidden="true">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((note) => (
                      <span key={note}>{cellNotes.includes(note) ? note : ''}</span>
                    ))}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div className="tools" aria-label="game tools">
          <button type="button" onClick={undo} disabled={history.length === 0 || completed}>
            <IconUndo />
            <span>undo</span>
          </button>
          <button
            type="button"
            className={notesMode ? 'is-active' : ''}
            onClick={() => setNotesMode((value) => !value)}
            disabled={completed}
          >
            <IconNotes />
            <span>notes</span>
          </button>
          <button type="button" onClick={erase} disabled={selected === null || completed}>
            <IconErase />
            <span>erase</span>
          </button>
        </div>

        <div className="keypad" aria-label="number keypad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
            <button key={number} type="button" onClick={() => enterNumber(number)} disabled={completed}>
              {number}
            </button>
          ))}
        </div>
      </section>
    </main>
  )
}
