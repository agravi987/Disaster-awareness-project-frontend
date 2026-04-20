import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    FiActivity,
    FiAlertTriangle,
    FiArrowRight,
    FiBookOpen,
    FiCheckCircle,
    FiMap,
    FiShield,
    FiUsers,
} from 'react-icons/fi';

const Home = () => {
    const { user } = useAuth();
    const dashboardLink = user?.role === 'teacher' ? '/teacher' : '/student';

    return (
        <div className="min-h-screen text-[rgb(var(--text))] relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-32 -left-20 h-[360px] w-[360px] rounded-full bg-sky-400/20 blur-3xl" />
                <div className="absolute top-12 right-0 h-[300px] w-[300px] rounded-full bg-cyan-300/20 blur-3xl" />
            </div>

            <header className="sticky top-0 z-50 border-b border-[rgb(var(--border))] bg-[rgb(var(--surface))]/90 backdrop-blur">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-600 to-sky-700 text-white shadow-lg">
                            <FiShield size={18} />
                        </div>
                        <div>
                            <p className="text-lg font-extrabold tracking-tight">DisasterLearn</p>
                            <p className="text-xs text-[rgb(var(--text-muted))]">Preparedness learning for students and educators</p>
                        </div>
                    </div>

                    <nav className="flex items-center gap-3">
                        {user ? (
                            <Link to={dashboardLink} className="btn btn-primary">
                                Open Dashboard <FiArrowRight />
                            </Link>
                        ) : (
                            <>
                                <Link to="/login/student" className="btn btn-outline">
                                    Student Login
                                </Link>
                                <Link to="/login/teacher" className="btn btn-primary">
                                    Teacher Login
                                </Link>
                            </>
                        )}
                    </nav>
                </div>
            </header>

            <main className="relative z-10 mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 md:py-14">
                <section className="grid items-start gap-8 rounded-[28px] border border-[rgb(var(--border))] bg-[rgb(var(--surface))]/95 p-6 shadow-[var(--shadow-md)] md:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] md:p-8">
                    <div className="max-w-3xl">
                        <span className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.18em] text-cyan-700">
                            <FiActivity /> Clear Campus Readiness
                        </span>

                        <h1 className="mt-5 text-4xl font-extrabold leading-tight md:text-6xl">
                            Learn disaster response,
                            <span className="block text-cyan-700">track live hazards, and act with confidence.</span>
                        </h1>

                        <p className="mt-5 max-w-2xl text-base leading-7 text-[rgb(var(--text-muted))] md:text-lg">
                            DisasterLearn brings together preparedness courses, quizzes, alerts, and a live disaster map
                            so the website is not just informative, but immediately useful during real situations.
                        </p>

                        <div className="mt-7 flex flex-wrap gap-3">
                            {user ? (
                                <Link to={dashboardLink} className="btn btn-primary px-6 py-3 text-base">
                                    Continue to Dashboard <FiArrowRight />
                                </Link>
                            ) : (
                                <>
                                    <Link to="/login/student" className="btn btn-primary px-6 py-3 text-base">
                                        Enter as Student
                                    </Link>
                                    <Link to="/login/teacher" className="btn btn-outline px-6 py-3 text-base">
                                        Enter as Teacher
                                    </Link>
                                </>
                            )}
                        </div>

                        <div className="mt-8 grid gap-4 md:grid-cols-3">
                            {[
                                {
                                    title: 'Guided learning',
                                    text: 'Courses and quizzes explain what to do before, during, and after a disaster.',
                                    icon: <FiBookOpen />,
                                },
                                {
                                    title: 'Live hazard awareness',
                                    text: 'The map shows real incident and weather data around a selected location.',
                                    icon: <FiMap />,
                                },
                                {
                                    title: 'Teacher coordination',
                                    text: 'Educators can assign learning, track progress, and push updates quickly.',
                                    icon: <FiUsers />,
                                },
                            ].map((item) => (
                                <article key={item.title} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-soft))] p-4">
                                    <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-cyan-700 shadow-sm">
                                        {item.icon}
                                    </div>
                                    <h3 className="text-base font-bold">{item.title}</h3>
                                    <p className="mt-2 text-sm leading-6 text-[rgb(var(--text-muted))]">{item.text}</p>
                                </article>
                            ))}
                        </div>
                    </div>

                    <aside className="rounded-[24px] border border-[rgb(var(--border))] bg-slate-950 p-6 text-slate-100 shadow-xl">
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">What you can do here</p>
                        <div className="mt-5 space-y-4">
                            {[
                                'Search a city or district and review current disaster incidents on the live map.',
                                'Learn preparedness steps through structured courses and short awareness videos.',
                                'Get notification updates when teachers assign work or students complete tasks.',
                            ].map((item) => (
                                <div key={item} className="flex items-start gap-3">
                                    <span className="mt-0.5 text-cyan-300"><FiCheckCircle /></span>
                                    <p className="text-sm leading-6 text-slate-200">{item}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                            <div className="flex items-center gap-3">
                                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-300">
                                    <FiAlertTriangle />
                                </span>
                                <div>
                                    <p className="text-sm font-bold">Map data now uses actual live feeds</p>
                                    <p className="text-xs leading-5 text-slate-400">
                                        Earthquakes, open natural hazards, local weather, and related headlines are shown together.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </aside>
                </section>

                <section className="grid gap-5 md:grid-cols-3">
                    {[
                        {
                            title: 'Students',
                            text: 'Open your dashboard, continue assigned learning, and use the live map for location awareness.',
                            cta: 'Student Portal',
                            link: user ? dashboardLink : '/login/student',
                        },
                        {
                            title: 'Teachers',
                            text: 'Manage courses, monitor student progress, and keep learners informed with notifications.',
                            cta: 'Teacher Portal',
                            link: user ? dashboardLink : '/login/teacher',
                        },
                        {
                            title: 'Preparedness workflow',
                            text: 'Learn the topic, check the map, review latest news, and take action with better context.',
                            cta: user ? 'Open Dashboard' : 'Get Started',
                            link: user ? dashboardLink : '/register',
                        },
                    ].map((card) => (
                        <article key={card.title} className="card">
                            <h2 className="text-xl font-extrabold">{card.title}</h2>
                            <p className="mt-3 text-sm leading-6 text-[rgb(var(--text-muted))]">{card.text}</p>
                            <Link to={card.link} className="mt-5 inline-flex items-center gap-2 font-semibold text-[rgb(var(--primary))]">
                                {card.cta} <FiArrowRight />
                            </Link>
                        </article>
                    ))}
                </section>
            </main>
        </div>
    );
};

export default Home;
