import explanation from './assets/commissure-ipad-explanation.png'
import library from './assets/commissure-ipad-library.png'
import nextStep from './assets/commissure-ipad-next-step.png'
import overview from './assets/commissure-ipad-overview.png'

const screens = [
  { image: library, label: 'THE COMMISSURE', title: 'A cervical spine atlas' },
  { image: overview, label: 'INTERACTIVE ANATOMY', title: 'Explore the model' },
  { image: explanation, label: 'READ THE STEP', title: 'Learn in context' },
  { image: nextStep, label: 'PROCEDURAL DEPTH', title: 'Follow each sequence' },
]

export default function AppIpad() {
  const selected = Number(new URLSearchParams(window.location.search).get('screen') ?? '1')
  const screen = screens[Math.min(Math.max(selected, 1), screens.length) - 1]

  return (
    <main className="ipadArtboard" aria-label={`The Commissure iPad App Store artwork ${selected}`}>
      <div className="ipadAura" />
      <header className="ipadHeader">
        <p>{screen.label}</p>
        <h1>{screen.title}</h1>
      </header>
      <div className="ipadDevice">
        <img src={screen.image} alt="The Commissure iPad app screen" />
      </div>
      <div className="ipadRule" />
    </main>
  )
}
