import { useEffect, useRef } from 'react';
import { ArticleCard } from '../components/ArticleCard.jsx';
import { AuthorCard } from '../components/AuthorCard.jsx';
import { Footer } from '../components/Footer.jsx';
import { HomeNav } from '../components/HomeNav.jsx';
import { useBodyClass } from '../components/useBodyClass.js';
import { initHomeScene } from '../scenes/index.js';
import '../styles/home.css';

export function Home() {
    const mountRef = useRef(null);

    useBodyClass('home-page');

    useEffect(() => {
        if (!mountRef.current) return undefined;
        return initHomeScene(mountRef.current);
    }, []);

    return (
        <div className="homePage">
            <div ref={mountRef} className="canvas-mount"></div>
            <HomeNav />
            <div className="content hero">
                <div className="text">
                    <div className="title">Visualizing Spine Surgeries in 3D</div>
                    <div className="subtitle">Explore the anatomy, pathology and surgical techniques through interactive 3D models</div>
                </div>
            </div>
            <div className="content article">
                <div className="title">Featured Articles</div>
                <ul className="article-list">
                    <ArticleCard
                        className="article1"
                        to="/pcdf"
                        image="/pcdfsnap.jpeg"
                        header="Posterior Cervical Decompression and Fusion (PCDF)"
                        date="May 17, 2026"
                    >
                        PCDF is a spinal procedure performed to relieve pressure within the spinal canal.
                        It consists of two components: <span className="highlight-red">posterior cervical laminectomy</span> and <span className="highlight-red">posterior cervical instrumentation</span>.
                        Owing to its ability to decompress the spinal cord and provide immediate stabilization, PCDF is a powerful surgical technique that allows surgeons to treat some of the most complex spinal disorders and improve patients’ quality of life.
                    </ArticleCard>
                    <ArticleCard
                        className="ariticle2"
                        to="/acdf"
                        image="/acdfsnap.jpeg"
                        header="Anterior Cervical Discectomy and Fusion (PCDF)"
                        date="May 24, 2026"
                    >
                        Anterior cervical discectomy and fusion (ACDF) is a spinal surgical procedure that aims to relieve neural compression and stabilize the cervical spine.
                        ACDF consists of three main components: <span className="highlight-red">intervertebral disc removal (discectomy)</span>, <span className="highlight-red">interbody cage implantation</span>, and <span className="highlight-red"></span>anterior plate fixation.
                        Compared with posterior cervical decompression and fusion (PCDF), ACDF is performed through an <span className="highlight-red">anterior approach</span>, utilizing a small incision in the front of the neck to access the cervical vertebrae.
                        Owing to this surgical approach, ACDF is particularly effective for treating pathologies involving the anterior structures of the cervical spine.
                    </ArticleCard>
                    <ArticleCard
                        className="article3"
                        to="/pcf"
                        image="/pcfsnap.jpeg"
                        header="Posterior Cervical Foraminotomy (PCF)"
                        date="Jun 18, 2026"
                    >
                        Posterior cervical foraminotomy (PCF) is a spinal surgical technique that relieves pressure on nerves of the neck by removing a small amount of bone from the spine.
                        Compared with some other neck surgeries, a major advantage of PCF is that it allows patients to <span className="highlight-red">maintain normal neck motion</span> even after the surgery.
                        Surgeons may additionally perform surgeries to remove parts of the herniated spinal discs to achieve adequate neural decompression and symptom relief.
                    </ArticleCard>
                </ul>
            </div>
            <div className="content news">
                <div className="title">Latest News</div>
                <ul className="news-list">
                    <li>
                        <span className="header"><a href="">Article on Posterior Cervical Foraminotomy (PCF) is now available</a></span>
                        <span className="date">Jun 18, 2026</span>
                    </li>
                    <li>
                        <span className="header"><a href="">Article on Anterior Cervical Discectomy and Fusion (ACDF) is now available</a></span>
                        <span className="date">May 24, 2026</span>
                    </li>
                    <li>
                        <span className="header"><a href="">Article on Posterior Cervical Decompression and Fusion (ACDF) is now available</a></span>
                        <span className="date">May 17, 2026</span>
                    </li>
                    <li>
                        <span className="header"><a href="">User guideline for The Commissure is now available</a></span>
                        <span className="date">May 10, 2026</span>
                    </li>
                    <li>
                        <span className="header"><a href="">Renewed the website for The Commissure</a></span>
                        <span className="date">May 10, 2026</span>
                    </li>
                    <li>
                        <span className="header"><a href="">Rintaro Imada joined the editorial board</a></span>
                        <span className="date">May 10, 2026</span>
                    </li>
                </ul>
            </div>
            <div className="content about">
                <ul className="about-list">
                    <li><img src="" /></li>
                    <li>
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
            <div className="content authors">
                <div className="title">Featured Authors</div>
                <ul className="author-list">
                    <AuthorCard
                        image=""
                        name="Rintaro Imada"
                        university="Kyoto Prefectural University of Medicine, Kyoto, Japan"
                    >
                        Hello, my name is Rintaro Imada, and I am a fifth-year medical student from Japan.
                        At The Commissure, I am responsible for designing 3D anatomical models and writing articles on spinal disorders and their surgical treatments.
                        I hope that my work helps readers gain a deeper understanding of spine surgery.
                    </AuthorCard>
                    <AuthorCard
                        image="/shinyayamaguchi.jpg"
                        name="Shinya Yamaguchi"
                        university="The University of Tokyo, Tokyo, Japan"
                    >
                        Hello, my name is Shinya Yamaguchi, and I am a sixth-year medical student at the University of Tokyo.
                        My interests lie in diagnostic radiology and medical imaging, and I have carried out imaging research during a research experience at the University of Pennsylvania.
                        At The Commissure, I help bring the project online and share its mission of making accurate, accessible information about spine surgery available to everyone.
                    </AuthorCard>
                    <AuthorCard
                        image=""
                        name="Seteve Johns"
                        university="Tohoku University, Miyagi, Japan"
                    >
                        Hello, my name is Rintaro Imada, and I am a fifth-year medical student from Japan.
                        At The Commissure, I am responsible for designing 3D anatomical models and writing articles on spinal disorders and their surgical treatments.
                        I hope that my work helps readers gain a deeper understanding of spine surgery.
                    </AuthorCard>
                    <AuthorCard
                        image=""
                        name="Marvin Kojima"
                        university="University of Pennsylvania, PA, USA"
                    >
                        Hello, my name is Rintaro Imada, and I am a fifth-year medical student from Japan.
                        At The Commissure, I am responsible for designing 3D anatomical models and writing articles on spinal disorders and their surgical treatments.
                        I hope that my work helps readers gain a deeper understanding of spine surgery.
                    </AuthorCard>
                </ul>
            </div>
            <div className="content display"></div>
            <Footer />
        </div>
    );
}
