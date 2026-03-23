import Navbar from '../../components/Navbar'

export default function BKFKClubPage() {
    // Placeholder data for the BKFK Book Club
    const announcements = [
        {
            id: 1,
            title: "📖 March Book Pick: 'Kafka on the Shore' by Haruki Murakami",
            date: "March 20, 2026",
            content: "This month we're diving into Murakami's magical realist masterpiece! Grab your copy from the IZTECH library (Shelf B-14) and join us for discussion sessions every Thursday at 18:00 in the Student Center.",
            pinned: true,
        },
        {
            id: 2,
            title: "🎉 BKFK End-of-Semester Reading Marathon",
            date: "March 18, 2026",
            content: "Join us for a 12-hour reading marathon on April 5th! We'll have snacks, cozy reading corners, and mini book swap sessions. Sign up at our table in the cafeteria.",
            pinned: false,
        },
        {
            id: 3,
            title: "🏆 February Reading Challenge Winners",
            date: "March 5, 2026",
            content: "Congratulations to Elif Ö. (1st place, 7 books!), Mehmet K. (2nd, 5 books), and Ayşe Y. (3rd, 4 books). Prizes can be collected from the club room!",
            pinned: false,
        },
        {
            id: 4,
            title: "📅 Weekly Meetings Resume!",
            date: "February 28, 2026",
            content: "Our weekly Thursday meeting schedule is back! Every week at 18:00 in the Student Center, Room 203. New members always welcome — just show up!",
            pinned: false,
        },
    ]

    const polls = [
        {
            id: 1,
            question: "What genre should our April book pick be?",
            options: [
                { label: "Science Fiction", votes: 24, emoji: "🚀" },
                { label: "Classic Literature", votes: 18, emoji: "📜" },
                { label: "Mystery / Thriller", votes: 31, emoji: "🔍" },
                { label: "Non-Fiction", votes: 12, emoji: "📊" },
            ],
            totalVotes: 85,
            endsIn: "3 days",
            active: true,
        },
        {
            id: 2,
            question: "Best meeting time for next semester?",
            options: [
                { label: "Weekdays 17:00", votes: 15, emoji: "🌇" },
                { label: "Weekdays 19:00", votes: 28, emoji: "🌙" },
                { label: "Saturdays 14:00", votes: 22, emoji: "☀️" },
            ],
            totalVotes: 65,
            endsIn: "Ended",
            active: false,
        },
    ]

    const upcomingEvents = [
        { date: "Mar 27", title: "Weekly Discussion: Kafka on the Shore Ch. 1-10", location: "Student Center 203" },
        { date: "Apr 03", title: "Weekly Discussion: Kafka on the Shore Ch. 11-25", location: "Student Center 203" },
        { date: "Apr 05", title: "🎉 Reading Marathon (12 hours!)", location: "Library Ground Floor" },
        { date: "Apr 10", title: "Weekly Discussion: Kafka on the Shore Final Chapters", location: "Student Center 203" },
        { date: "Apr 17", title: "April Book Reveal + Pizza Night", location: "Student Center 203" },
    ]

    return (
        <>
            <Navbar />

            {/* Club Hero Banner */}
            <header className="club-hero">
                <div className="club-hero-bg"></div>
                <div className="container club-hero-content">
                    <div className="club-hero-badge">📚 IZTECH Book Club</div>
                    <h1 className="club-hero-title">BKFK <span className="highlight">Book Club</span></h1>
                    <p className="club-hero-subtitle">
                        Bir Kitap Farklı Kafalar — Bringing IZTECH readers together since 2023.
                        Read together, discuss together, grow together.
                    </p>
                    <div className="club-stats-row">
                        <div className="club-stat">
                            <span className="club-stat-number">42</span>
                            <span className="club-stat-label">Members</span>
                        </div>
                        <div className="club-stat">
                            <span className="club-stat-number">28</span>
                            <span className="club-stat-label">Books Read</span>
                        </div>
                        <div className="club-stat">
                            <span className="club-stat-number">120+</span>
                            <span className="club-stat-label">Meetings</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="club-main">
                <div className="container">
                    <div className="club-layout">

                        {/* Main Column */}
                        <div className="club-content">

                            {/* Announcements Section */}
                            <section className="club-section">
                                <div className="club-section-header">
                                    <h2>📢 Announcements</h2>
                                </div>
                                <div className="announcements-list">
                                    {announcements.map((a) => (
                                        <article key={a.id} className={`announcement-card${a.pinned ? ' pinned' : ''}`}>
                                            {a.pinned && <span className="pin-badge">📌 Pinned</span>}
                                            <h3>{a.title}</h3>
                                            <span className="announcement-date">{a.date}</span>
                                            <p>{a.content}</p>
                                        </article>
                                    ))}
                                </div>
                            </section>

                            {/* Polls Section */}
                            <section className="club-section">
                                <div className="club-section-header">
                                    <h2>🗳️ Polls</h2>
                                </div>
                                <div className="polls-list">
                                    {polls.map((poll) => (
                                        <div key={poll.id} className={`poll-card${poll.active ? '' : ' ended'}`}>
                                            <div className="poll-header">
                                                <h3>{poll.question}</h3>
                                                <span className={`poll-status ${poll.active ? 'active' : 'closed'}`}>
                                                    {poll.active ? `⏳ Ends in ${poll.endsIn}` : '✅ Ended'}
                                                </span>
                                            </div>
                                            <div className="poll-options">
                                                {poll.options.map((opt, i) => {
                                                    const pct = Math.round((opt.votes / poll.totalVotes) * 100)
                                                    return (
                                                        <div key={i} className="poll-option">
                                                            <div className="poll-option-bar">
                                                                <div
                                                                    className="poll-option-fill"
                                                                    style={{ width: `${pct}%` }}
                                                                ></div>
                                                                <span className="poll-option-label">
                                                                    {opt.emoji} {opt.label}
                                                                </span>
                                                                <span className="poll-option-pct">{pct}%</span>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                            <div className="poll-footer">
                                                <span>{poll.totalVotes} votes</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Current Reading Section */}
                            <section className="club-section">
                                <div className="club-section-header">
                                    <h2>📖 Currently Reading</h2>
                                </div>
                                <div className="current-reading-card">
                                    <div className="current-book-cover" style={{
                                        background: 'linear-gradient(135deg, #2d6a4f 0%, #1b4030 100%)'
                                    }}>
                                        <span className="book-spine"></span>
                                        <div className="book-title-cover">Kafka on the Shore</div>
                                    </div>
                                    <div className="current-book-info">
                                        <h3>Kafka on the Shore</h3>
                                        <p className="current-book-author">Haruki Murakami</p>
                                        <div className="reading-progress">
                                            <div className="progress-label">
                                                <span>Club Progress</span>
                                                <span>Chapter 15 / 49</span>
                                            </div>
                                            <div className="progress-bar">
                                                <div className="progress-fill" style={{ width: '31%' }}></div>
                                            </div>
                                        </div>
                                        <p className="current-book-desc">
                                            Kafka Tamura runs away from home at fifteen, landing in a small library in Takamatsu.
                                            Meanwhile, an old man named Nakata can talk to cats. Two stories converge in this
                                            genre-defying masterpiece.
                                        </p>
                                        <div className="current-book-tags">
                                            <span className="tag">Magical Realism</span>
                                            <span className="tag">Japanese Literature</span>
                                            <span className="tag">2002</span>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Sidebar */}
                        <aside className="club-sidebar">
                            {/* About */}
                            <div className="club-sidebar-card">
                                <h3>ℹ️ About BKFK</h3>
                                <p>
                                    <strong>Bir Kitap Farklı Kafalar</strong> — One Book, Different Minds.
                                    We're IZTECH's student-run book club dedicated to fostering a love of reading across campus.
                                </p>
                                <div className="club-contact">
                                    <p>📍 Student Center, Room 203</p>
                                    <p>📅 Every Thursday, 18:00</p>
                                    <p>📧 bkfk@std.iyte.edu.tr</p>
                                    <p>📸 @bkfk_iztech</p>
                                </div>
                            </div>

                            {/* Upcoming Events */}
                            <div className="club-sidebar-card">
                                <h3>📅 Upcoming Events</h3>
                                <ul className="events-list">
                                    {upcomingEvents.map((evt, i) => (
                                        <li key={i} className="event-item">
                                            <span className="event-date">{evt.date}</span>
                                            <div className="event-info">
                                                <span className="event-title">{evt.title}</span>
                                                <span className="event-location">📍 {evt.location}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Past Reads */}
                            <div className="club-sidebar-card">
                                <h3>📚 Past Reads</h3>
                                <ul className="past-reads-list">
                                    <li>
                                        <span className="past-read-title">The Alchemist</span>
                                        <span className="past-read-author">Paulo Coelho</span>
                                    </li>
                                    <li>
                                        <span className="past-read-title">1984</span>
                                        <span className="past-read-author">George Orwell</span>
                                    </li>
                                    <li>
                                        <span className="past-read-title">Sapiens</span>
                                        <span className="past-read-author">Yuval Noah Harari</span>
                                    </li>
                                    <li>
                                        <span className="past-read-title">Norwegian Wood</span>
                                        <span className="past-read-author">Haruki Murakami</span>
                                    </li>
                                    <li>
                                        <span className="past-read-title">Kürk Mantolu Madonna</span>
                                        <span className="past-read-author">Sabahattin Ali</span>
                                    </li>
                                </ul>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>
        </>
    )
}
