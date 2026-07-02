import { useTiltCard } from './useTiltCard.js';

export function AuthorCard({ image, name, university, children }) {
    const { cardRef, handleMouseMove, handleMouseLeave } = useTiltCard();

    return (
        <li
            className="author-card"
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <a href="">
                <div className="image-shell">
                    <img src={image} alt={name} />
                </div>
                <div className="card-copy">
                    <div className="name">{name}</div>
                    <div className="university">{university}</div>
                    <div className="biography">{children}</div>
                </div>
            </a>
        </li>
    );
}
