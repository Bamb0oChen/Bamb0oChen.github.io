import '../styles/personal-profile.css';

const currentWork = [
    {
        title: 'Consumer electronics for desk setups',
        detail: 'I lead software development and community building for our first product.',
    },
    {
        title: 'Software and infrastructure at Koala Studio',
        detail: 'On the Information Resources team, I build tools for recruiting and internal operations and help run the studio’s servers and network.',
    },
    {
        title: 'LLMs, NLP, and infrastructure',
        detail: 'I’m exploring how language models and NLP systems are built and what it takes to run them in practice.',
    },
];

export default function PersonalProfile() {
    return (
        <section id="about" className="personal-profile" lang="en" aria-labelledby="profile-name">
            <div className="profile-identity">
                <img className="profile-photo" src="images/profile/yanzhu-chen.png" alt="Yanzhu Chen outdoors"
                    width="270" height="318" loading="lazy" decoding="async" />
                <div className="profile-metadata">
                    <h2 id="profile-name">Yanzhu Chen</h2>
                    <p className="profile-affiliation">Undergraduate, Zhejiang University</p>
                    <p className="profile-program">Agricultural Engineering · Minor in Economics</p>
                    <p className="profile-location">Hangzhou, China</p>
                    <nav className="profile-links" aria-label="Profile links">
                        <a href="https://github.com/Bamb0oChen">GitHub</a>
                        <a href="https://bamb0ochen.com/notes/">Notes</a>
                    </nav>
                </div>
            </div>

            <div className="profile-section">
                <h3>About</h3>
                <p>I’m on the leadership team at Koala Studio, a student-led technology organization at Zhejiang University,
                    and I serve as CTO of a Hangzhou-based startup. I’m currently looking for new opportunities and collaborations.</p>
            </div>

            <div className="profile-section">
                <h3>Current work</h3>
                <dl className="profile-work">
                    {currentWork.map(({ title, detail }) => (
                        <div key={title}>
                            <dt>{title}</dt>
                            <dd>{detail}</dd>
                        </div>
                    ))}
                </dl>
            </div>
        </section>
    );
}
