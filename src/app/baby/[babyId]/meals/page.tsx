'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { getMeals, addMeal, deleteMeal } from '@/lib/db'
import { Topbar, EntryTime, EmptyState } from '@/components/ui'
import type { MealEntry, MealType, FoodType, QuantityUnit } from '@/types'
import { Timestamp } from 'firebase/firestore'

function nowLocal() {
  const d = new Date()
  d.setSeconds(0, 0)
  return d.toISOString().slice(0, 16)
}

export default function MealsPage() {
  const { babyId } = useParams<{ babyId: string }>()
  const { user } = useAuth()
  const router = useRouter()
  const [meals, setMeals] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [timestamp, setTimestamp] = useState(nowLocal())
  const [mealType, setMealType] = useState<MealType>('breakfast')
  const [foodType, setFoodType] = useState<FoodType>('solids')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState<QuantityUnit>('g')
  const [notes, setNotes] = useState('')

  useEffect(() => { loadMeals() }, [babyId])

  async function loadMeals() {
    const data = await getMeals(babyId)
    setMeals(data)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    await addMeal(babyId, {
      babyId, loggedBy: user.uid,
      timestamp: Timestamp.fromDate(new Date(timestamp)) as any,
      mealType, foodType,
      quantity: parseFloat(quantity),
      unit, notes,
    })
    await loadMeals()
    setShowForm(false)
    setSaving(false)
    setQuantity(''); setNotes('')
    setTimestamp(nowLocal())
  }

  const latest = meals[0]

  if (showForm) return (
    <div className="page-bg flex flex-col min-h-screen">
      <Topbar title="Log meal" backLabel="Cancel" action={{ label: 'Save', onClick: () => {} }} />
      <div className="scroll-body">
        <form onSubmit={handleSave}>
          <div className="mb-4"><label className="input-label">Timestamp</label>
            <input className="input-field" type="datetime-local" value={timestamp} onChange={(e) => setTimestamp(e.target.value)} /></div>
          <div className="mb-4"><label className="input-label">Meal type</label>
            <select className="input-field" value={mealType} onChange={(e) => setMealType(e.target.value as MealType)}>
              <option value="breakfast">Breakfast</option><option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option><option value="snack">Snack</option>
              <option value="bottle_feed">Bottle feed</option>
            </select></div>
          <div className="mb-4"><label className="input-label">Food type</label>
            <select className="input-field" value={foodType} onChange={(e) => setFoodType(e.target.value as FoodType)}>
              <option value="solids">Solids</option><option value="breast_milk">Breast milk</option>
              <option value="formula">Formula</option><option value="other">Other</option>
            </select></div>
          <div className="flex gap-2 mb-4">
            <div className="flex-1"><label className="input-label">Quantity</label>
              <input className="input-field" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="120" required /></div>
            <div className="flex-1"><label className="input-label">Unit</label>
              <select className="input-field" value={unit} onChange={(e) => setUnit(e.target.value as QuantityUnit)}>
                <option value="g">g</option><option value="ml">ml</option><option value="oz">oz</option>
              </select></div>
          </div>
          <div className="mb-5"><label className="input-label">Notes</label>
            <textarea className="input-field" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Any notes…"/></div>
          <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save entry'}</button>
        </form>
      </div>
    </div>
  )

  return (
    <div className="page-bg flex flex-col min-h-screen">
      <Topbar
        title="Meals"
        backLabel="Back"
        backHref={`/baby/${babyId}`}
        action={{ label: '+ Add', onClick: () => setShowForm(true) }}
      />
      <div className="scroll-body">
        {latest ? (
          <div className="hi-card mb-3" style={{ background: 'var(--rose-bg)' }}>
            <div className="text-[11px] mb-1" style={{ color: 'var(--text3)' }}>Latest</div>
            <div className="text-[15px] font-bold mb-2" style={{ color: 'var(--text)' }}>
              {latest.mealType?.replace('_', ' ')}
            </div>
            <div className="flex gap-2">
              <span className="pill" style={{ background: 'var(--surface)', color: 'var(--text2)', border: '2px solid var(--border2)' }}>
                {latest.foodType?.replace('_', ' ')}
              </span>
              <span className="pill" style={{ background: 'var(--surface)', color: 'var(--text2)', border: '2px solid var(--border2)' }}>
                {latest.quantity} {latest.unit}
              </span>
            </div>
          </div>
        ) : <EmptyState message={'No meals logged yet.\nTap + Add to get started.'} />}

        {meals.length > 0 && (
          <>
            <div className="sec-title mt-4">All entries</div>
            {meals.map((m) => (
              <div key={m.id} className="entry-card">
                <EntryTime ts={m.timestamp} />
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>
                      {m.mealType?.replace('_', ' ')} · {m.foodType?.replace('_', ' ')}
                    </div>
                    <div className="text-[12px] mt-[2px]" style={{ color: 'var(--text3)' }}>
                      {m.quantity} {m.unit}{m.notes ? ` · ${m.notes}` : ''}
                    </div>
                  </div>
                  <button onClick={async () => { await deleteMeal(babyId, m.id); loadMeals() }}
                    className="text-[11px] px-2 py-1 rounded" style={{ color: 'var(--danger)', border: '1px solid var(--danger)' }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
