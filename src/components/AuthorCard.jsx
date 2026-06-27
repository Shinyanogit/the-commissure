export function AuthorCard({ image, name, university, children }) {
    return (
        <li className="author-card">
            <a href="">
                <img src={image} />
                <div className="name">{name}</div>
                <div className="university">{university}</div>
                <div className="biography">{children}</div>
            </a>
        </li>
    );
}
