import { Footer } from '../components/Footer.jsx';
import { HomeNav } from '../components/HomeNav.jsx';
import { useBodyClass } from '../components/useBodyClass.js';
import '../styles/home.css';

const SUPPORT_EMAIL = 'vocabryreview@gmail.com';

function LegalLayout({ eyebrow, title, children }) {
    useBodyClass('home-page');

    return (
        <div className="homePage legalPage">
            <HomeNav />
            <main className="content legal-shell">
                <div className="legal-heading">
                    <p className="eyebrow">{eyebrow}</p>
                    <h1>{title}</h1>
                </div>
                <article className="legal-card">{children}</article>
            </main>
            <Footer />
        </div>
    );
}

function ContactLink() {
    return <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>;
}

export function SupportPage() {
    return (
        <LegalLayout eyebrow="The Commissure" title="Support">
            <p>
                The Commissure is an educational 3D atlas of cervical spine
                procedures. It is not clinical advice and is not a substitute for
                supervised surgical training.
            </p>
            <section>
                <h2>Contact</h2>
                <p>
                    For questions, accessibility feedback, bug reports, or support,
                    email <ContactLink />.
                </p>
            </section>
            <section>
                <h2>When reporting an issue</h2>
                <p>
                    Please include the app version, iPhone or iPad model, iOS version,
                    procedure and step being viewed, and what happened. Do not send
                    patient information.
                </p>
            </section>
            <section>
                <h2>Using the app</h2>
                <p>
                    No account is required. The four included procedures work offline.
                    You can move through the procedure controls, use direct step
                    selection, rotate or zoom the model, and change the explanation
                    language in the app.
                </p>
            </section>
            <section>
                <h2>Privacy</h2>
                <p>
                    The current iOS version does not collect personal data, use
                    analytics, or include advertising. Read the <a href="/privacy">Privacy Policy</a> for details.
                </p>
            </section>
        </LegalLayout>
    );
}

export function PrivacyPage() {
    return (
        <LegalLayout eyebrow="The Commissure" title="Privacy Policy">
            <p className="legal-date">Effective September 20, 2026</p>
            <p>
                This policy applies to The Commissure iOS app. It describes the
                current version distributed as an educational, offline-first 3D atlas.
            </p>
            <section>
                <h2>Data the app does not collect</h2>
                <p>
                    The app does not require an account and does not collect, sell, or
                    share personal information. It does not use analytics, advertising,
                    tracking, health-data, or social-network SDKs.
                </p>
            </section>
            <section>
                <h2>On-device information</h2>
                <p>
                    The app stores your selected language and last viewed procedure step
                    on your device so that the interface can restore them. This
                    information is not transmitted to us.
                </p>
            </section>
            <section>
                <h2>Links and support email</h2>
                <p>
                    If you choose to open a website link or email support, that action
                    is handled by your browser or email provider. Messages you choose to
                    send to <ContactLink /> are used only to respond to the request.
                    Please do not include patient information.
                </p>
            </section>
            <section>
                <h2>Changes</h2>
                <p>
                    If a future app version changes how information is handled, this
                    policy will be updated before that version is released. Questions
                    about this policy can be sent to <ContactLink />.
                </p>
            </section>
        </LegalLayout>
    );
}
