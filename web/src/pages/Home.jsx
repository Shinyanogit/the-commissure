import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArticleCard } from '../components/ArticleCard.jsx';
import { AuthorCard } from '../components/AuthorCard.jsx';
import { Footer } from '../components/Footer.jsx';
import { HomeNav } from '../components/HomeNav.jsx';
import { useBodyClass } from '../components/useBodyClass.js';
import { initHomeScene } from '../scenes/index.js';
import '../styles/home.css';

gsap.registerPlugin(ScrollTrigger);

export function Home() {
    const pageRef = useRef(null);
    const mountRef = useRef(null);
    const heroRef = useRef(null);
    const titleRef = useRef(null);
    const subtitleRef = useRef(null);
    const primaryCtaRef = useRef(null);
    const secondaryCtaRef = useRef(null);
    const indicatorRef = useRef(null);
    const sectionsRef = useRef([]);

    useBodyClass('home-page');

    useEffect(() => {
        if (!mountRef.current) return undefined;
        return initHomeScene(mountRef.current);
    }, []);

    useEffect(() => {
        if (!pageRef.current || !heroRef.current) return undefined;

        const ctx = gsap.context(() => {
            const title = titleRef.current;
            const subtitle = subtitleRef.current;
            const ctas = [primaryCtaRef.current, secondaryCtaRef.current].filter(Boolean);
            const indicator = indicatorRef.current;

            const timeline = gsap.timeline({ defaults: { duration: 0.7, ease: 'power3.out' } });

            if (title) {
                timeline.fromTo(title, { y: 30, opacity: 0 }, { y: 0, opacity: 1 }, 0);
            }

            if (subtitle) {
                timeline.fromTo(subtitle, { y: 20, opacity: 0 }, { y: 0, opacity: 1 }, '-=0.6');
            }

            if (ctas.length > 0) {
                timeline.fromTo(ctas, { y: 18, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.12 }, '-=0.6');
            }

            if (indicator) {
                timeline.fromTo(indicator, { y: 12, opacity: 0 }, { y: 0, opacity: 1 }, '-=0.4');
            }

            const reveals = sectionsRef.current.filter(Boolean);
            reveals.forEach((section, index) => {
                gsap.fromTo(section, {
                    y: 40,
                    opacity: 0,
                    scale: 0.98,
                }, {
                    y: 0,
                    opacity: 1,
                    scale: 1,
                    duration: 0.5,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: section,
                        start: 'top 90%',
                        once: true,
                    },
                    onComplete: () => section.classList.add('is-visible'),
                });
            });
        }, pageRef);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={pageRef} className='homePage' id="top">
            <div ref={mountRef} className="canvas-mount"></div>
            <div className="ambient ambient-one"></div>
            <div className="ambient ambient-two"></div>
            <HomeNav />
            <div ref={heroRef} className="content hero">
                <div className="hero-shell">
                    <div className="text">
                        <div className="eyebrow">Immersive spine surgery education</div>
                        <div ref={titleRef} className="title">Visualizing Spine Surgeries in 3D</div>
                        <div ref={subtitleRef} className="subtitle">Explore the anatomy, pathology and surgical techniques through interactive 3D models designed for clarity and curiosity.</div>
                        <div className="hero-actions">
                            <a ref={primaryCtaRef} href="#articles" className="primary-cta">Explore procedures</a>
                            <a ref={secondaryCtaRef} href="#about" className="secondary-cta">Meet the mission</a>
                        </div>
                    </div>
                </div>
                <div ref={indicatorRef} className="scroll-indicator" aria-hidden="true">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
            <div ref={(node) => { sectionsRef.current[0] = node; }} className="content article" id="articles">
                <div className="section-heading">
                    <div className="eyebrow">Featured articles</div>
                    <div className="title">A modern atlas of cervical surgery</div>
                </div>
                <ul className="article-list">
                    <ArticleCard
                        className="article1"
                        to="/pcdf"
                        image="/pcdfsnap.webp"
                        header="Posterior Cervical Decompression and Fusion (PCDF)"
                        date="May 17, 2026"
                    >
                        PCDF is a spinal procedure performed to relieve compression of the spinal cord and nerves through a posterior approach. 
                        It consists of two major components: posterior cervical laminectomy and posterior cervical fixation. 
                        Owing to its ability to decompress the spinal cord and provide stabilization, PCDF is a powerful surgical technique…
                    </ArticleCard>
                    <ArticleCard
                        className="article2"
                        to="/acdf"
                        image="/acdfsnap.webp"
                        header="Anterior Cervical Discectomy and Fusion (ACDF)"
                        date="May 24, 2026"
                    >
                        Anterior cervical discectomy and fusion (ACDF) is a surgical procedure that aims to relieve compression on the spinal cord and stabilize the cervical spine. 
                        ACDF consists of three main procedures: anterior cervical discectomy, interbody cage implantation, and anterior cervical fixation. 
                        Compared with posterior cervical decompression and fusion (PCDF), ACDF is…
                    </ArticleCard>
                    <ArticleCard
                        className="article3"
                        to="/pcf"
                        image="/pcfsnap.webp"
                        header="Posterior Cervical Foraminotomy (PCF)"
                        date="Jun 18, 2026"
                    >
                        Posterior cervical foraminotomy (PCF) is a surgical procedure that relieves pressure on spine cord and nerves by widening the neural foramen posteriorly. 
                        A major advantage of PCF is that it allows patients to preserve range of motion after the surgery. 
                        During the procedure, surgeons may additionally perform discectomy or osteophytectomy to…
                    </ArticleCard>
                </ul>
                <div className="article-view-more-wrap">
                    <Link to="/articles" className="article-view-more">View more</Link>
                </div>
            </div>
            <div ref={(node) => { sectionsRef.current[1] = node; }} className="content news">
                <div className="section-heading">
                    <div className="eyebrow">Latest news</div>
                    <div className="title">Updates from the editorial team</div>
                </div>
                <ul className="news-list">
                    <li>
                        <span className="header"><Link to="/pcl_open">Article on Open Door Posterior Cervical Laminoplasty (Open-door PCL) is now available</Link></span>
                        <span className="date">Aug 15, 2026</span>
                    </li>
                    <li>
                        <span className="header"><a href="">Koki Tokida joined the editorial board</a></span>
                        <span className="date">Jun 27, 2026</span>
                    </li>
                    <li>
                        <span className="header"><Link to="/accf">Article on Anterior Cervical Corpectomy and Fusion (ACCF) is now available</Link></span>
                        <span className="date">Jun 27, 2026</span>
                    </li>
                    <li>
                        <span className="header"><a href="">Shinya Yamaguchi joined the editorial board</a></span>
                        <span className="date">Jun 26, 2026</span>
                    </li>
                    <li>
                        <span className="header"><Link to="/pcf">Article on Posterior Cervical Foraminotomy (PCF) is now available</Link></span>
                        <span className="date">Jun 18, 2026</span>
                    </li>
                    <li>
                        <span className="header"><Link to="/acdf">Article on Anterior Cervical Discectomy and Fusion (ACDF) is now available</Link></span>
                        <span className="date">May 24, 2026</span>
                    </li>
                </ul>
            </div>
            <div ref={(node) => { sectionsRef.current[2] = node; }} className="content about" id="about">
                <ul className="about-list">
                    <li><img src="/about.webp" alt="Medical illustration" /></li>
                    <li>
                        <div className="eyebrow">About the project</div>
                        <div className="title">What we owe to the society</div>
                        <div className="paragraph">
                            We are a group of medical students dedicated to improving the lives of patients suffering from spinal disorders.
                            We believe that, as future physicians, we have a responsibility to understand the underlying principles of spinal diseases and their treatments.
                            We also believe in the importance of providing accurate, accessible, and visually engaging medical information to society, whether for healthcare professionals, patients, or the general public.
                            With this mission in mind, we created a platform where people, regardless of their background, can access reliable and easy-to-understand information about the complex concepts and procedures involved in spine surgery.
                        </div>
                    </li>
                </ul>
            </div>
            <div ref={(node) => { sectionsRef.current[3] = node; }} className="content authors" id="authors">
                <div className="section-heading">
                    <div className="eyebrow">Featured authors</div>
                    <div className="title">The minds shaping the experience</div>
                </div>
                <ul className="author-list">
                    <AuthorCard
                        image="/rintaroimada.webp"
                        name="Rintaro Imada"
                        university="Kyoto Prefectural University of Medicine, Kyoto, Japan"
                    >
                        Hello, my name is Rintaro Imada, and I am a fifth-year medical student from Japan.
                        I am dedicated to eliminating preventable trauma deaths from the modern trauma care system.
                        At The Commissure, I am responsible for designing 3D anatomical models and writing articles on spinal disorders and their surgical treatments. 
                        I hope that my work helps readers gain a deeper understanding of spine surgery.
                    </AuthorCard>
                    <AuthorCard
                        image="/shinyayamaguchi.webp"
                        name="Shinya Yamaguchi"
                        university="The University of Tokyo, Tokyo, Japan"
                        href="https://shinyanogit.github.io/"
                    >
                        Hello, my name is Shinya Yamaguchi, and I am a sixth-year medical student at the University of Tokyo.
                        My interests lie in diagnostic radiology and medical imaging, and I have carried out imaging research during a research experience at the University of Pennsylvania.
                        At The Commissure, I help bring the project online and share its mission of making accurate, accessible information about spine surgery available to everyone.
                    </AuthorCard>
                    <AuthorCard
                        image="/kokitokida.webp"
                        name="Koki Tokida"
                        university="Tohoku University, Sendai, Japan"
                    >
                        Hello, my name is Koki Tokida, and I am a sixth-year medical student at Tohoku University in Japan. 
                        I aspire to become a neurosurgeon-scientist with a special focus on skull base surgery, neurosurgical oncology, and translational research. 
                        I have several years of research experience in brain tumor biology and have observed neurosurgical practice, including a wide range of spinal surgeries, both in Japan and overseas. 
                        At The Commissure, I contribute to developing educational content on spine surgery and anatomy. 
                        Through this work, I hope to help readers gain a deeper understanding of neuro-spinal diseases and the sophisticated surgical approaches used to treat them.
                    </AuthorCard>
                </ul>
            </div>
            <div className="content display"></div>
            <Footer />
        </div>
    );
}
