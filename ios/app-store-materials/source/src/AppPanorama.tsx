import appIcon from './assets/commissure-app-icon.png'
import explanation from './assets/commissure-explanation.png'
import homeSpine from './assets/commissure-home-spine.jpg'
import nextStep from './assets/commissure-next-step.png'
import overview from './assets/commissure-overview.png'
import wordmark from './assets/commissure-wordmark.png'

export default function AppPanorama() {
  return (
    <main className="artboard" aria-label="The Commissure App Store artwork master">
      <section className="panel panelBrand">
        <img className="brandSpine" src={homeSpine} alt="" />
        <div className="brandShade" />
        <div className="brandContent">
          <img className="appIcon" src={appIcon} alt="The Commissure app icon" />
          <img className="wordmark" src={wordmark} alt="The Commissure" />
          <p className="eyebrow">CERVICAL SPINE ATLAS</p>
          <p className="tagline">Explore the anatomy.<br />Understand each step.</p>
        </div>
      </section>

      <section className="panel panelAnatomy">
        <p className="panelLabel">INTERACTIVE ANATOMY</p>
        <div className="screenDevice overviewDevice">
          <img src={overview} alt="ACDF anatomy overview" />
        </div>
      </section>

      <section className="panel panelTeaching">
        <p className="panelLabel">READ THE STEP</p>
        <div className="screenDevice explanationCrop">
          <img src={explanation} alt="ACDF explanation with highlighted terminology" />
        </div>
        <p className="teachingCaption">EXPLANATION IN CONTEXT</p>
      </section>

      <section className="panel panelDepth">
        <p className="panelLabel">PROCEDURAL DEPTH</p>
        <div className="screenDevice nextStepCrop">
          <img src={nextStep} alt="ACDF next step anatomy view" />
        </div>
      </section>
    </main>
  )
}
